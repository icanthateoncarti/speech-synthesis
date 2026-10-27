// Passages surlignés dans un document : des intervalles [début, fin[ du texte
// extrait, triés et fusionnés. Deux surligneurs (Jonas, 2026-10-26) :
// « à lire » (seuls ces passages sont lus) et « à sauter » (tout sauf eux).
// La gomme retire les deux.

const WORD = /[^\s]/u;

export function addRange(ranges, [start, end]) {
  if (end <= start) return ranges;
  const out = [];
  let merged = [start, end];
  for (const range of ranges) {
    if (range[1] < merged[0] || range[0] > merged[1]) out.push(range);
    else merged = [Math.min(range[0], merged[0]), Math.max(range[1], merged[1])];
  }
  out.push(merged);
  return out.sort((a, b) => a[0] - b[0]);
}

export function subtractRange(ranges, [start, end]) {
  if (end <= start) return ranges;
  const out = [];
  for (const [a, b] of ranges) {
    if (b <= start || a >= end) { out.push([a, b]); continue; }
    if (a < start) out.push([a, start]);
    if (b > end) out.push([end, b]);
  }
  return out;
}

// Un clic désigne un mot : le passage commence au début du premier mot cliqué et
// finit après le dernier, quel que soit l'ordre des deux clics.
export function wordRange(text, first, second) {
  let start = Math.max(0, Math.min(first, second));
  let end = Math.min(text.length, Math.max(first, second));
  while (start > 0 && WORD.test(text[start - 1])) start--;
  while (end < text.length && WORD.test(text[end])) end++;
  return [start, end];
}

/** Applique un trait d'outil : un passage ne peut être à la fois à lire et à sauter. */
export function applyTool(marks, tool, range) {
  const include = subtractRange(marks.include, range), exclude = subtractRange(marks.exclude, range);
  if (tool === "include") return { include: addRange(include, range), exclude };
  if (tool === "exclude") return { include, exclude: addRange(exclude, range) };
  return { include, exclude };
}

/** Ce qui sera lu : les passages « à lire » (ou tout le texte), moins ceux « à sauter ». */
export function readRanges(length, { include, exclude }) {
  // Jamais de passage hors du texte, même si des marques le débordent.
  const inside = include.map(([a, b]) => [Math.max(0, a), Math.min(length, b)]).filter(([a, b]) => b > a);
  let ranges = include.length ? inside : (length ? [[0, length]] : []);
  for (const range of exclude) ranges = subtractRange(ranges, range);
  return ranges;
}

export function hasMarks(marks) {
  return Boolean(marks && (marks.include.length || marks.exclude.length));
}

/** Texte à lire et chapitres correspondants, à partir des passages retenus. */
export function excerpt(text, ranges, chapters = []) {
  const parts = [], mapped = [];
  let length = 0;
  const sorted = [...chapters].sort((a, b) => a.offset - b.offset);
  for (const [start, end] of ranges) {
    const raw = text.slice(start, end);
    const lead = raw.length - raw.trimStart().length;
    const value = raw.trim();
    if (!value) continue;
    if (parts.length) length += 1;
    const base = length, from = start + lead;
    // Le chapitre en cours au début du passage reste visible dans la liste.
    const current = sorted.filter((chapter) => chapter.offset <= from).at(-1);
    if (current) mapped.push({ title: current.title, offset: base });
    for (const chapter of sorted) {
      if (chapter.offset > from && chapter.offset < from + value.length) mapped.push({ title: chapter.title, offset: base + chapter.offset - from });
    }
    parts.push(value);
    length += value.length;
  }
  const seen = new Set();
  return {
    text: parts.join("\n"),
    chapters: mapped.filter((chapter) => !seen.has(chapter.offset) && seen.add(chapter.offset)),
  };
}

export function selectedLength(ranges) {
  return ranges.reduce((n, [a, b]) => n + b - a, 0);
}
