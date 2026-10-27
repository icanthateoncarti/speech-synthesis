import { test } from "node:test";
import assert from "node:assert/strict";
import { repeatedNoise, documentExcerpt, pdfFragments } from "../../src/document-cleanup.js";

const fragment = (text, page, start = 0, edge = true) => ({ text, page, start, end: start + text.length, edge });

test("proposer les en-têtes répétés et numéros, préserver les chapitres et le contenu central", () => {
  const fragments = [1, 2, 3].flatMap((page) => [
    fragment("Cours programmation — EPHEC 2025/2026", page),
    fragment(`Page ${page} / 3`, page),
    fragment("Chapitre 1 : Variables", page),
    fragment("Chapter II", page),
    fragment("Définition essentielle", page, 0, false),
  ]);
  fragments.push(fragment("Un titre unique", 1));
  assert.deepEqual(repeatedNoise(fragments, 3).map((item) => item.text), ["Cours programmation — EPHEC 2025/2026", "Numéros de page"]);
  assert.equal(repeatedNoise([fragment("Cours", 1), fragment("Cours", 1)], 3).length, 0);
});

test("le nettoyage est réversible, respecte la sélection et recalcule les chapitres", () => {
  const fullText = "EPHEC\nChapitre 1\nPremière phrase.\nEPHEC\nChapitre 2\nDeuxième phrase.";
  const last = fullText.lastIndexOf("EPHEC");
  const source = { fullText, fullChapters: [{ title: "Chapitre 1", offset: 6 }, { title: "Chapitre 2", offset: last + 6 }], suggestions: [{ id: "ephec", ranges: [[0, 5], [last, last + 5]] }], removed: ["ephec"] };
  const cleaned = documentExcerpt(source);
  assert.equal(cleaned.text, "Chapitre 1\nPremière phrase.\nChapitre 2\nDeuxième phrase.");
  assert.equal(cleaned.text.slice(cleaned.chapters[1].offset, cleaned.chapters[1].offset + 10), "Chapitre 2");
  assert.equal(documentExcerpt(source, { include: [[last, fullText.length]], exclude: [] }).text, "Chapitre 2\nDeuxième phrase.");
  source.removed = [];
  assert.equal(documentExcerpt(source).text, fullText);
});

test("les tableaux et les lignes sans coordonnées ne deviennent pas des parasites", () => {
  const a = { str: "EPHEC", hasEOL: true, transform: [10, 0, 0, 10, 20, 790] };
  const b = { str: "Colonne", hasEOL: true, transform: [10, 0, 0, 10, 20, 780] };
  const c = { str: "Corps", hasEOL: true, transform: [10, 0, 0, 10, 20, 400] };
  const text = "EPHEC Colonne Corps", map = Int32Array.from({ length: text.length + 1 }, (_, i) => i);
  const out = pdfFragments([a, b, c], [0, 5, 6, 13, 14, 19], map, text, [0, 0, 600, 800], new Set([b]));
  assert.deepEqual(out.map(({ text, edge }) => ({ text, edge })), [{ text: "EPHEC", edge: true }, { text: "Corps", edge: false }]);
});

test("document vide, page unique, en-tête présent sur toutes les pages sauf une", () => {
  assert.deepEqual(repeatedNoise([], 0), []);
  assert.deepEqual(repeatedNoise([], 1), []);
  // Deux fois le même texte sur une seule page : jamais proposé.
  assert.deepEqual(repeatedNoise([fragment("Cours", 0), fragment("Cours", 0, 10)], 1), []);
  // 3 pages, en-tête sur 2 : le minimum est 2.
  const exceptOne = [fragment("En-tête", 0, 0), fragment("En-tête", 1, 10), fragment("Autre", 2, 20)];
  assert.deepEqual(repeatedNoise(exceptOne, 3).map((item) => item.text), ["En-tête"]);
  // 2 pages, en-tête sur une seule : insuffisant.
  assert.deepEqual(repeatedNoise([fragment("En-tête", 0, 0), fragment("Autre", 1, 10)], 2), []);
  // 5 pages, en-tête sur 4 : le minimum est 3.
  const fourOfFive = [0, 1, 2, 3].map((page) => fragment("En-tête", page, page * 10));
  fourOfFive.push(fragment("Autre", 4, 100));
  assert.deepEqual(repeatedNoise(fourOfFive, 5).map((item) => item.text), ["En-tête"]);
  // 5 pages, en-tête sur 2 : insuffisant.
  assert.deepEqual(repeatedNoise([fragment("En-tête", 0, 0), fragment("En-tête", 1, 10)], 5), []);
});

test("numéros de page : chiffres arabes et romains regroupés", () => {
  const arabic = [fragment("1", 0, 0), fragment("2", 1, 10), fragment("Page 3 / 3", 2, 20)];
  assert.deepEqual(repeatedNoise(arabic, 3).map((item) => item.text), ["Numéros de page"]);
  // Des numéros romains distincts suivent la même règle que les chiffres arabes.
  assert.deepEqual(repeatedNoise([fragment("I", 0, 0), fragment("II", 1, 10), fragment("III", 2, 20)], 3).map((item) => item.text), ["Numéros de page"]);
  // Un même numéro romain répété garde son propre texte.
  assert.deepEqual(repeatedNoise([fragment("IV", 0, 0), fragment("IV", 1, 10), fragment("IV", 2, 20)], 3).map((item) => item.text), ["IV"]);
});

test("textes qui ressemblent à un en-tête : titres exclus, nombre identique gardé", () => {
  for (const title of ["Chapitre 1 : Variables", "Chapter II", "Section 3", "Module IV", "Unité 2", "Lesson 4", "Leçon 2"]) {
    assert.deepEqual(repeatedNoise([fragment(title, 0, 0), fragment(title, 1, 100)], 2), [], title);
  }
  // Un nombre identique répété garde son propre texte, pas « Numéros de page ».
  assert.deepEqual(repeatedNoise([fragment("2026", 0, 0), fragment("2026", 1, 10)], 2).map((item) => item.text), ["2026"]);
  // Des nombres différents forment bien le groupe des numéros de page.
  assert.deepEqual(repeatedNoise([fragment("2026", 0, 0), fragment("2027", 1, 10)], 2).map((item) => item.text), ["Numéros de page"]);
  // À vérifier : « Partie A » n’est pas reconnu par la règle des titres de chapitre.
  assert.deepEqual(repeatedNoise([fragment("Partie A", 0, 0), fragment("Partie A", 1, 10)], 2).map((item) => item.text), ["Partie A"]);
});

test("puces, casse et espaces regroupés ; ligne trop longue ou vide ignorée", () => {
  const out = repeatedNoise([
    fragment("• EPHEC", 0, 0),
    fragment("·  ephEc", 1, 10),
    fragment("x".repeat(181), 0, 100),
    fragment("x".repeat(181), 1, 300),
    fragment("•", 0, 500),
    fragment("   ", 0, 510),
  ], 2);
  assert.deepEqual(out.map(({ text, pages }) => ({ text, pages })), [{ text: "EPHEC", pages: 2 }]);
  const emptyRange = [
    { text: "EPHEC", page: 0, start: 5, end: 5, edge: true },
    { text: "EPHEC", page: 1, start: 5, end: 5, edge: true },
  ];
  assert.deepEqual(repeatedNoise(emptyRange, 2), []);
});

test("documentExcerpt : document vide et suppression qui couvre tout le texte", () => {
  assert.deepEqual(documentExcerpt({ fullText: "", fullChapters: [], suggestions: [] }), { text: "", chapters: [], ranges: [] });
  const source = {
    fullText: "EPHEC",
    fullChapters: [{ title: "Chapitre 1", offset: 0 }],
    suggestions: [{ id: "ephec", ranges: [[0, 5]] }],
    removed: ["ephec"],
  };
  assert.deepEqual(documentExcerpt(source), { text: "", chapters: [], ranges: [] });
});

test("pdfFragments : document vide, ligne sans coordonnées, fragment hors bornes", () => {
  assert.deepEqual(pdfFragments([], [], new Int32Array(1), "", [0, 0, 600, 800]), []);
  const a = { str: "Sans position", hasEOL: true };
  const b = { str: "Au milieu", hasEOL: true, transform: [10, 0, 0, 10, 10, 400] };
  const c = { str: "Hors bornes", hasEOL: true, transform: [10, 0, 0, 10, 10, 790] };
  const text = "Sans position Au milieu Hors bornes";
  const map = Int32Array.from({ length: text.length + 1 }, (_, i) => i);
  const out = pdfFragments([a, b, c], [0, 13, 14, 23, 24, 36], map, text, [0, 0, 600, 800]);
  assert.deepEqual(out.map(({ text, edge }) => ({ text, edge })), [
    { text: "Sans position", edge: false },
    { text: "Au milieu", edge: false },
  ]);
});

test("au hasard : le nettoyage ne propose jamais un texte présent une seule fois (300 documents)", () => {
  const random = (seed) => {
    let state = seed >>> 0;
    return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  };
  const normalize = (text) => text.replace(/^\s*[•·]\s*/u, "").trim().toLocaleLowerCase("fr").replace(/\s+/gu, " ");
  const headers = ["Université de Test", "Faculté — Bureau", "Cours de gestion 2026", "Document interne"];
  const chapters = ["Chapitre 1 : Variables", "Section 2", "Module IV", "Leçon 3"];
  const next = random(20261027);
  let suggestions = 0, uniqueEdges = 0;
  for (let document = 0; document < 300; document++) {
    const pageCount = 1 + Math.floor(next() * 6);
    const fragments = [];
    let cursor = 0;
    const add = (text, page, edge = true) => {
      fragments.push({ text, page, start: cursor, end: cursor + text.length, edge });
      cursor += text.length + 1;
    };
    const chosen = headers.filter(() => next() < 0.5).slice(0, 3);
    for (const header of chosen) {
      // Parfois l'en-tête manque sur une page, parfois il n'apparaît qu'une fois.
      const pages = [...Array(pageCount).keys()];
      const used = next() < 0.35
        ? [pages[Math.floor(next() * pageCount)]]
        : pages.filter(() => next() > 0.25);
      for (const page of used) add(header, page);
    }
    for (let page = 0; page < pageCount; page++) {
      const count = Math.floor(next() * 5);
      for (let index = 0; index < count; index++) {
        const roll = next();
        if (roll < 0.25) add(`Note ${document}-${page}-${index}`, page);
        else if (roll < 0.5) add(`Paragraphe ${document}-${page}-${index}`, page, false);
        else if (roll < 0.7) add(chapters[Math.floor(next() * chapters.length)], page);
        else if (roll < 0.85) add("x".repeat(190 + Math.floor(next() * 20)), page);
        else add(`• Puce ${document}-${page}-${index}`, page);
      }
    }
    const out = repeatedNoise(fragments, pageCount);
    const counts = new Map();
    for (const { text } of fragments) counts.set(normalize(text), (counts.get(normalize(text)) ?? 0) + 1);
    const minimum = Math.max(2, Math.ceil(pageCount * 0.5));
    for (const suggestion of out) {
      assert.ok(suggestion.pages >= minimum);
      for (const [start, end] of suggestion.ranges) {
        assert.ok(Number.isInteger(start) && Number.isInteger(end) && start < end && end <= cursor);
      }
    }
    for (const item of fragments) {
      if (counts.get(normalize(item.text)) !== 1) continue;
      if (item.edge) uniqueEdges++;
      for (const suggestion of out) {
        assert.ok(!suggestion.ranges.some(([start, end]) => start === item.start && end === item.end), `texte unique proposé : ${item.text}`);
      }
    }
    assert.deepEqual(repeatedNoise(fragments, pageCount), out, "résultat déterministe");
    suggestions += out.length;
  }
  // Le générateur doit produire des cas utiles, pas seulement des documents vides.
  assert.ok(suggestions > 0, "au moins une proposition attendue");
  assert.ok(uniqueEdges > 0, "au moins un texte de bord unique attendu");
});
