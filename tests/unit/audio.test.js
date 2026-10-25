import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWav, encodeWav, concatWavs, concatWavsAsync, wavDuration, wavToMp3 } from "../../src/audio.js";

const RATE = 22050;
function sine(seconds = 1, freq = 440) {
  const n = Math.round(RATE * seconds);
  const s = new Int16Array(n);
  for (let i = 0; i < n; i++) s[i] = Math.round(Math.sin((2 * Math.PI * freq * i) / RATE) * 12000);
  return s;
}

test("encodeWav puis parseWav est un aller-retour", () => {
  const samples = sine();
  const out = parseWav(encodeWav(samples, RATE));
  assert.equal(out.sampleRate, RATE);
  assert.deepEqual(Array.from(out.samples), Array.from(samples));
});

test("parseWav refuse un fichier qui n'est pas un WAV", () => {
  assert.throws(() => parseWav(new Uint8Array(64).buffer));
  assert.throws(() => parseWav(new ArrayBuffer(4)));
});

test("concatWavs ajoute 150 ms de silence entre morceaux", () => {
  const a = encodeWav(sine(1, 440), RATE);
  const b = encodeWav(sine(1, 660), RATE);
  assert.ok(Math.abs(wavDuration(concatWavs([a, b])) - 2.15) < 0.001);
});

test("concatWavsAsync rend la main et produit les mêmes octets", async () => {
  const wav = encodeWav(sine(), RATE);
  const parts = Array.from({ length: 40 }, () => wav);
  let yielded = false;
  const resultPromise = concatWavsAsync(parts, { yieldEvery: 4 }).then((result) => ({ result, yielded }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  yielded = true;
  const { result, yielded: observed } = await resultPromise;
  assert.equal(observed, true);
  assert.ok(Math.abs(wavDuration(result) - 40 - 0.15 * 39) < 0.001);
  assert.deepEqual(new Uint8Array(result), new Uint8Array(concatWavs(parts)));
});

test("wavToMp3 produit un MP3 non vide", async () => {
  const mp3 = await wavToMp3(encodeWav(sine(), RATE));
  assert.ok(mp3.length > 1000);
  assert.ok((mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0) || (mp3[0] === 0x49 && mp3[1] === 0x44));
});
