import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeText, hasSpeakableContent, splitIntoChunks, clampSpeed, speedToLengthScale, wordTimeline } from "../../src/text.js";

test("normalizeText réduit les espaces et trim", () => {
  assert.equal(normalizeText("  Bonjour\t\t le   monde \u0007 "), "Bonjour le monde");
});
test("hasSpeakableContent refuse vide, espaces, emojis seuls", () => {
  for (const t of ["", "   ", "🙂🙂 !!", "… ?"]) assert.equal(hasSpeakableContent(t), false);
  assert.equal(hasSpeakableContent("1789"), true);
});
test("splitIntoChunks coupe aux phrases", () => {
  assert.deepEqual(splitIntoChunks("Bonjour le monde. Ça va ? Oui!"), ["Bonjour le monde.", "Ça va ?", "Oui!"]);
});
test("splitIntoChunks ne dépasse jamais maxChars et ignore le non-prononçable", () => {
  const long = ("mot ".repeat(300)).trim() + ".";
  const chunks = splitIntoChunks(long + " 🙂🙂. Fin.", 400);
  assert.ok(chunks.every(c => c.length > 0 && c.length <= 400));
  assert.ok(chunks.every(hasSpeakableContent));
  assert.equal(chunks.at(-1), "Fin.");
  assert.deepEqual(splitIntoChunks("🙂 !!"), []);
});
test("splitIntoChunks tient 50 000 caractères", () => {
  const big = "Le peuple de Paris prend la Bastille. ".repeat(1400);
  assert.ok(splitIntoChunks(big).length > 100);
});
test("vitesse bornée et convertie", () => {
  assert.equal(clampSpeed(2), 1.5); assert.equal(clampSpeed(0.2), 0.7); assert.equal(clampSpeed(1.04), 1.0);
  assert.equal(speedToLengthScale(1.0), 1); assert.equal(speedToLengthScale(1.5), 0.67); assert.equal(speedToLengthScale(0.7), 1.43);
});
test("wordTimeline enchaîne les morceaux", () => {
  const tl = wordTimeline(["Bonjour le monde.", "Salut."], [1.0, 0.5]);
  assert.equal(tl.length, 4);
  assert.equal(tl[0].start, 0);
  assert.equal(tl[3].word, "Salut.");
  assert.equal(tl[3].start, 1.0);
  assert.equal(tl[3].end, 1.5);
  for (let i = 1; i < tl.length; i++) assert.ok(tl[i].start >= tl[i - 1].end - 1e-9);
});
