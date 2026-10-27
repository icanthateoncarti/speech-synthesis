import { test } from "node:test";
import assert from "node:assert/strict";
import { pdfPageText } from "../../src/pdf.js";
import { pdfTables } from "../../src/pdf-tables.js";
import { normalizeWithMap } from "../../src/text-map.js";

function fixture({ columnOrder = false, header = true, empty = false, merged = false } = {}) {
  const values = [["Cours", "Durée"], ["Économie", empty ? "" : "Deux heures"], ["Anglais", "Une heure"]];
  const cells = values.map((row, y) => row.map((str, x) => ({
    role: header && y === 0 ? "TH" : "TD", colSpan: merged && y === 0 && x === 0 ? 2 : 1,
    children: [{ type: "content", id: `${y}-${x}` }],
  })));
  const texts = values.map((row, y) => row.map((str, x) => ({ str, width: str.length * 5, height: 10, transform: [10, 0, 0, 10, x * 140, 600 - y * 30], hasEOL: true })));
  const order = columnOrder ? [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]] : [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]];
  const items = order.flatMap(([y, x]) => [{ type: "beginMarkedContentProps", id: `${y}-${x}` }, texts[y][x], { type: "endMarkedContent" }]);
  const table = { role: "Table", children: cells.map((children) => ({ role: "TR", children })) };
  return { items, tree: { role: "Root", children: [table] }, table, texts };
}

test("tableau dessiné par colonnes : lecture par lignes et rappel des en-têtes", () => {
  const { items, tree } = fixture({ columnOrder: true });
  assert.equal(pdfPageText(items, tree), "Cours ; Durée.\nCours : Économie ; Durée : Deux heures.\nCours : Anglais ; Durée : Une heure.");
});

test("les offsets des mots restent exacts après réorganisation et ajout des en-têtes", () => {
  const { items, tree } = fixture({ columnOrder: true });
  const spans = new Map();
  const raw = pdfPageText(items, tree, [], (item, start, end) => spans.set(item, [start, end]));
  const { text, map } = normalizeWithMap(raw);
  for (const item of items.filter((item) => item.str)) {
    const [start, end] = spans.get(item);
    assert.equal(raw.slice(start, end), item.str);
    assert.equal(text.slice(map[start], map[end]), item.str);
  }
  assert.equal(spans.size, 6, "les en-têtes ajoutés ne déplacent pas les positions des originaux");
});

test("paragraphes et titres autour d’un tableau conservent leur contenu et leurs positions", () => {
  const { items, tree } = fixture();
  const title = { str: "Chapitre 1", height: 20, hasEOL: true };
  const before = { str: "Le programme des cours.", height: 10, hasEOL: true };
  const after = { str: "Fin du tableau.", height: 10, hasEOL: true };
  const headings = [], spans = new Map();
  const raw = pdfPageText([title, before, ...items, after], tree, headings, (item, start, end) => spans.set(item, [start, end]));
  assert.ok(raw.startsWith("Chapitre 1\nLe programme des cours.\nCours ; Durée."));
  assert.ok(raw.endsWith("\nFin du tableau."));
  assert.deepEqual(headings, ["Chapitre 1"]);
  for (const item of [title, before, after]) assert.equal(raw.slice(...spans.get(item)), item.str);
});

test("cellules vides, fusionnées et tableaux sans en-têtes : aucun libellé inventé", () => {
  let f = fixture({ empty: true });
  assert.match(pdfPageText(f.items, f.tree), /Cours : Économie\.\nCours : Anglais ; Durée : Une heure\./);
  for (const options of [{ header: false }, { merged: true }]) {
    f = fixture(options);
    assert.equal(pdfPageText(f.items, f.tree), "Cours ; Durée.\nÉconomie ; Deux heures.\nAnglais ; Une heure.");
  }
});

test("absence de balises ou structure incomplète : conserver l’extraction antérieure", () => {
  const f = fixture();
  const original = pdfPageText(f.items, null);
  assert.equal(original, "Cours Durée Économie Deux heures Anglais Une heure");
  f.table.children[1].children.pop();
  assert.equal(pdfPageText(f.items, f.tree), original, "ne pas perdre la cellule non référencée");
  const duplicate = fixture();
  duplicate.table.children.push(duplicate.table.children[1]);
  assert.equal(pdfTables(duplicate.items, duplicate.tree).length, 0);
});

test("retour à la ligne et fragments d’un mot à l’intérieur d’une cellule", () => {
  const f = fixture();
  const at = f.items.indexOf(f.texts[1][0]);
  f.items.splice(at, 1,
    { str: "Éco", height: 10, width: 15, transform: [10, 0, 0, 10, 0, 570] },
    { str: "nomie", height: 10, width: 25, transform: [10, 0, 0, 10, 15, 570] },
    { str: "", hasEOL: true },
    { str: "générale", height: 10, width: 40, transform: [10, 0, 0, 10, 0, 555] });
  assert.match(pdfPageText(f.items, f.tree), /Cours : Économie générale ; Durée/);
});
