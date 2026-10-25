import { test } from "node:test";
import assert from "node:assert/strict";
import { splitIntoChunks, sentenceSpans } from "../../src/text.js";
import { buildReadingIndex } from "../../src/navigation.js";
import { parseVoiceCommand, MAX_COMMAND_LENGTH } from "../../src/voice-commands.js";

// Ancienne version (quadratique), gardée ici seulement pour vérifier l'équivalence.
const legacy = (line) => (line.match(/.*?(?:[.!?…]+["'»)\]]*(?=\s|$)|$)/gu) ?? []).map((p) => p.trim()).filter(Boolean);
const scanned = (line) => sentenceSpans(line).map(([a, b]) => line.slice(a, b).trim()).filter(Boolean);

test("S01 : le découpage linéaire donne les mêmes phrases que l'ancienne regex", () => {
  for (const line of [
    "Bonjour. Comment ça va ? Très bien !",
    "Il a dit « oui. » Puis il est parti…",
    "Version 3.5 du cours, voir p. 12. Fin.",
    "Quoi ?! Vraiment... (Oui.) D'accord.",
    "Pas de ponctuation finale",
    "  Espaces   autour.   ",
    "...",
    "a.b.c. d",
    'Elle répond "non." et s\'en va.',
    "Point final.)",
  ]) assert.deepEqual(scanned(line), legacy(line), line);
});

test("S01 : un texte piégé ne fige plus la page (coût linéaire)", () => {
  for (const text of [".".repeat(200_000) + "x", "?!".repeat(100_000) + "x", "…".repeat(100_000) + "a"]) {
    const start = performance.now();
    const chunks = splitIntoChunks(text);
    buildReadingIndex(text, chunks);
    assert.ok(performance.now() - start < 300, `${Math.round(performance.now() - start)} ms`);
  }
});

test("S02 : une commande démesurée est rejetée sans être analysée", () => {
  const long = "avance " + "mille ".repeat(4000) + "phrases";
  const start = performance.now();
  assert.equal(parseVoiceCommand(long), null);
  assert.ok(performance.now() - start < 5);
  assert.equal(parseVoiceCommand("avance de " + "x".repeat(MAX_COMMAND_LENGTH)), null);
  assert.deepEqual(parseVoiceCommand("reviens 3 phrases en arrière"), { type: "relative-sentence", count: -3 });
});
