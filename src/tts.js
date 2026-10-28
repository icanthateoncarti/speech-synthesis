// API de synthèse côté page. Découpe le texte, envoie un morceau à la fois au worker
// (src/tts-worker.js), recolle les WAV. Le texte ne quitte jamais le navigateur.
import { splitIntoParts, titlePauses, speedToLengthScale, detectLanguage } from "./text.js";
import { spokenText } from "./spoken.js";
import { concatWavsAsync, concatWavBlobs, parseWav, padWav, wavDuration } from "./audio.js";
import { createSpeechCache } from "./speech-cache.js";

export const VOICES = { jessica: "fr_FR-upmc-medium", tom: "fr_FR-tom-medium" };
// Texte anglais : mêmes positions du bouton, voix anglaises libres de droits
// (Kristin : LibriVox, domaine public ; Joe : CC0).
export const ENGLISH_VOICES = { jessica: "en_US-kristin-medium", tom: "en_US-joe-medium" };

function ttsError(kind, message) {
  const err = new Error(message);
  err.kind = kind; // "network" | "other" | "cancelled"
  return err;
}

const voiceIdOf = (voice, lang = "fr") => {
  const voices = lang === "en" ? ENGLISH_VOICES : VOICES;
  const id = Object.hasOwn(voices, voice) ? voices[voice] : null;
  if (!id) throw ttsError("other", `voix inconnue : ${voice}`);
  return id;
};

export function createTts() {
  const cache = createSpeechCache();
  let worker = null; // celui qui reçoit les nouvelles demandes
  let nextId = 1;
  let generation = 0; // change à chaque cancel() : les synthèses lancées avant s'arrêtent
  let activeSynths = 0;
  const controllers = new Set();
  const pending = new Map(); // id → { w, resolve, reject, onProgress }

  const busy = (w) => [...pending.values()].some((p) => p.w === w);

  function rejectAll(err) {
    const workers = new Set([...pending.values()].map((p) => p.w));
    for (const p of pending.values()) p.reject(err);
    pending.clear();
    for (const w of workers) w.terminate();
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
        p.resolve(data.wav);
      } else {
        const kind = data.kind === "network" ? "network" : "other";
        // Après une erreur, le runtime WASM ou un import peut être inutilisable.
        // Les demandes suivantes repartent d'un worker neuf, avec le modèle en cache.
        if (worker === w) worker = null;
        p.reject(ttsError(kind, data.message));
      }
      if (w !== worker && !busy(w)) w.terminate(); // worker mis à la retraite, désormais libre
    };
    // Le worker n'a pas pu démarrer (script introuvable, erreur au chargement…).
    w.onerror = (e) => {
      e.preventDefault?.();
      if (worker === w) worker = null;
      w.terminate();
      const err = ttsError("other", `moteur de voix indisponible : ${e.message || "erreur du worker"}`);
      for (const [id, p] of pending) {
        if (p.w === w) {
          pending.delete(id);
          p.reject(err);
        }
      }
    };
    return w;
  }

  function request(msg, onProgress) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      worker ??= spawn();
      pending.set(id, { w: worker, resolve, reject, onProgress });
      worker.postMessage({ id, ...msg });
    });
  }

  async function synthesize({ text, voice, speed, titles = [] }, { onProgress, onChunk, onPrepared, audioStore, blob = false } = {}) {
    const lang = detectLanguage(text);
    const voiceId = voiceIdOf(voice, lang);
    const parts = splitIntoParts(text, undefined, titles);
    const chunks = parts.map((part) => part.text);
    const pauses = titlePauses(parts);
    if (!chunks.length) throw ttsError("other", "aucun texte à lire");
    const lengthScale = speedToLengthScale(speed);
    const gen = generation;
    const controller = new AbortController();
    controllers.add(controller);
    const cancelled = () => ttsError("cancelled", "synthèse annulée");
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
        let spoken = spokenText(chunks[i], lang);
        // Short list labels often have no punctuation in slides. Give the voice
        // a clear ending as well as the explicit pause added outside the cache.
        if (parts[i].listStart && !/[.!?…;:,]$/u.test(spoken)) spoken += ".";
        const message = { type: "synthesize", text: spoken, voiceId, lengthScale };
        const cacheKey = JSON.stringify(["vits-pcm-v1", voiceId, lengthScale, message.text]);
        let wav = cache.get(cacheKey) ?? await audioStore?.get(cacheKey);
        if (!wav) {
          try {
            wav = await request(message, onProgress);
          } catch (error) {
            if (gen !== generation) throw cancelled();
            if (error.kind !== "other") throw error;
            // Une seule reprise du morceau courant après un arrêt du moteur.
            // Aucun morceau déjà lu n'est rejoué et une erreur réseau reste explicite.
            wav = await request(message, onProgress);
          }
          if (gen !== generation) throw cancelled();
          cache.put(cacheKey, wav);
        }
        if (gen !== generation) throw cancelled();
        await audioStore?.put(cacheKey, wav);
        onPrepared?.(cacheKey, new Blob([wav], { type: "audio/wav" }));
        if (gen !== generation) throw cancelled();
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

  // Sans synthèse en cours, ne fait rien. Sinon arrête net le worker (une inférence ONNX
  // ne s'interrompt pas autrement) ; tout ce qu'il avait en cours, préchargement compris,
  // est rejeté avec kind "cancelled". Le prochain appel recrée un worker.
  function cancel() {
    if (activeSynths === 0 && pending.size === 0) return;
    generation++;
    for (const controller of controllers) controller.abort();
    worker?.terminate();
    worker = null;
    rejectAll(ttsError("cancelled", "synthèse annulée"));
  }

  return { synthesize, preload, cancel, clearCache: () => cache.clear() };
}
