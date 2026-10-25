// API de synthèse côté page. Découpe le texte, envoie un morceau à la fois au worker
// (src/tts-worker.js), recolle les WAV. Le texte ne quitte jamais le navigateur.
import { splitIntoParts, titlePauses, speedToLengthScale } from "./text.js";
import { spokenText } from "./spoken.js";
import { concatWavsAsync, padWav, wavDuration } from "./audio.js";

export const VOICES = { jessica: "fr_FR-upmc-medium", tom: "fr_FR-tom-medium" };

function ttsError(kind, message) {
  const err = new Error(message);
  err.kind = kind; // "network" | "other" | "cancelled"
  return err;
}

const voiceIdOf = (voice) => {
  const id = Object.hasOwn(VOICES, voice) ? VOICES[voice] : null;
  if (!id) throw ttsError("other", `voix inconnue : ${voice}`);
  return id;
};

export function createTts() {
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
    const w = new Worker(new URL("./tts-worker.js", import.meta.url), { type: "module" });
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

  async function synthesize({ text, voice, speed }, { onProgress, onChunk } = {}) {
    const voiceId = voiceIdOf(voice);
    const parts = splitIntoParts(text);
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
      for (let i = 0; i < chunks.length; i++) {
        if (gen !== generation) throw cancelled();
        const message = { type: "synthesize", text: spokenText(chunks[i]), voiceId, lengthScale };
        let wav;
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
        wav = padWav(wav, pauses[i].before, pauses[i].after);
        wavs.push(wav);
        durations.push(wavDuration(wav));
        // Copie : le lecteur peut détacher le tampon (decodeAudioData), on garde l'original pour recoller.
        onChunk?.(wav.slice(0), i, chunks.length, pauses[i]);
      }
      if (gen !== generation) throw cancelled();
      const wav = wavs.length === 1 ? wavs[0] : await concatWavsAsync(wavs, { signal: controller.signal });
      if (gen !== generation) throw cancelled();
      return { wav, chunks, durations, pauses };
    } finally {
      controllers.delete(controller);
      activeSynths--;
    }
  }

  async function preload(voice, { onProgress } = {}) {
    const voiceId = voiceIdOf(voice);
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

  return { synthesize, preload, cancel };
}
