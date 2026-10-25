import { normalizeText } from "./text.js";

let library;
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
      pages.push(content.items.filter((item) => typeof item.str === "string")
        .map((item) => item.str + (item.hasEOL ? "\n" : " ")).join(""));
      page.cleanup();
    }
    return normalizeText(pages.join("\n"));
  } finally {
    await task.destroy();
  }
}
