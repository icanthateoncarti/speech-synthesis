import { test } from "node:test";
import assert from "node:assert/strict";
import { createTts } from "../../src/tts.js";
import { encodeWav, wavDuration } from "../../src/audio.js";

test("un moteur interrompu est recréé et seul le morceau courant est repris", async () => {
  const NativeWorker = globalThis.Worker;
  const workers = [], messages = [];
  const wav = encodeWav(new Int16Array(22050), 22050);
  globalThis.Worker = class {
    constructor() { workers.push(this); }
    postMessage(message) {
      messages.push(message.text);
      const failed = workers.length === 1 && messages.length === 2;
      queueMicrotask(() => this.onmessage({ data: failed
        ? { id: message.id, type: "error", kind: "other", message: "Aborted()" }
        : { id: message.id, type: "done", wav: wav.slice(0) } }));
    }
    terminate() { this.terminated = true; }
  };
  try {
    const chunks = [];
    const result = await createTts().synthesize({ text: "Première phrase. Deuxième phrase. Troisième phrase.", voice: "tom", speed: 1 }, {
      onChunk: (_wav, index) => chunks.push(index),
    });
    assert.deepEqual(messages, ["Première phrase.", "Deuxième phrase.", "Deuxième phrase.", "Troisième phrase."]);
    assert.deepEqual(chunks, [0, 1, 2]);
    assert.equal(workers.length, 2);
    assert.equal(workers[0].terminated, true);
    assert.ok(Math.abs(wavDuration(result.wav) - 3.3) < 0.001);
  } finally { globalThis.Worker = NativeWorker; }
});

test("une erreur réseau est remontée sans boucle de tentatives", async () => {
  const NativeWorker = globalThis.Worker;
  let calls = 0;
  globalThis.Worker = class {
    postMessage(message) {
      calls++;
      queueMicrotask(() => this.onmessage({ data: { id: message.id, type: "error", kind: "network", message: "Hors ligne" } }));
    }
    terminate() {}
  };
  try {
    await assert.rejects(createTts().synthesize({ text: "Bonjour.", voice: "jessica", speed: 1 }), (error) => error.kind === "network");
    assert.equal(calls, 1);
  } finally { globalThis.Worker = NativeWorker; }
});

test("réutiliser les passages sans confondre voix, vitesse, langue ni pauses de titres", async () => {
  const NativeWorker = globalThis.Worker;
  const messages = [];
  globalThis.Worker = class {
    postMessage(message) {
      messages.push(message);
      queueMicrotask(() => this.onmessage({ data: { id: message.id, type: "done", wav: encodeWav(new Int16Array(22050), 22050) } }));
    }
    terminate() {}
  };
  try {
    const tts = createTts();
    const input = { text: "Une phrase.\nUn titre?\nLa fin.", voice: "jessica", speed: 1 };
    const first = await tts.synthesize(input, { onChunk(wav) { structuredClone(wav, { transfer: [wav] }); } });
    assert.equal(messages.length, 3);
    const second = await tts.synthesize({ ...input, titles: ["Un titre?"] });
    assert.equal(messages.length, 3, "le cache ne doit pas être détaché par le lecteur");
    assert.ok(Math.abs(wavDuration(second.wav) - wavDuration(first.wav) - 2) < 0.001, "les pauses sont recalculées hors cache");
    await tts.synthesize({ ...input, text: input.text + " Une autre." });
    assert.equal(messages.length, 4, "seule la nouvelle phrase est calculée");
    await tts.synthesize({ ...input, voice: "tom" });
    assert.equal(messages.length, 7);
    await tts.synthesize({ ...input, speed: 1.2 });
    assert.equal(messages.length, 10);
    await tts.synthesize({ ...input, text: "The example is in the course. Une phrase." });
    assert.equal(messages.length, 12);
    assert.equal(messages.at(-1).voiceId, "en_US-kristin-medium", "le même passage français dans un document anglais utilise une autre voix");
    tts.clearCache();
    await tts.synthesize(input);
    assert.equal(messages.length, 15, "EFFACE ne doit garder aucun passage");
    const single = await tts.synthesize({ ...input, text: "Une phrase." });
    structuredClone(single.wav, { transfer: [single.wav] });
    assert.ok(wavDuration((await tts.synthesize({ ...input, text: "Une phrase." })).wav) > 0);
    assert.equal(messages.length, 15, "transférer le résultat ne détache pas le passage en cache");
    let calls = 0;
    await assert.rejects(tts.synthesize(input, { onChunk() { calls++; tts.cancel(); } }), e => e.kind === "cancelled");
    assert.equal(calls, 1, "l’annulation fonctionne aussi sans worker occupé");
  } finally { globalThis.Worker = NativeWorker; }
});
