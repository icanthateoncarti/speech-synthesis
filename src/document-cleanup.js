import { readRanges, subtractRange, excerpt } from "./selection.js";

const CHAPTER = /^(?:chapitre|chapter|partie|part|section|module|unité|unit|lesson|leçon)\s+(?:[a-z]|\d+|[ivxlcdm]+)(?:\b|[.:–—-])/iu;
const PAGE_NUMBER = /^(?:(?:page|slide|diapo)\s*)?\d+\s*(?:(?:\/|sur|of)\s*\d+)?$/iu;
const ROMAN_PAGE = /^[ivxlcdm]{1,8}$/iu;
const normalizeKey = (text) => text.toLocaleLowerCase("fr").replace(/\s+/gu, " ");

function pageNumberValue(text) {
  return PAGE_NUMBER.test(text) || ROMAN_PAGE.test(text) ? normalizeKey(text) : null;
}

// Propositions seulement : jamais de suppression automatique. Les répétitions
// doivent apparaître sur plusieurs pages et au bord de la page / diapositive.
export function repeatedNoise(fragments, pageCount) {
  const groups = new Map();
  const pageGroups = new Map();
  let order = 0;
  for (const fragment of fragments) {
    const text = fragment.text.replace(/^\s*[•·]\s*/u, "").trim();
    if (!fragment.edge || !text || text.length > 180 || CHAPTER.test(text) || fragment.end <= fragment.start) continue;
    const pageValue = pageNumberValue(text);
    if (pageValue !== null) {
      if (!pageGroups.has(pageValue)) pageGroups.set(pageValue, { text, pages: new Set(), ranges: [], order: order++ });
      const group = pageGroups.get(pageValue);
      group.pages.add(fragment.page);
      group.ranges.push([fragment.start, fragment.end]);
      continue;
    }
    const key = normalizeKey(text).replace(/\b(page|slide|diapo)\s+\d+(?:\s*(?:\/|sur|of)\s*\d+)?\s*$/iu, "$1 #");
    if (!groups.has(key)) groups.set(key, { id: key, text, pages: new Set(), ranges: [], order: order++ });
    const group = groups.get(key);
    group.pages.add(fragment.page);
    group.ranges.push([fragment.start, fragment.end]);
  }
  const suggestions = [...groups.values()];
  if (pageGroups.size === 1) {
    const [group] = pageGroups.values();
    const id = normalizeKey(group.text);
    suggestions.push({ id, text: group.text, pages: group.pages, ranges: group.ranges, order: group.order });
  } else if (pageGroups.size > 1) {
    const pages = new Set(), ranges = [];
    let first = Infinity;
    for (const group of pageGroups.values()) {
      group.pages.forEach((page) => pages.add(page));
      ranges.push(...group.ranges);
      first = Math.min(first, group.order);
    }
    suggestions.push({ id: "page-number", text: "Numéros de page", pages, ranges, order: first });
  }
  const minimum = Math.max(2, Math.ceil(pageCount * 0.5));
  return suggestions.sort((a, b) => a.order - b.order).filter((group) => group.pages.size >= minimum)
    .map(({ id, text, pages, ranges }) => ({ id, text, pages: pages.size, ranges }));
}

export function documentExcerpt(source, marks = { include: [], exclude: [] }) {
  let ranges = readRanges(source.fullText.length, marks);
  const removed = new Set(source.removed ?? []);
  for (const suggestion of source.suggestions) {
    if (removed.has(suggestion.id)) for (const range of suggestion.ranges) ranges = subtractRange(ranges, range);
  }
  return { ...excerpt(source.fullText, ranges, source.fullChapters), ranges };
}

// Les coordonnées PDF sont celles de PDF.js, avant la rotation de l’affichage.
// Seules les lignes proches des marges sont candidates ; les cellules de tableaux
// sont protégées pour ne pas supprimer leurs en-têtes répétés.
export function pdfFragments(items, spans, map, text, view, tableItems = new Set()) {
  const strings = items.filter((item) => typeof item.str === "string");
  const fragments = [];
  let line = [];
  const flush = () => {
    const parts = line.filter(({ item, i }) => item.str.trim() && spans[2 * i] >= 0);
    line = [];
    if (!parts.length || parts.some(({ item }) => tableItems.has(item))) return;
    let start = Infinity, end = -1;
    for (const { i } of parts) { start = Math.min(start, map[spans[2 * i]]); end = Math.max(end, map[spans[2 * i + 1]]); }
    const ys = parts.map(({ item }) => item.transform?.[5]);
    const height = view?.[3] - view?.[1];
    const edge = height > 0 && ys.every((y) => Number.isFinite(y) && (y <= view[1] + height * 0.12 || y >= view[3] - height * 0.16));
    if (end > start && end <= text.length) fragments.push({ text: text.slice(start, end), start, end, edge });
  };
  strings.forEach((item, i) => { line.push({ item, i }); if (item.hasEOL) flush(); });
  flush();
  return fragments;
}
