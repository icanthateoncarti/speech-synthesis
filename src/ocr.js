import { throwIfAborted } from "./limits.js";

export async function createOcr({ lang = "fra", signal, onProgress = () => {} } = {}) {
  if (!["fra", "eng"].includes(lang)) throw new Error("Langue OCR inconnue");
  throwIfAborted(signal);
  const { default: { createWorker } } = await import("https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.esm.min.js");
  let worker, rejectAbort;
  const aborted = new Promise((_, reject) => { rejectAbort = reject; });
  aborted.catch(() => {});
  const abort = () => { void worker?.terminate(); rejectAbort(new DOMException("Reconnaissance annulée", "AbortError")); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const pending = createWorker(lang, 1, {
      workerPath: new URL("./ocr-worker.js", import.meta.url).href, workerBlobURL: false,
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0",
      langPath: `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${lang}@1.0.0/4.0.0_best_int`,
      logger: value => onProgress(value.status, value.progress),
    });
    pending.then(value => { worker = value; if (signal?.aborted) void value.terminate(); }, () => {});
    worker = await Promise.race([pending, aborted]);
    throwIfAborted(signal);
    return {
      async recognize(page) {
        throwIfAborted(signal);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(2.5, Math.sqrt(2_000_000 / (base.width * base.height)));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const render = page.render({ canvasContext: canvas.getContext("2d"), viewport });
        const cancelRender = () => render.cancel(); signal?.addEventListener("abort", cancelRender, { once: true });
        try {
          await render.promise; throwIfAborted(signal);
          return (await Promise.race([worker.recognize(canvas), aborted])).data.text;
        } finally { signal?.removeEventListener("abort", cancelRender); canvas.width = canvas.height = 0; }
      },
      async close() { signal?.removeEventListener("abort", abort); await worker.terminate(); },
    };
  } catch (error) { signal?.removeEventListener("abort", abort); void worker?.terminate(); throw error; }
}
