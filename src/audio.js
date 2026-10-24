import { Mp3Encoder } from "@breezystack/lamejs";

const SILENCE_MS = 150;

export function parseWav(buf) {
  if (!(buf instanceof ArrayBuffer) || buf.byteLength < 44) throw new Error("WAV invalide : fichier trop court");
  const v = new DataView(buf);
  const tag = (o) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("WAV invalide : en-tête RIFF/WAVE absent");
  let sampleRate = 0;
  let pos = 12;
  while (pos + 8 <= buf.byteLength) {
    const id = tag(pos);
    const size = v.getUint32(pos + 4, true);
    if (id === "fmt ") sampleRate = v.getUint32(pos + 12, true);
    else if (id === "data") {
      if (!sampleRate) throw new Error("WAV invalide : bloc fmt absent");
      const len = Math.min(size, buf.byteLength - (pos + 8)) >> 1;
      const samples = new Int16Array(len);
      for (let i = 0; i < len; i++) samples[i] = v.getInt16(pos + 8 + i * 2, true);
      return { sampleRate, samples };
    }
    pos += 8 + size + (size & 1);
  }
  throw new Error("WAV invalide : bloc data absent");
}

export function encodeWav(samples, sampleRate) {
  const dataLen = samples.length * 2;
  const buf = new ArrayBuffer(44 + dataLen);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < 4; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + dataLen, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, dataLen, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, samples[i], true);
  return buf;
}

export function concatWavs(bufs) {
  const parsed = bufs.map(parseWav);
  const sampleRate = parsed[0].sampleRate;
  const gap = Math.round((sampleRate * SILENCE_MS) / 1000);
  const total = parsed.reduce((n, p) => n + p.samples.length, 0) + gap * Math.max(0, parsed.length - 1);
  const out = new Int16Array(total);
  let off = 0;
  parsed.forEach((p, i) => {
    if (i > 0) off += gap;
    out.set(p.samples, off);
    off += p.samples.length;
  });
  return encodeWav(out, sampleRate);
}

export function wavDuration(buf) {
  const { sampleRate, samples } = parseWav(buf);
  return samples.length / sampleRate;
}

export async function wavToMp3(buf, kbps = 96) {
  const { sampleRate, samples } = parseWav(buf);
  const enc = new Mp3Encoder(1, sampleRate, kbps);
  const chunks = [];
  let total = 0;
  const push = (c) => { if (c.length) { chunks.push(c); total += c.length; } };
  let frames = 0;
  for (let i = 0; i < samples.length; i += 1152) {
    push(enc.encodeBuffer(samples.subarray(i, i + 1152)));
    if (++frames % 50 === 0) await new Promise((r) => setTimeout(r));
  }
  push(enc.flush());
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}
