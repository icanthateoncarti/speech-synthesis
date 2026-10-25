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
