import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { startServer, launch } from "./harness.mjs";

let server, browser, page, fixtures;

// Deux pages et un plan imbriqué : une destination nommée et une référence de page.
function outlinedPdf() {
  const first = "BT /F1 18 Tf 50 780 Td (Opening section) Tj 0 -36 Td (A first paragraph.) Tj ET";
  const second = "BT /F1 18 Tf 50 780 Td (Closing section) Tj 0 -36 Td (The final paragraph.) Tj ET";
  const stream = (value) => `<< /Length ${Buffer.byteLength(value)} >>\nstream\n${value}\nendstream`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R /Outlines 7 0 R /Names << /Dests << /Names [(opening) [3 0 R /Fit]] >> >> >>",
    "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 10 0 R >> >> /Contents 4 0 R >>",
    stream(first),
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 10 0 R >> >> /Contents 6 0 R >>",
    stream(second),
    "<< /Type /Outlines /First 8 0 R /Last 8 0 R /Count 3 >>",
    "<< /Title (Book title) /Parent 7 0 R /Dest [3 0 R /Fit] /First 9 0 R /Last 11 0 R /Count 2 >>",
    "<< /Title (Opening section) /Parent 8 0 R /Dest (opening) /Next 11 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Title (Closing section) /Parent 8 0 R /Dest [5 0 R /Fit] /Prev 9 0 R >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

before(async () => {
  server = await startServer();
  fixtures = await mkdtemp(path.join(os.tmpdir(), "speech-pdf-chapters-"));
  ({ browser, page } = await launch({ profile: path.join(fixtures, "chrome"), reducedMotion: true }));
  await writeFile(path.join(fixtures, "outline.pdf"), outlinedPdf());
  const generator = await browser.newPage();
  await generator.setContent("<h1>Chapitre 1 — La donnée</h1><p>La donnée devient une information utile.</p><h1 style='break-before:page'>Chapitre 2 — La décision</h1><p>La décision suit une analyse.</p>");
  await generator.pdf({ path: path.join(fixtures, "headings.pdf"), outline: false });
  await generator.setContent("<h1>Sommaire</h1><p>Chapitre 1 — La donnée ........ 2</p><p>Chapitre 2 — La décision ........ 4</p><h1 style='break-before:page'>Chapitre 1 — La donnée</h1><p>Le début réel du chapitre.</p><h1 style='break-before:page'>Chapitre 1 — La donnée</h1><p>Une page suivante avec un en-tête répété.</p><h1 style='break-before:page'>Chapitre 2 — La décision</h1><p>Le chapitre suivant.</p>");
  await generator.pdf({ path: path.join(fixtures, "contents.pdf"), outline: false });
  await generator.setContent("<p style='width:120px'>Une phrase continue avec des coupures artificielles dues à la mise en page.</p>");
  await generator.pdf({ path: path.join(fixtures, "plain.pdf"), outline: false });
  await generator.close();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().endsWith("/tests/e2e/pdf-document.html")) {
      request.respond({ status: 200, contentType: "text/html", body: '<!doctype html><script type="importmap">{"imports":{"pdfjs-dist":"https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.min.mjs"}}</script>' });
    } else request.continue();
  });
  await page.goto(`${server.url}/tests/e2e/pdf-document.html`);
});

after(async () => { await browser?.close(); await server?.close(); });

async function extract(name) {
  const bytes = [...await readFile(path.join(fixtures, name))];
  return page.evaluate(async ({ bytes, name }) => {
    const { extractPdfDocument, extractPdfText } = await import("/src/pdf.js");
    const file = new File([new Uint8Array(bytes)], name, { type: "application/pdf" });
    const result = await extractPdfDocument(file);
    return { ...result, compatibilityText: await extractPdfText(file) };
  }, { bytes, name });
}

test("le plan PDF fournit des chapitres avec destinations nommées et pages exactes", { timeout: 90_000 }, async () => {
  const result = await extract("outline.pdf");
  assert.equal(result.compatibilityText, result.text);
  assert.deepEqual(result.chapters, [
    { title: "Opening section", offset: result.text.indexOf("Opening section") },
    { title: "Closing section", offset: result.text.indexOf("Closing section") },
  ]);
  assert.deepEqual(result.pageOffsets, [0, result.text.indexOf("Closing section")]);
});

test("sans plan PDF, les titres Chapitre en début de ligne sont reconnus", { timeout: 90_000 }, async () => {
  const result = await extract("headings.pdf");
  assert.equal(result.chapters.length, 2);
  for (const [index, chapter] of result.chapters.entries()) {
    assert.match(chapter.title, new RegExp(`^Chapitre ${index + 1}`));
    assert.equal(result.text.slice(chapter.offset, chapter.offset + chapter.title.length), chapter.title);
  }
  assert.equal(result.pageOffsets.length, 2);
});

test("un PDF sans chapitre reste sans chapitre et conserve mots et phrases", { timeout: 90_000 }, async () => {
  const result = await extract("plain.pdf");
  assert.equal(result.text, "Une phrase continue avec des coupures artificielles dues à la mise en page.");
  assert.equal(result.compatibilityText, result.text);
  assert.deepEqual(result.chapters, []);
  assert.deepEqual(result.pageOffsets, [0]);
});

test("le sommaire et les en-têtes répétés ne deviennent pas des chapitres supplémentaires", { timeout: 90_000 }, async () => {
  const result = await extract("contents.pdf");
  assert.equal(result.chapters.length, 2);
  assert.equal(result.pageOffsets.length, 4);
  assert.equal(result.chapters[0].offset, result.pageOffsets[1]);
  assert.equal(result.chapters[1].offset, result.pageOffsets[3]);
});
