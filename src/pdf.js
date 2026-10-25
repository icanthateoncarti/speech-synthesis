import { normalizeText } from "./text.js";

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

export async function extractPdfDocument(file) {
  library ??= loadPdfJs().catch((err) => { library = null; throw err; });
  const pdfjs = await library;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
  try {
    const document = await task.promise;
    const pages = [];
    for (let n = 1; n <= document.numPages; n++) {
      const page = await document.getPage(n);
      const content = await page.getTextContent();
      // hasEOL indique une ligne de mise en page, souvent au milieu d'une phrase.
      // Les phrases restent continues ; seul le changement de page ajoute un saut.
      // Des morceaux contigus peuvent être les glyphes d'un même mot (ex. ligature fi).
      pages.push({ text: normalizeText(pageText(content.items)), lines: pageLines(content.items) });
      page.cleanup();
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
    return { text, chapters, pageOffsets };
  } finally {
    await task.destroy();
  }
}

export async function extractPdfText(file) {
  return (await extractPdfDocument(file)).text;
}
