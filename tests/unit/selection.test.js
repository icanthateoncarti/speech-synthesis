import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeText } from "../../src/text.js";
import { normalizeWithMap } from "../../src/text-map.js";
import { addRange, subtractRange, wordRange, applyTool, readRanges, excerpt, hasMarks, selectedLength } from "../../src/selection.js";

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

test("intervalles : vides, inversés, qui se touchent et hors du texte", () => {
  assert.deepEqual(addRange([], [5, 5]), []);
  assert.deepEqual(addRange([], [8, 3]), []);
  assert.deepEqual(addRange([[0, 5]], [5, 10]), [[0, 10]], "deux intervalles qui se touchent fusionnent");
  assert.deepEqual(addRange([[0, 5]], [6, 10]), [[0, 5], [6, 10]]);
  assert.deepEqual(addRange([[10, 20]], [0, 10]), [[0, 20]], "toucher par la gauche fusionne aussi");
  assert.deepEqual(addRange([[5, 10]], [0, 100]), [[0, 100]]);
  assert.deepEqual(addRange([[10, 20], [0, 5]], [4, 12]), [[0, 20]], "l'entrée désordonnée ressort triée");

  assert.deepEqual(subtractRange([], [0, 10]), []);
  assert.deepEqual(subtractRange([[0, 10]], [5, 5]), [[0, 10]]);
  assert.deepEqual(subtractRange([[0, 10]], [10, 20]), [[0, 10]]);
  assert.deepEqual(subtractRange([[0, 10]], [-5, 0]), [[0, 10]]);
  assert.deepEqual(subtractRange([[0, 10]], [-5, 5]), [[5, 10]]);
  assert.deepEqual(subtractRange([[0, 10]], [5, 20]), [[0, 5]]);
  assert.deepEqual(subtractRange([[0, 10]], [-5, 20]), []);

  const empty = { include: [], exclude: [] };
  assert.deepEqual(applyTool(empty, "include", [5, 5]), empty);
  assert.deepEqual(applyTool(empty, "include", [8, 3]), empty);
  assert.deepEqual(applyTool(empty, "inconnu", [1, 2]), empty);
  let marks = applyTool(empty, "include", [0, 10]);
  marks = applyTool(marks, "exclude", [3, 5]);
  assert.deepEqual(marks, { include: [[0, 3], [5, 10]], exclude: [[3, 5]] });
  marks = applyTool(marks, "include", [4, 6]);
  assert.deepEqual(marks, { include: [[0, 3], [4, 10]], exclude: [[3, 4]] }, "le trait rouge restant ne recouvre jamais le jaune");

  assert.deepEqual(readRanges(0, empty), []);
  // Corrigé à la relecture : un passage ne déborde jamais du texte.
  assert.deepEqual(readRanges(0, { include: [[0, 5]], exclude: [] }), []);
  assert.deepEqual(readRanges(10, { include: [[-3, 4], [8, 15]], exclude: [] }), [[0, 4], [8, 10]]);
  assert.deepEqual(readRanges(10, empty), [[0, 10]]);
  assert.deepEqual(readRanges(10, { include: [[2, 4]], exclude: [[0, 10]] }), []);
  assert.deepEqual(readRanges(10, { include: [[0, 10]], exclude: [[2, 2]] }), [[0, 10]]);
  assert.deepEqual(readRanges(10, { include: [[0, 10]], exclude: [[-5, 3], [7, 20]] }), [[3, 7]]);
});

test("mot et extrait : texte vide, passages d'espaces et chapitres aux bornes", () => {
  assert.deepEqual(wordRange("", 0, 0), [0, 0]);
  assert.deepEqual(wordRange("", 5, -3), [0, 0]);
  assert.deepEqual(wordRange("Bonjour", -5, 100), [0, 7]);
  assert.deepEqual(wordRange("  mot  ", 2, 3), [2, 5]);
  assert.deepEqual(wordRange("  mot  ", 0, 100), [0, 7], "deux clics aux bornes prennent tout");
  assert.deepEqual(wordRange("a b", 1, 2), [0, 3], "l'ordre des clics est indifférent");

  assert.deepEqual(excerpt("", [[0, 10]], []), { text: "", chapters: [] });
  assert.deepEqual(excerpt("   \n\t  ", [[0, 8]], [{ title: "Vide", offset: 0 }]), { text: "", chapters: [] });
  assert.deepEqual(excerpt("abc", [], []), { text: "", chapters: [] });

  const text = "Chapitre 1\nA\nChapitre 2\nB";
  const chapters = [
    { title: "Fin", offset: text.length },
    { title: "Chapitre 2", offset: text.indexOf("Chapitre 2") },
    { title: "Chapitre 1", offset: 0 },
  ];
  const all = excerpt(text, [[0, text.length]], chapters);
  assert.equal(all.text, text);
  assert.deepEqual(all.chapters, [{ title: "Chapitre 1", offset: 0 }, { title: "Chapitre 2", offset: 13 }], "le chapitre à la fin n'a pas de texte");
  assert.deepEqual(excerpt(text, [[text.indexOf("A"), text.indexOf("Chapitre 2")]], chapters).chapters,
    [{ title: "Chapitre 1", offset: 0 }]);
  assert.deepEqual(excerpt(text, [[0, 1]], [{ title: "Début", offset: 0 }]).chapters, [{ title: "Début", offset: 0 }]);
});

// Générateur linéaire congruentiel : même suite à chaque exécution.
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

test("au hasard : 500 traits d'outil gardent les passages triés, disjoints et jamais à lire et à sauter", () => {
  const random = seeded(20261027), length = 60;
  let marks = { include: [], exclude: [] };
  const invalid = (ranges) => ranges.some(([a, b]) => a < 0 || b > length || b <= a);
  const readable = (state) => {
    const keep = Array(length).fill(false);
    for (const [a, b] of (state.include.length ? state.include : [[0, length]])) {
      for (let i = a; i < b; i++) keep[i] = true;
    }
    for (const [a, b] of state.exclude) {
      for (let i = Math.max(0, a); i < Math.min(length, b); i++) keep[i] = false;
    }
    const out = [];
    let start = null;
    for (let i = 0; i <= length; i++) {
      if (i < length && keep[i] && start === null) start = i;
      if (start !== null && (i === length || !keep[i])) { out.push([start, i]); start = null; }
    }
    return out;
  };
  for (let step = 0; step < 500; step++) {
    const tool = ["include", "exclude", "erase"][Math.floor(random() * 3)];
    let start = Math.floor(random() * (length + 1));
    let end = Math.floor(random() * (length + 1));
    if (random() < 0.15) [start, end] = [end, start];
    if (random() < 0.1) end = start;
    marks = applyTool(marks, tool, [start, end]);
    for (const key of ["include", "exclude"]) {
      const ranges = marks[key];
      assert.equal(invalid(ranges), false, `${key} valides à l'étape ${step}`);
      for (let i = 1; i < ranges.length; i++) {
        assert.ok(ranges[i][0] > ranges[i - 1][1], `${key} triés et disjoints à l'étape ${step}`);
      }
    }
    for (const [a, b] of marks.include) {
      for (const [c, d] of marks.exclude) {
        assert.ok(Math.max(a, c) >= Math.min(b, d), `jamais à lire et à sauter à l'étape ${step}`);
      }
    }
    const ranges = readRanges(length, marks);
    assert.deepEqual(ranges, readable(marks), `lecture exacte à l'étape ${step}`);
    assert.equal(selectedLength(ranges), ranges.reduce((n, [a, b]) => n + b - a, 0), `longueur à l'étape ${step}`);
  }
});

test("extrait : passages joints ligne par ligne, chapitres replacés", () => {
  const text = "Chapitre 1\nIntro du cours. Détail inutile.\nChapitre 2\nLa suite importante.";
  const chapters = [{ title: "Chapitre 1", offset: 0 }, { title: "Chapitre 2", offset: text.indexOf("Chapitre 2") }];
  const ranges = [[text.indexOf("Intro"), text.indexOf(" Détail")], [text.indexOf("Chapitre 2"), text.length]];
  const result = excerpt(text, ranges, chapters);
  assert.equal(result.text, "Intro du cours.\nChapitre 2\nLa suite importante.");
  assert.deepEqual(result.chapters, [{ title: "Chapitre 1", offset: 0 }, { title: "Chapitre 2", offset: "Intro du cours.\n".length }]);
});
