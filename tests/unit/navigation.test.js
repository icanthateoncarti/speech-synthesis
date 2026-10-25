import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReadingIndex, generatedDuration, navigationTarget, textOffsetAtTime, timeAtTextOffset } from "../../src/navigation.js";
import { splitIntoChunks } from "../../src/text.js";
import { createPlayer } from "../../src/player.js";
import { encodeWav } from "../../src/audio.js";

const TEXT = "Introduction\nBonjour le monde. Une autre phrase.\nChapitre 1 : Départ\nLa mer est calme. Nous partons.\nChapitre 2 : Arrivée\nNous arrivons.";

test("navigation par phrases et chapitres, avec les 150 ms entre morceaux", () => {
  const index = buildReadingIndex(TEXT);
  const durations = index.chunks.map(() => 2);
  assert.deepEqual(index.chapters.map((chapter) => chapter.title), ["Introduction", "Chapitre 1 : Départ", "Chapitre 2 : Arrivée"]);
  const target = navigationTarget(index, { unit: "chapters", amount: 1 }, 1, durations, true);
  assert.equal(target.offset, TEXT.indexOf("Chapitre 1"));
  assert.ok(Math.abs(target.time - 6.45) < 1e-9);
  assert.equal(target.pending, false);
  const restart = navigationTarget(index, { unit: "chapters", restart: true }, 10, durations, true);
  assert.equal(restart.offset, target.offset);
  const previous = navigationTarget(index, { unit: "chapters", amount: -1 }, 14, durations, true);
  assert.equal(previous.offset, target.offset);
  const phrase = navigationTarget(index, { unit: "sentences", amount: -3 }, 14, durations, true);
  assert.equal(phrase.offset, TEXT.indexOf("Chapitre 1"));
});

test("une destination non synthétisée reste en attente et retrouve ensuite son minutage", () => {
  const index = buildReadingIndex(TEXT);
  const pending = navigationTarget(index, { unit: "chapters", amount: 2 }, 1, [2], false);
  assert.equal(pending.pending, true);
  assert.equal(pending.time, null);
  assert.equal(pending.chunkIndex, 6);
  const ready = timeAtTextOffset(index, pending.offset, index.chunks.map(() => 2));
  assert.equal(ready.pending, false);
  assert.ok(Math.abs(ready.time - 12.9) < 1e-9);
  const futureTime = navigationTarget(index, { unit: "seconds", amount: 300 }, 1, [2], false);
  assert.equal(futureTime.time, 301);
  assert.equal(futureTime.pending, true);
  const clamped = navigationTarget(index, { unit: "seconds", amount: 300 }, 1, [2], true);
  assert.equal(clamped.time, 2);
  assert.equal(clamped.pending, false);
});

test("une phrase longue reste une seule phrase même si la synthèse la découpe", () => {
  const sentence = "Cette phrase très longue contient des mots sans point intermédiaire ".repeat(12).trim() + ".";
  const text = sentence + " La suite commence ici.";
  const index = buildReadingIndex(text, splitIntoChunks(text));
  assert.equal(index.sentences.length, 2);
  assert.ok(index.chunks.length > 2);
  const target = navigationTarget(index, { unit: "sentences", amount: 1 }, 1, index.chunks.map(() => 2), true);
  assert.equal(target.offset, text.indexOf("La suite"));
});

test("les métadonnées PDF donnent des chapitres précis sans confondre une mention dans le texte", () => {
  const text = "Nous parlons du chapitre 4 dans cette phrase. Début de la vraie partie. Fin.";
  assert.equal(buildReadingIndex(text).chapters.length, 1);
  const offset = text.indexOf("Début");
  const index = buildReadingIndex(text, undefined, [{ title: "Ma partie", offset }]);
  assert.deepEqual(index.chapters.map(({ title, start }) => ({ title, start })), [
    { title: "Introduction", start: 0 }, { title: "Ma partie", start: offset },
  ]);
  const same = timeAtTextOffset(index, offset, index.chunks.map(() => 3));
  assert.ok(Math.abs(textOffsetAtTime(index, same.time, index.chunks.map(() => 3)) - offset) < 1e-9);
  assert.equal(generatedDuration([2, 3, undefined, 4]), 5.15);
});

function fakeAudio() {
  const originals = { AudioContext: globalThis.AudioContext, requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame };
  let nextFrame = 0, context;
  const frames = new Map();
  globalThis.requestAnimationFrame = (callback) => { frames.set(++nextFrame, callback); return nextFrame; };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);
  globalThis.AudioContext = class {
    constructor() { this.currentTime = 0; this.sources = []; this.createdBuffers = 0; context = this; }
    resume() { return Promise.resolve(); }
    createAnalyser() { return { fftSize: 256, connect() {}, getFloatTimeDomainData(samples) { samples.fill(0); } }; }
    createBuffer(_channels, length, rate) { this.createdBuffers++; const data = new Float32Array(length); return { duration: length / rate, getChannelData: () => data }; }
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, stop() { this.stopped = true; }, start(at, offset = 0) { this.at = at; this.offset = offset; } };
      this.sources.push(source);
      return source;
    }
  };
  return {
    get context() { return context; },
    advance(time) {
      context.currentTime = time;
      for (const source of [...context.sources]) {
        if (!source.stopped && source.onended && time >= source.at + source.buffer.duration - source.offset) source.onended();
      }
      const callbacks = [...frames.values()];
      frames.clear();
      for (const callback of callbacks) callback();
    },
    restore() { Object.assign(globalThis, originals); },
  };
}

test("pause, réception de la suite, reprise et retour arrière gardent la bonne position", async () => {
  const audio = fakeAudio();
  const wav = encodeWav(new Int16Array(22050), 22050);
  const player = createPlayer();
  try {
    await player.unlock();
    player.enqueue(wav);
    audio.advance(0.515);
    assert.ok(Math.abs(player.pause() - 0.5) < 1e-9);
    const created = audio.context.sources.length;
    audio.advance(5);
    player.enqueue(wav);
    assert.equal(audio.context.sources.length, created, "recevoir un morceau pendant la pause ne doit pas jouer");
    assert.equal(player.isPaused(), true);
    player.resume();
    audio.advance(5.265);
    assert.ok(Math.abs(player.getTime() - 0.75) < 1e-9);
    player.seek(1.5);
    assert.ok(Math.abs(audio.context.sources.at(-1).offset - 0.35) < 1e-9);
    assert.equal(player.seek(-30), 0);
    assert.equal(player.isPlaying(), true);
    player.pause();
    player.seek(1.5);
    assert.equal(player.isPaused(), true);
    assert.equal(player.getTime(), 1.5);
    player.stop();
    assert.equal(player.getDuration(), 0);
  } finally { player.stop(); audio.restore(); }
});

test("lecture en continu : l'horloge attend la génération et la fin n'arrive qu'après finish", async () => {
  const audio = fakeAudio();
  const wav = encodeWav(new Int16Array(22050), 22050);
  const player = createPlayer();
  let ended = 0;
  player.onEnded(() => ended++);
  try {
    await player.unlock();
    player.enqueue(wav);
    audio.advance(10);
    assert.equal(player.getTime(), 1);
    assert.equal(ended, 0);
    player.enqueue(wav);
    audio.advance(11.1);
    assert.ok(Math.abs(player.getTime() - 2.15) < 1e-9);
    assert.equal(ended, 0);
    player.finish();
    assert.equal(ended, 1);
    assert.equal(player.isPaused(), true);
  } finally { player.stop(); audio.restore(); }
});

test("un long audio reste chargé en PCM et seule une fenêtre de lecture devient Float32", async () => {
  const audio = fakeAudio();
  const wav = encodeWav(new Int16Array(22050), 22050);
  const player = createPlayer();
  try {
    player.load(Array.from({ length: 100 }, () => wav));
    assert.equal(player.isPaused(), true);
    await player.unlock();
    assert.equal(audio.context.createdBuffers, 0, "load ne doit pas matérialiser tous les AudioBuffers");
    player.play();
    assert.ok(audio.context.createdBuffers > 0 && audio.context.createdBuffers < 30);
    player.seek(100);
    assert.ok(audio.context.sources.at(-1).at - audio.context.currentTime < 30);
  } finally { player.stop(); audio.restore(); }
});
