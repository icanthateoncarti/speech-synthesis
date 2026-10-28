import { Mp3Encoder } from "@breezystack/lamejs";
import { createMp3Encoder } from "./mp3-encode.js";

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
      const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
      if (littleEndian && (pos + 8) % 2 === 0) {
        return { sampleRate, samples: new Int16Array(buf, pos + 8, len) };
      }
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
  return encodeWavInto(samples, sampleRate, buf);
}

function encodeWavInto(samples, sampleRate, buf) {
  const dataLen = samples.length * 2;
  writeWavHeader(buf, sampleRate, dataLen);
  const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  if (littleEndian) new Uint8Array(buf, 44).set(new Uint8Array(samples.buffer, samples.byteOffset, dataLen));
  else {
    const v = new DataView(buf);
    for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, samples[i], true);
  }
  return buf;
}

function writeWavHeader(buf, sampleRate, dataLen) {
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < 4; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + dataLen, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, dataLen, true);
}

// Silence autour d'un morceau (pauses des titres), dans le WAV lui-même : le MP3 le garde.
export function padWav(buf, before, after) {
  if (!before && !after) return buf;
  const { samples, sampleRate } = parseWav(buf);
  const head = Math.round(before * sampleRate);
  const out = new Int16Array(head + samples.length + Math.round(after * sampleRate));
  out.set(samples, head);
  return encodeWav(out, sampleRate);
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

export async function concatWavsAsync(bufs, { signal, yieldEvery = 16 } = {}) {
  const parsed = bufs.map(parseWav);
  if (!parsed.length) throw new Error("Aucun WAV à concaténer");
  const sampleRate = parsed[0].sampleRate;
  if (parsed.some((p) => p.sampleRate !== sampleRate)) throw new Error("Fréquences WAV incompatibles");
  const gap = Math.round((sampleRate * SILENCE_MS) / 1000);
  const count = parsed.reduce((n, p) => n + p.samples.length, 0) + gap * (parsed.length - 1);
  const out = new ArrayBuffer(44 + count * 2);
  writeWavHeader(out, sampleRate, count * 2);
  const target = new Uint8Array(out, 44);
  let offset = 0;
  for (let i = 0; i < parsed.length; i++) {
    signal?.throwIfAborted();
    if (i) offset += gap * 2;
    const pcm = parsed[i].samples;
    target.set(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength), offset);
    offset += pcm.byteLength;
    if ((i + 1) % yieldEvery === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  signal?.throwIfAborted();
  return out;
}

export function wavDuration(buf) {
  const { sampleRate, samples } = parseWav(buf);
  return samples.length / sampleRate;
}

// Assemble le WAV sans recopier le PCM du cours entier dans un ArrayBuffer.
export function concatWavBlobs(blobs, sampleRate) {
  const gap = new Uint8Array(Math.round(sampleRate * SILENCE_MS / 1000) * 2);
  const bytes = blobs.reduce((sum, blob) => sum + blob.size - 44, 0) + Math.max(0, blobs.length - 1) * gap.length;
  if (bytes > 0xffffffff - 36) throw new Error("Audio trop long pour un fichier WAV.");
  const header = new ArrayBuffer(44); writeWavHeader(header, sampleRate, bytes);
  const parts = [header];
  blobs.forEach((blob, i) => { if (i) parts.push(gap); parts.push(blob.slice(44)); });
  return new Blob(parts, { type: "audio/wav" });
}

export async function sliceWavBlob(blob, seconds = 30) {
  const header = new DataView(await blob.slice(0, 44).arrayBuffer());
  if (header.byteLength !== 44 || !Number.isFinite(seconds) || seconds <= 0) throw new Error("Audio invalide");
  const rate = header.getUint32(24, true), bytes = header.getUint32(40, true);
  if (!rate || bytes % 2 || bytes !== blob.size - 44 || header.getUint16(22, true) !== 1 || header.getUint16(34, true) !== 16) throw new Error("Audio invalide");
  const size = Math.max(1, Math.floor(seconds * rate)) * 2, out = [];
  for (let at = 0; at < bytes; at += size) {
    const length = Math.min(size, bytes - at), h = new ArrayBuffer(44);
    writeWavHeader(h, rate, length);
    out.push({ blob: new Blob([h, blob.slice(44 + at, 44 + at + length)], { type: "audio/wav" }), seconds: length / 2 / rate, offset: at / 2 / rate, end: (at + length) / 2 / rate, gap: 0 });
  }
  return out;
}

export async function wavToMp3(buf, kbps = 96, { signal, onProgress } = {}) {
  const { sampleRate, samples } = parseWav(buf);
  const encoder = createMp3Encoder(samples, sampleRate, Mp3Encoder, kbps);
  for (;;) {
    signal?.throwIfAborted();
    const { pct, result } = encoder.step();
    onProgress?.(pct);
    if (result) return result;
    await new Promise((r) => setTimeout(r, 0));
  }
}
