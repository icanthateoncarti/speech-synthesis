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
