import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeText } from "../../src/text.js";
import { normalizeWithMap } from "../../src/text-map.js";
import { addRange, subtractRange, wordRange, applyTool, readRanges, excerpt, hasMarks } from "../../src/selection.js";

test("normalizeWithMap : même texte que normalizeText et positions alignées caractère par caractère", () => {
  const samples = ["  Bonjour   le\tmonde \n\n suite\r\nfin  ", "a b\u0007c \n d", "\r\rx", "", "   ", "Le fil rouge\nTout le cours"];
  for (const raw of samples) {
    const { text, map } = normalizeWithMap(raw);
    assert.equal(text, normalizeText(raw), JSON.stringify(raw));
    assert.equal(map.length, raw.length + 1);
    for (let i = 0; i < raw.length; i++) {
      assert.ok(map[i] >= 0 && map[i] <= text.length);
      if (i) assert.ok(map[i] >= map[i - 1], "positions croissantes");
      if (/[^\s\u0000-\u001f]/u.test(raw[i])) assert.equal(text[map[i]], raw[i], `${JSON.stringify(raw)} [${i}]`);
    }
  }
  // Texte aléatoire : jamais de désalignement d'un caractère visible.
  const alphabet = ["a", "é", " ", "  ", "\t", "\n", "\r\n", " ", ".", "x\u0001"];
  for (let n = 0; n < 300; n++) {
    let raw = "";
    for (let k = 0; k < 30; k++) raw += alphabet[(n * 7 + k * 13 + k * k) % alphabet.length];
    const { text, map } = normalizeWithMap(raw);
    assert.equal(text, normalizeText(raw));
    for (let i = 0; i < raw.length; i++) if (/[^\s\u0000-\u001f]/u.test(raw[i])) assert.equal(text[map[i]], raw[i]);
  }
});

test("passages : ajout fusionné, gomme qui coupe, clic sur un mot étendu au mot entier", () => {
  let ranges = addRange([], [10, 20]);
  ranges = addRange(ranges, [30, 40]);
  ranges = addRange(ranges, [18, 32]);
  assert.deepEqual(ranges, [[10, 40]]);
  assert.deepEqual(subtractRange(ranges, [15, 25]), [[10, 15], [25, 40]]);
  assert.deepEqual(subtractRange(ranges, [0, 100]), []);
  const text = "Le fil rouge du cours";
  assert.deepEqual(wordRange(text, 5, 8), [3, 12]); // « fil » … « rouge », clics au milieu des mots
  assert.deepEqual(wordRange(text, 14, 4), [3, 15]); // ordre des clics indifférent
});

test("deux surligneurs : « à lire » restreint, « à sauter » retire, la gomme efface les deux", () => {
  const empty = { include: [], exclude: [] };
  assert.equal(hasMarks(empty), false);
  assert.deepEqual(readRanges(100, empty), [[0, 100]]);
  let marks = applyTool(empty, "exclude", [20, 30]);
  assert.deepEqual(readRanges(100, marks), [[0, 20], [30, 100]], "tout sauf le passage barré");
  marks = applyTool(marks, "include", [10, 60]);
  assert.deepEqual(marks, { include: [[10, 60]], exclude: [] }, "un passage ne peut pas être à la fois à lire et à sauter");
  marks = applyTool(marks, "exclude", [40, 45]);
  assert.deepEqual(readRanges(100, marks), [[10, 40], [45, 60]], "seulement le jaune, moins le rouge");
  marks = applyTool(marks, "erase", [0, 100]);
  assert.equal(hasMarks(marks), false);
});

test("extrait : passages joints ligne par ligne, chapitres replacés", () => {
  const text = "Chapitre 1\nIntro du cours. Détail inutile.\nChapitre 2\nLa suite importante.";
  const chapters = [{ title: "Chapitre 1", offset: 0 }, { title: "Chapitre 2", offset: text.indexOf("Chapitre 2") }];
  const ranges = [[text.indexOf("Intro"), text.indexOf(" Détail")], [text.indexOf("Chapitre 2"), text.length]];
  const result = excerpt(text, ranges, chapters);
  assert.equal(result.text, "Intro du cours.\nChapitre 2\nLa suite importante.");
  assert.deepEqual(result.chapters, [{ title: "Chapitre 1", offset: 0 }, { title: "Chapitre 2", offset: "Intro du cours.\n".length }]);
});
