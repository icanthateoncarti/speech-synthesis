import { normalizeText } from "./text.js";
import { MAX_FILE_BYTES, MAX_PAGES, MAX_TEXT_CHARS, throwIfAborted, tooLarge } from "./limits.js";

let library;

function pageText(items) {
  let text = "", previous = null, lineBreak = false;
  for (const item of items) {
    if (typeof item.str !== "string") continue;
    if (!item.str) { lineBreak ||= Boolean(item.hasEOL); continue; }
    const gap = previous && item.transform?.[4] - (previous.transform?.[4] + previous.width);
    const separated = Number.isFinite(gap) && gap > Math.max(0.5, Math.max(item.height || 0, previous?.height || 0) * 0.15);
    if (text && !/\s$/.test(text) && !/^\s/.test(item.str) && (lineBreak || separated)) text += " ";
    text += item.str;
    previous = item;
    lineBreak = Boolean(item.hasEOL);
  }
  return text;
}

// Les lignes nettement plus grandes que le texte courant de la page sont des
// titres : elles reçoivent leur propre ligne (et donc les pauses de lecture),
// au lieu d'être collées au paragraphe comme les retours de mise en page.
function pageTextWithHeadings(items, headings = []) {
  const lines = [];
  let current = [];
  for (const item of items) {
    if (typeof item.str !== "string") continue;
    current.push(item);
    if (item.hasEOL) { lines.push(current); current = []; }
  }
  if (current.length) lines.push(current);
  const sized = items.filter((item) => item.str?.trim() && item.height > 0);
  if (!sized.length) return pageText(items);
  // Taille du texte courant : médiane pondérée par le nombre de caractères.
  const sorted = sized.map((item) => [item.height, item.str.length]).sort((a, b) => a[0] - b[0]);
  const half = sorted.reduce((n, [, count]) => n + count, 0) / 2;
  let seen = 0, body = sorted[0][0];
  for (const [height, count] of sorted) { seen += count; body = height; if (seen >= half) break; }
  let text = "", previousHeading = false;
  for (const line of lines) {
    const value = pageText(line).trim();
    if (!value) continue;
    const height = Math.max(0, ...line.filter((item) => item.str?.trim()).map((item) => item.height || 0));
    const heading = height >= body * 1.2 && value.length <= 120 && /\p{L}/u.test(value);
    if (heading) headings.push(value);
    if (text) text += heading || previousHeading ? "\n" : " ";
    text += value;
    previousHeading = heading;
  }
  return text;
}

function pageLines(items) {
  const lines = [];
  let current = [];
  for (const item of items) {
    if (typeof item.str !== "string") continue;
    current.push(item);
    if (item.hasEOL) {
      lines.push(normalizeText(pageText(current)));
      current = [];
    }
  }
  if (current.length) lines.push(normalizeText(pageText(current)));
  return lines;
}

const CHAPTER_HEADING = /^(?:chapitre|partie|cours|section)\s+(?:\d+(?:\.\d+)*|[ivxlcdm]+|[a-z]|premi[eè]re?|deuxi[eè]me|troisi[eè]me)(?:\s*[.:–—-]\s*|\s+|$)/iu;

function detectedChapters(pages, pageOffsets) {
  const chapters = [];
  const titles = new Set();
  pages.forEach((page, index) => {
    if (page.lines.some((line) => /^(?:sommaire|table des mati[eè]res)\s*:?$/iu.test(line))) return;
    let cursor = 0;
    for (const line of page.lines) {
      if (!line) continue;
      const offset = page.text.indexOf(line, cursor);
      if (offset < 0) continue;
      cursor = offset + line.length;
      // Un titre explicite au début d'une ligne. Les phrases longues du corps
      // ne deviennent pas des chapitres uniquement parce qu'elles citent un cours.
      const titleKey = line.toLocaleLowerCase("fr").replace(/[‐‑‒–—−]/g, "-");
      if (line.length <= 160 && CHAPTER_HEADING.test(line) && !/\.{2,}\s*\d+\s*$/u.test(line) && !titles.has(titleKey)) {
        titles.add(titleKey);
        chapters.push({ title: line, offset: pageOffsets[index] + offset });
      }
    }
  });
  return chapters;
}

function titleOffset(text, title) {
  const pattern = [...title].map((character) => {
    if (/\s/u.test(character)) return "\\s+";
    if (/[‐‑‒–—−-]/u.test(character)) return "[-‐‑‒–—−]";
    if (/[’`']/u.test(character)) return "['’`]";
    return character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
  // L'index de la RegExp reste celui du texte original, même pour une casse
  // Unicode dont la conversion en minuscules changerait le nombre de caractères.
  return new RegExp(pattern, "iu").exec(text)?.index ?? -1;
}

function outlineLevel(outline) {
  let level = outline;
  // Certains PDF encapsulent tous les chapitres dans un unique signet « livre ».
  while (level.length === 1 && level[0].items?.length) level = level[0].items;
  return level;
}

async function outlineChapters(document, pages, pageOffsets) {
  const outline = await document.getOutline().catch(() => null);
  if (!outline?.length) return [];
  const chapters = [];
  async function visit(nodes) {
    for (const node of nodes) {
      const title = normalizeText(node.title || "");
      let added = false;
      if (title && node.dest) {
        try {
          const destination = typeof node.dest === "string" ? await document.getDestination(node.dest) : node.dest;
          if (Array.isArray(destination) && destination.length) {
            const pageIndex = Number.isInteger(destination[0]) ? destination[0] : await document.getPageIndex(destination[0]);
            const page = pages[pageIndex];
            if (page) {
              const inPage = titleOffset(page.text, title);
              // Le signet localise au moins la page. Quand son titre est dans le
              // texte, on affine jusqu'au caractère exact du début du chapitre.
              chapters.push({ title, offset: pageOffsets[pageIndex] + Math.max(0, inPage) });
              added = true;
            }
          }
        } catch {
          // Un signet brisé ne doit pas empêcher l'import du texte du document.
        }
      }
      if (!added && node.items?.length) await visit(node.items);
    }
  }
  await visit(outlineLevel(outline));
  return chapters;
}

function uniqueChapters(chapters, textLength) {
  const offsets = new Set();
  return chapters.filter((chapter) => Number.isInteger(chapter.offset) && chapter.offset >= 0 && chapter.offset < textLength)
    .sort((a, b) => a.offset - b.offset)
    .filter((chapter) => {
      if (offsets.has(chapter.offset)) return false;
      offsets.add(chapter.offset);
      return true;
    });
}

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("./pdf-worker.js", import.meta.url).href;
  return pdfjs;
}

export async function extractPdfDocument(file, { signal } = {}) {
  if (file.size > MAX_FILE_BYTES) throw tooLarge("fichier trop lourd");
  library ??= loadPdfJs().catch((err) => { library = null; throw err; });
  const pdfjs = await library;
  throwIfAborted(signal);
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
  // Un nouvel import ou EFFACE arrête vraiment l'extraction en cours.
  const abort = () => { task.destroy(); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const document = await task.promise;
    const pages = [], headings = [];
    let total = 0, truncated = document.numPages > MAX_PAGES;
    for (let n = 1; n <= Math.min(document.numPages, MAX_PAGES); n++) {
      throwIfAborted(signal);
      const page = await document.getPage(n);
      const content = await page.getTextContent();
      // hasEOL indique une ligne de mise en page, souvent au milieu d'une phrase.
      // Les phrases restent continues ; seuls les titres et le changement de page ajoutent un saut.
      // Des morceaux contigus peuvent être les glyphes d'un même mot (ex. ligature fi).
      let text = normalizeText(pageTextWithHeadings(content.items, headings));
      page.cleanup();
      if (total + text.length > MAX_TEXT_CHARS) { text = text.slice(0, MAX_TEXT_CHARS - total); truncated = true; }
      pages.push({ text, lines: pageLines(content.items) });
      total += text.length + 1;
      if (truncated && total >= MAX_TEXT_CHARS) break;
    }
    const joined = pages.map((page) => page.text).join("\n");
    const text = joined.trim();
    const leading = joined.length - joined.trimStart().length;
    let cursor = 0;
    const pageOffsets = pages.map((page) => {
      const offset = Math.max(0, Math.min(text.length, cursor - leading));
      cursor += page.text.length + 1;
      return offset;
    });
    const outline = await outlineChapters(document, pages, pageOffsets);
    const chapters = uniqueChapters(outline.length ? outline : detectedChapters(pages, pageOffsets), text.length);
    return { text, chapters, pageOffsets, titles: headings.map((heading) => normalizeText(heading)), truncated };
  } catch (error) {
    throwIfAborted(signal);
    throw error;
  } finally {
    signal?.removeEventListener("abort", abort);
    await task.destroy();
  }
}

export async function extractPdfText(file) {
  return (await extractPdfDocument(file)).text;
}
