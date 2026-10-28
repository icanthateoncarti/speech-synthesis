// WAV mono PCM16 produit par la radio, lu par blocs : jamais tout le PCM en RAM.
export async function encodeWavBlob(blob, Mp3Encoder, kbps = 96, onProgress = () => {}) {
  const header = new DataView(await blob.slice(0, 44).arrayBuffer());
  if (header.byteLength !== 44 || header.getUint32(0, false) !== 0x52494646 || header.getUint32(36, false) !== 0x64617461 || header.getUint16(22, true) !== 1 || header.getUint16(34, true) !== 16) throw new Error("Format audio invalide.");
  const rate = header.getUint32(24, true), total = header.getUint32(40, true);
  if (!rate || total % 2 || total !== blob.size - 44) throw new Error("Audio incomplet.");
  const encoder = new Mp3Encoder(1, rate, kbps), output = [];
  let tail = new Uint8Array(), read = 0;
  const keep = bytes => { if (bytes.length) output.push(bytes); };
  const reader = blob.slice(44).stream().getReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      const bytes = new Uint8Array(tail.length + value.length);
      bytes.set(tail); bytes.set(value, tail.length);
      const end = bytes.length - bytes.length % 2304;
      const samples = new Int16Array(bytes.buffer, 0, end / 2);
      for (let i = 0; i < samples.length; i += 1152) keep(encoder.encodeBuffer(samples.subarray(i, i + 1152)));
      tail = bytes.slice(end); read += value.length;
      onProgress(Math.min(99, Math.floor(read * 100 / Math.max(total, 1))));
    }
    if (tail.length) keep(encoder.encodeBuffer(new Int16Array(tail.buffer)));
    keep(encoder.flush()); onProgress(100);
    return new Blob(output, { type: "audio/mpeg" });
  } finally { reader.releaseLock(); }
}
