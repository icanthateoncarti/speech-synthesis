// Même encodeur et même qualité ; le découpage permet un repli sur le fil principal.
export function createMp3Encoder(samples, sampleRate, Mp3Encoder, kbps = 96) {
  const encoder = new Mp3Encoder(1, sampleRate, kbps), chunks = [];
  let offset = 0, total = 0, result = null;
  const push = (chunk) => { if (chunk.length) { chunks.push(chunk); total += chunk.length; } };
  return {
    step(frames = 50) {
      if (result) return { pct: 100, result };
      const end = Math.min(samples.length, offset + frames * 1152);
      for (; offset < end; offset += 1152) push(encoder.encodeBuffer(samples.subarray(offset, offset + 1152)));
      if (offset >= samples.length) {
        push(encoder.flush());
        result = new Uint8Array(total);
        let pos = 0;
        for (const chunk of chunks) { result.set(chunk, pos); pos += chunk.length; }
        chunks.length = 0;
      }
      return { pct: Math.min(100, Math.floor(offset * 100 / Math.max(1, samples.length))), result };
    },
  };
}
