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

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("./pdf-worker.js", import.meta.url).href;
  return pdfjs;
}

export async function extractPdfText(file) {
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
      pages.push(pageText(content.items));
      page.cleanup();
    }
    return normalizeText(pages.join("\n"));
  } finally {
    await task.destroy();
  }
}
