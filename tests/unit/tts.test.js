import { test } from "node:test";
import assert from "node:assert/strict";
import { createTts, enginePlan } from "../../src/tts.js";
import { encodeWav, wavDuration } from "../../src/audio.js";

test("listes : même pause dans les passages en direct, le WAV exporté et le cache", async () => {
  const NativeWorker = globalThis.Worker, messages = [];
  globalThis.Worker = class {
    postMessage(message) {
      messages.push(message);
      queueMicrotask(() => this.onmessage({ data: { id: message.id, type: "done", wav: encodeWav(new Int16Array(22050).fill(1000), 22050) } }));
    }
    terminate() {}
  };
  try {
    const tts = createTts();
    const input = {text:"The products are available in three flavors • Orange • Orange C-Power • Orange–Mango", voice:"jessica", speed:1};
    const live = [];
    const first = await tts.synthesize(input, {onChunk(wav) {live.push(wavDuration(wav));}});
    assert.ok(messages.every(m => m.voiceId === "en_US-kristin-medium" && !m.text.includes("•")));
    assert.deepEqual(messages.slice(1).map(m => m.text), ["Orange.", "Orange C-Power.", "Orange–Mango."]);
    assert.equal(live.length, 4);
    assert.ok(Math.abs(live[0] - 1) < 0.001);
    for (const duration of live.slice(1)) assert.ok(Math.abs(duration - 1.45) < 0.001);
    const saved = await tts.synthesize(input, {blob:true});
    assert.equal(messages.length, 4, "le cache brut reste réutilisé");
    assert.equal(wavDuration(await saved.wav.arrayBuffer()), wavDuration(first.wav));
    assert.deepEqual(saved.pauses, first.pauses);
  } finally {globalThis.Worker = NativeWorker;}
});

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
    const result = await createTts({ workers: 1 }).synthesize({ text: "Première phrase. Deuxième phrase. Troisième phrase.", voice: "tom", speed: 1 }, {
      onChunk: (_wav, index) => chunks.push(index),
    });
    // La phrase suivante part avant la reprise (préparation en avance), mais rien n'est rejoué deux fois.
    assert.deepEqual(messages, ["Première phrase.", "Deuxième phrase.", "Troisième phrase.", "Deuxième phrase."]);
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

test("plusieurs moteurs : l'ordre de lecture est gardé et la voix se télécharge une seule fois", async () => {
  const NativeWorker = globalThis.Worker;
  const workers = [];
  globalThis.Worker = class {
    constructor() { this.messages = []; workers.push(this); }
    postMessage(message) {
      this.messages.push(message);
      // Les réponses arrivent dans le désordre : la phrase la plus longue finit en dernier.
      const seconds = message.type === "download" ? 0.05 : 0.2 + message.text.length / 2000;
      const delay = message.type === "download" ? 5 : 40 - message.text.length / 4;
      setTimeout(() => this.onmessage({ data: { id: message.id, type: "done", wav: encodeWav(new Int16Array(Math.round(22050 * seconds)), 22050) } }), delay);
    }
    terminate() {}
  };
  try {
    const tts = createTts({ workers: 3, threads: 2 });
    const sentences = ["Une phrase bien plus longue que les autres, pour finir après elles.", "Court.", "Moyenne phrase ici.", "Bref.", "Encore une.", "Fin."];
    const order = [];
    const promise = tts.synthesize({ text: sentences.join(" "), voice: "jessica", speed: 1 }, { onChunk: (_wav, i) => order.push(i) });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(workers.length, 1, "voix pas encore en cache : un seul moteur la prépare");
    const result = await promise;
    assert.deepEqual(order, [0, 1, 2, 3, 4, 5]);
    assert.deepEqual(result.chunks, sentences);
    assert.ok(workers.length > 1 && workers.length <= 3, `moteurs : ${workers.length}`);
    const sent = workers.flatMap((w) => w.messages);
    assert.equal(sent.length, sentences.length, "chaque phrase est calculée une fois");
    assert.ok(sent.every((m) => m.threads === 2));
    // Même résultat, au même échantillon près, qu'avec un seul moteur.
    const alone = await createTts({ workers: 1 }).synthesize({ text: sentences.join(" "), voice: "jessica", speed: 1 });
    assert.deepEqual(result.durations, alone.durations);
    assert.deepEqual(new Uint8Array(result.wav), new Uint8Array(alone.wav));
  } finally { globalThis.Worker = NativeWorker; }
});

test("plan des moteurs selon l'appareil", () => {
  assert.deepEqual(enginePlan({ cores: 10, isolated: true, memoryGb: 8 }), { workers: 2, threads: 4 });
  assert.deepEqual(enginePlan({ cores: 10, isolated: false }), { workers: 3, threads: 1 });
  assert.deepEqual(enginePlan({ cores: 6, isolated: false }), { workers: 2, threads: 1 });
  assert.deepEqual(enginePlan({ cores: 6, isolated: true, mobile: true }), { workers: 1, threads: 4 }, "iPhone : mémoire inconnue, un seul moteur");
  assert.deepEqual(enginePlan({ cores: 8, isolated: false, memoryGb: 2 }), { workers: 1, threads: 1 });
  assert.deepEqual(enginePlan({ cores: 2, isolated: true }), { workers: 1, threads: 2 });
});
