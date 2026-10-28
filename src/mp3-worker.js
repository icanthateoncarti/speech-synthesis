import { Mp3Encoder } from "https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/+esm";

const moduleUrl = new URL("./mp3-encode.js", import.meta.url);
moduleUrl.search = new URL(import.meta.url).search;
const { createMp3Encoder } = await import(moduleUrl.href);

self.onmessage = async ({ data }) => {
  try {
    if (data.blob) {
      const url = new URL("./mp3-stream.js", import.meta.url); url.search = moduleUrl.search;
      const { encodeWavBlob } = await import(url.href);
      const mp3 = await encodeWavBlob(data.blob, Mp3Encoder, data.kbps, pct => self.postMessage({ type: "progress", pct }));
      self.postMessage({ type: "done", mp3 }); return;
    }
    const encoder = createMp3Encoder(data.samples, data.sampleRate, Mp3Encoder, data.kbps);
    let previous = -1;
    for (;;) {
      const { pct, result } = encoder.step(128);
      if (pct !== previous) { self.postMessage({ type: "progress", pct }); previous = pct; }
      if (result) { self.postMessage({ type: "done", mp3: result }, [result.buffer]); break; }
    }
  } catch (error) {
    self.postMessage({ type: "error", message: error?.message ?? "Encodage MP3 impossible" });
  }
};
self.postMessage({ type: "ready" });
