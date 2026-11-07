// API de synthèse côté page. Découpe le texte, envoie un morceau à la fois au worker
// (src/tts-worker.js), recolle les WAV. Le texte ne quitte jamais le navigateur.
import { splitIntoParts, titlePauses, speedToLengthScale, detectLanguage, hasDutch, languageSegments } from "./text.js";
import { spokenText } from "./spoken.js";
import { concatWavs, concatWavsAsync, concatWavBlobs, parseWav, padWav, wavDuration } from "./audio.js";
import { createSpeechCache } from "./speech-cache.js";

export const VOICES = { jessica: "fr_FR-upmc-medium", tom: "fr_FR-tom-medium" };
// Texte anglais : mêmes positions du bouton, voix anglaises libres de droits
// (Kristin : LibriVox, domaine public ; Joe : CC0).
export const ENGLISH_VOICES = { jessica: "en_US-kristin-medium", tom: "en_US-joe-medium" };
// Néerlandais de Belgique, pour les lexiques NL–FR (rdh : CC0, entraînée de zéro).
export const DUTCH_VOICES = { jessica: "nl_BE-nathalie-medium", tom: "nl_BE-rdh-medium" };

function ttsError(kind, message) {
  const err = new Error(message);
  err.kind = kind; // "network" | "other" | "cancelled"
  return err;
}

const voiceIdOf = (voice, lang = "fr") => {
  const voices = lang === "en" ? ENGLISH_VOICES : lang === "nl" ? DUTCH_VOICES : VOICES;
  const id = Object.hasOwn(voices, voice) ? voices[voice] : null;
  if (!id) throw ttsError("other", `voix inconnue : ${voice}`);
  return id;
};

// Combien de moteurs en parallèle, et combien de fils de calcul chacun.
// Plusieurs fils exigent une page isolée (crossOriginIsolated, voir src/offline-worker.js) ;
// sans elle, plusieurs moteurs à un fil vont presque aussi vite. Mesuré sur un Mac à
// 10 cœurs (scripts/benchmark-vitesse.mjs, secondes d'audio par seconde) : 1 moteur 7-8,
// 3 moteurs 16-17, isolé 2 moteurs × 4 fils 18-21. Chaque moteur garde son modèle en
// mémoire : un seul sur petit appareil, et sur téléphone quand la mémoire est inconnue (iPhone).
export function enginePlan({ cores = 4, isolated = false, memoryGb, mobile = false } = {}) {
  const small = cores < 4 || (memoryGb === undefined ? mobile : memoryGb < 4);
  if (isolated) {
    const workers = small ? 1 : 2;
    return { workers, threads: Math.max(1, Math.min(4, Math.floor(cores / workers))) };
  }
  return { workers: small ? 1 : cores >= 8 ? 3 : 2, threads: 1 };
}

function defaultPlan() {
  const nav = globalThis.navigator ?? {};
  const mobile = !!globalThis.matchMedia?.("(pointer: coarse)").matches;
  return enginePlan({ cores: nav.hardwareConcurrency || 4, isolated: !!globalThis.crossOriginIsolated, memoryGb: nav.deviceMemory, mobile });
}

export function createTts({ workers: maxWorkers, threads } = {}) {
  const cache = createSpeechCache();
  const plan = defaultPlan();
  maxWorkers ??= plan.workers;
  threads ??= plan.threads;
  let pool = []; // moteurs qui reçoivent les nouvelles demandes
  // Voix déjà écrites dans le cache OPFS par un moteur. Tant qu'une voix n'y est pas,
  // un seul moteur la prépare : deux téléchargements simultanés écriraient le même fichier.
  const warm = new Set();
  let nextId = 1;
  let generation = 0; // change à chaque cancel() : les synthèses lancées avant s'arrêtent
  let activeSynths = 0;
  const controllers = new Set();
  const pending = new Map(); // id → { w, resolve, reject, onProgress }

  const load = (w) => [...pending.values()].filter((p) => p.w === w).length;

  function rejectAll(err) {
    const workers = new Set([...pending.values()].map((p) => p.w));
    for (const p of pending.values()) p.reject(err);
    pending.clear();
    for (const w of workers) w.terminate();
  }

  function retire(w) {
    pool = pool.filter((x) => x !== w);
  }

  function spawn() {
    // Même empreinte de version que ce module (voir scripts/stamp-version.mjs).
    const url = new URL("./tts-worker.js", import.meta.url);
    url.search = new URL(import.meta.url).search;
    const w = new Worker(url, { type: "module" });
    w.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      if (data.type === "progress") {
        p.onProgress?.(data.pct);
        return;
      }
      pending.delete(data.id);
      if (data.type === "done") {
        warm.add(p.voiceId);
        p.resolve(data.wav);
      } else {
        const kind = data.kind === "network" ? "network" : "other";
        // Après une erreur, le runtime WASM ou un import peut être inutilisable.
        // Les demandes suivantes repartent d'un worker neuf, avec le modèle en cache.
        retire(w);
        p.reject(ttsError(kind, data.message));
      }
      if (!pool.includes(w) && !load(w)) w.terminate(); // worker mis à la retraite, désormais libre
    };
    // Le worker n'a pas pu démarrer (script introuvable, erreur au chargement…).
    w.onerror = (e) => {
      e.preventDefault?.();
      retire(w);
      w.terminate();
      const err = ttsError("other", `moteur de voix indisponible : ${e.message || "erreur du worker"}`);
      for (const [id, p] of pending) {
        if (p.w === w) {
          pending.delete(id);
          p.reject(err);
        }
      }
    };
    pool.push(w);
    return w;
  }

  // Le moteur le moins chargé, de préférence celui qui a déjà cette voix en mémoire
  // (changer de voix recharge le modèle : lexique néerlandais–français). Un nouveau moteur
  // seulement si aucun n'est libre avec cette voix et que la voix est en cache
  // (sinon le premier moteur la télécharge seul).
  function pick(voiceId) {
    if (!pool.length) return spawn();
    if (!warm.has(voiceId)) return pool[0];
    const cost = (w) => load(w) * 2 + (w.voiceId === voiceId ? 0 : 1);
    const best = pool.reduce((a, b) => (cost(b) < cost(a) ? b : a));
    return cost(best) > 0 && pool.length < maxWorkers ? spawn() : best;
  }

  function request(msg, onProgress) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      const w = pick(msg.voiceId);
      w.voiceId = msg.voiceId; // voix que ce moteur aura chargée après cette demande
      pending.set(id, { w, resolve, reject, onProgress, voiceId: msg.voiceId });
      w.postMessage({ id, threads, ...msg });
    });
  }

  async function synthesize({ text, voice, speed, titles = [] }, { onProgress, onChunk, onPrepared, audioStore, blob = false } = {}) {
    const lang = detectLanguage(text);
    const mainVoiceId = voiceIdOf(voice, lang); // voix inconnue : échoue avant tout travail
    const bilingual = lang === "fr" && hasDutch(text);
    const parts = splitIntoParts(text, undefined, titles);
    const chunks = parts.map((part) => part.text);
    const pauses = titlePauses(parts);
    if (!chunks.length) throw ttsError("other", "aucun texte à lire");
    const lengthScale = speedToLengthScale(speed);
    const gen = generation;
    const controller = new AbortController();
    controllers.add(controller);
    const cancelled = () => ttsError("cancelled", "synthèse annulée");

    // Un morceau = un ou plusieurs segments (lexique néerlandais–français : chaque
    // moitié de ligne avec la voix de sa langue). Rend [{ cacheKey, wav }] dans l'ordre.
    async function prepare(i) {
      const pieces = bilingual ? languageSegments(chunks[i], lang) : [];
      const segments = pieces.length ? pieces : [{ text: chunks[i], lang }];
      return Promise.all(segments.map(async (segment, k) => {
        let spoken = spokenText(segment.text, segment.lang);
        // Short list labels often have no punctuation in slides. Give the voice
        // a clear ending as well as the explicit pause added outside the cache.
        if (k === segments.length - 1 && parts[i].listStart && !/[.!?…;:,]$/u.test(spoken)) spoken += ".";
        const segmentVoiceId = voiceIdOf(voice, segment.lang);
        const message = { type: "synthesize", text: spoken, voiceId: segmentVoiceId, lengthScale };
        const cacheKey = JSON.stringify(["vits-pcm-v1", segmentVoiceId, lengthScale, message.text]);
        let wav = cache.get(cacheKey) ?? await audioStore?.get(cacheKey);
        if (!wav) {
          try {
            wav = await request(message, onProgress);
          } catch (error) {
            if (gen !== generation) throw cancelled();
            if (error.kind !== "other") throw error;
            // Une seule reprise du morceau après un arrêt du moteur.
            // Aucun morceau déjà lu n'est rejoué et une erreur réseau reste explicite.
            wav = await request(message, onProgress);
          }
          if (gen !== generation) throw cancelled();
          cache.put(cacheKey, wav);
        }
        return { cacheKey, wav };
      }));
    }

    // Les morceaux suivants se préparent pendant qu'on livre celui-ci : de quoi
    // occuper chaque moteur deux fois, sans prendre d'avance inutile sur la lecture.
    const ahead = Math.max(1, maxWorkers * 2);
    const jobs = [];
    const launch = (i) => {
      if (i < chunks.length && !jobs[i]) {
        jobs[i] = prepare(i);
        jobs[i].catch(() => {}); // l'erreur remonte quand on attend ce morceau
      }
    };

    activeSynths++;
    try {
      const wavs = [];
      const durations = [];
      let sampleRate;
      let lastYield = performance.now();
      for (let i = 0; i < chunks.length; i++) {
        // Un cours déjà préparé peut produire des centaines de résultats immédiats.
        // Laisser passer les clics (annulation, navigation) et le rendu mobile.
        if (performance.now() - lastYield >= 16) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          lastYield = performance.now();
        }
        if (gen !== generation) throw cancelled();
        launch(i);
        // Tant que la voix n'est pas en cache, un seul moteur travaille : prendre de
        // l'avance maintenant lui donnerait toute la file, sans profiter des autres.
        if (warm.has(mainVoiceId)) for (let j = i + 1; j <= i + ahead; j++) launch(j);
        const segments = await jobs[i];
        jobs[i] = null;
        if (gen !== generation) throw cancelled();
        const segmentWavs = [];
        for (const { cacheKey, wav } of segments) {
          await audioStore?.put(cacheKey, wav);
          onPrepared?.(cacheKey, new Blob([wav], { type: "audio/wav" }));
          if (gen !== generation) throw cancelled();
          segmentWavs.push(wav);
        }
        let wav = segmentWavs.length === 1 ? segmentWavs[0] : concatWavs(segmentWavs);
        wav = padWav(wav, pauses[i].before, pauses[i].after);
        sampleRate ??= parseWav(wav).sampleRate;
        wavs.push(blob ? new Blob([wav], { type: "audio/wav" }) : wav);
        durations.push(wavDuration(wav));
        // Copie : le lecteur peut détacher le tampon (decodeAudioData), on garde l'original pour recoller.
        await onChunk?.(wav.slice(0), i, chunks.length, pauses[i]);
      }
      if (gen !== generation) throw cancelled();
      // Le résultat appartient à l'appelant (qui peut le transférer/détacher).
      const wav = blob ? concatWavBlobs(wavs, sampleRate) : wavs.length === 1 ? wavs[0].slice(0) : await concatWavsAsync(wavs, { signal: controller.signal });
      if (gen !== generation) throw cancelled();
      return { wav, chunks, durations, pauses, lang };
    } finally {
      controllers.delete(controller);
      activeSynths--;
    }
  }

  async function preload(voice, { onProgress, lang = "fr" } = {}) {
    const voiceId = voiceIdOf(voice, lang);
    await request({ type: "download", voiceId }, onProgress);
  }

  // Sans synthèse en cours, ne fait rien. Sinon arrête net les workers (une inférence ONNX
  // ne s'interrompt pas autrement) ; tout ce qu'ils avaient en cours, préchargement compris,
  // est rejeté avec kind "cancelled". Le prochain appel recrée un worker.
  function cancel() {
    if (activeSynths === 0 && pending.size === 0) return;
    generation++;
    for (const controller of controllers) controller.abort();
    for (const w of pool) w.terminate();
    pool = [];
    rejectAll(ttsError("cancelled", "synthèse annulée"));
  }

  return { synthesize, preload, cancel, clearCache: () => cache.clear() };
}
