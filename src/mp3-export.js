import { parseWav, wavToMp3 } from "./audio.js";

export function exportMp3Audio(wav, { signal, onProgress, kbps = 96 } = {}) {
  signal?.throwIfAborted();
  if (typeof Worker !== "function") return wav instanceof Blob ? Promise.reject(new Error("Export indisponible dans ce navigateur.")) : wavToMp3(wav, kbps, { signal, onProgress });
  const { samples, sampleRate } = wav instanceof Blob ? {} : parseWav(wav);
  const url = new URL("./mp3-worker.js", import.meta.url);
  url.search = new URL(import.meta.url).search;
  return new Promise((resolve, reject) => {
    const worker = new Worker(url, { type: "module" });
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      worker.terminate(); signal?.removeEventListener("abort", abort);
      if (error) reject(error); else resolve(result);
    };
    const abort = () => finish(new DOMException("Export annulé", "AbortError"));
    worker.onerror = () => finish(new Error("Encodage MP3 impossible"));
    worker.onmessage = ({ data }) => {
      if (settled) return;
      if (data.type === "ready") {
        // Attendre le chargement des modules avant d’envoyer le premier message.
        // Le WAV d’origine reste disponible pour écouter et réexporter sans synthèse.
        try {
          if (wav instanceof Blob) worker.postMessage({ blob: wav, kbps });
          else {
            const copy = samples.slice();
            worker.postMessage({ samples: copy, sampleRate, kbps }, [copy.buffer]);
          }
        } catch (error) { finish(error); }
      } else if (data.type === "progress") onProgress?.(data.pct);
      else if (data.type === "done") finish(null, data.mp3);
      else if (data.type === "error") finish(new Error(data.message));
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
}
