// API de synthèse côté page. Découpe le texte, envoie un morceau à la fois au worker
// (src/tts-worker.js), recolle les WAV. Le texte ne quitte jamais le navigateur.
import { splitIntoChunks, speedToLengthScale } from "./text.js";
import { concatWavs, wavDuration } from "./audio.js";

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
  let worker = null;
  let nextId = 1;
  let generation = 0; // change à chaque cancel() : les synthèses lancées avant s'arrêtent
  let activeSynths = 0;
  const pending = new Map(); // id → { resolve, reject, onProgress }

  function rejectAll(err) {
    for (const p of pending.values()) p.reject(err);
    pending.clear();
  }

  function dropWorker() {
    worker?.terminate();
    worker = null;
  }

  function getWorker() {
    if (worker) return worker;
    worker = new Worker(new URL("./tts-worker.js", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      if (data.type === "progress") {
        p.onProgress?.(data.pct);
      } else if (data.type === "done") {
        pending.delete(data.id);
        p.resolve(data.wav);
      } else if (data.type === "error") {
        pending.delete(data.id);
        p.reject(ttsError(data.kind === "network" ? "network" : "other", data.message));
      }
    };
    // Le worker n'a pas pu démarrer (script introuvable, erreur au chargement…).
    worker.onerror = (e) => {
      e.preventDefault?.();
      dropWorker();
      rejectAll(ttsError("other", `moteur de voix indisponible : ${e.message || "erreur du worker"}`));
    };
    return worker;
  }

  function request(msg, onProgress) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject, onProgress });
      getWorker().postMessage({ id, ...msg });
    });
  }

  async function synthesize({ text, voice, speed }, { onProgress, onChunk } = {}) {
    const voiceId = voiceIdOf(voice);
    const chunks = splitIntoChunks(text);
    if (!chunks.length) throw ttsError("other", "aucun texte à lire");
    const lengthScale = speedToLengthScale(speed);
    const gen = generation;
    const cancelled = () => ttsError("cancelled", "synthèse annulée");
    activeSynths++;
    try {
      const wavs = [];
      const durations = [];
      for (let i = 0; i < chunks.length; i++) {
        if (gen !== generation) throw cancelled();
        const wav = await request({ type: "synthesize", text: chunks[i], voiceId, lengthScale }, onProgress);
        if (gen !== generation) throw cancelled();
        wavs.push(wav);
        durations.push(wavDuration(wav));
        // Copie : le lecteur peut détacher le tampon (decodeAudioData), on garde l'original pour recoller.
        onChunk?.(wav.slice(0), i, chunks.length);
      }
      if (gen !== generation) throw cancelled();
      return { wav: wavs.length === 1 ? wavs[0] : concatWavs(wavs), chunks, durations };
    } finally {
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
    if (activeSynths === 0) return;
    generation++;
    dropWorker();
    rejectAll(ttsError("cancelled", "synthèse annulée"));
  }

  return { synthesize, preload, cancel };
}
