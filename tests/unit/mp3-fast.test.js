import { test } from "node:test";
import assert from "node:assert/strict";
import { fastChunks, fastVoice, fastMp3, FAST_MAX_CHARS } from "../../src/mp3-fast.js";
import { TTS } from "../../services/sharing/worker.js";

test("MP3 rapide : morceaux coupés après une phrase, jamais plus longs que ce qu'accepte le relais", () => {
  assert.equal(FAST_MAX_CHARS, TTS.maxChars);
  const sentence = "Le droit des obligations encadre les contrats entre particuliers. ";
  const text = sentence.repeat(200);
  const chunks = fastChunks(text);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= FAST_MAX_CHARS));
  assert.ok(chunks.every((chunk) => chunk.endsWith(".")));
  assert.equal(chunks.join(" "), text.trim());
  const word = "x".repeat(FAST_MAX_CHARS * 2 + 10);
  assert.deepEqual(fastChunks(word).map((chunk) => chunk.length), [FAST_MAX_CHARS, FAST_MAX_CHARS, 10]);
  assert.deepEqual(fastChunks("  Court.  "), ["Court."]);
});

test("MP3 rapide : voix Azure du même genre que la voix choisie, dans la langue du cours", () => {
  assert.equal(fastVoice("jessica", "fr"), "fr-FR-DeniseNeural");
  assert.equal(fastVoice("tom", "en"), "en-US-GuyNeural");
  assert.equal(fastVoice("tom", "nl"), "nl-BE-ArnaudNeural");
  for (const lang of ["fr", "en", "nl"]) for (const voice of ["jessica", "tom"]) assert.ok(TTS.voices.has(fastVoice(voice, lang)));
});

test("MP3 rapide : morceaux remis dans l'ordre, quota signalé", async (t) => {
  const text = "Une phrase assez longue pour remplir un morceau. ".repeat(150);
  const sent = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    const { text: chunk } = JSON.parse(init.body);
    sent.push(chunk);
    // Le premier morceau répond en dernier : l'ordre du MP3 ne doit pas en dépendre.
    if (sent.length === 1) await new Promise((resolve) => setTimeout(resolve, 20));
    return new Response(new TextEncoder().encode(`[${chunk.length}]`));
  });
  const progress = [];
  const mp3 = new TextDecoder().decode(await fastMp3(text, { voice: "jessica", lang: "fr", onProgress: (pct) => progress.push(pct) }));
  assert.equal(mp3, fastChunks(text).map((chunk) => `[${chunk.length}]`).join(""));
  assert.equal(progress.at(-1), 100);
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ reason: "daily" }), { status: 429 }));
  await assert.rejects(fastMp3("Court.", { voice: "tom", lang: "fr" }), (error) => error.kind === "quota" && error.reason === "daily");
});
