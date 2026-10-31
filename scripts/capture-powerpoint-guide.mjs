// Capture réelle du guide « PowerPoint en MP3 » : un diaporama original de 6 diapos, importé dans la radio.
// Ne lit aucun document utilisateur ; nécessite npm run build et Chrome.
// Le diaporama est un .pptx minimal (texte seulement), suffisant pour la radio mais pas destiné à être téléchargé.
import { mkdtemp, writeFile } from "node:fs/promises";
import { deflateRawSync } from "node:zlib";
import os from "node:os";
import path from "node:path";
import { startServer, launch, ROOT } from "../tests/e2e/harness.mjs";

function zip(files) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = Buffer.from(name), data = deflateRawSync(Buffer.from(content)), raw = Buffer.byteLength(content);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw, 22); local.writeUInt16LE(nameBytes.length, 26);
    const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(8, 10);
    central.writeUInt32LE(data.length, 20); central.writeUInt32LE(raw, 24); central.writeUInt16LE(nameBytes.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, nameBytes, data); centrals.push(central, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const shape = (type, ...paragraphs) => `<p:sp><p:nvSpPr><p:nvPr>${type ? `<p:ph type="${type}"/>` : ""}</p:nvPr></p:nvSpPr><p:txBody>${paragraphs.map((t) => `<a:p><a:r><a:t>${t}</a:t></a:r></a:p>`).join("")}</p:txBody></p:sp>`;
const slide = (body, show = "") => `<?xml version="1.0"?><p:sld ${NS}${show}><p:cSld><p:spTree>${body}</p:spTree></p:cSld></p:sld>`;
const table = (...rows) => `<p:graphicFrame><a:graphic><a:graphicData><a:tbl>${rows.map((cells) => `<a:tr>${cells.map((c) => `<a:tc><a:txBody><a:p><a:r><a:t>${c}</a:t></a:r></a:p></a:txBody></a:tc>`).join("")}</a:tr>`).join("")}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
// Pied tapé dans une zone de texte (pas un pied de page PowerPoint) : c'est lui que NETTOYER propose de retirer.
const footer = shape("", "Institut d’exemple — Biologie cellulaire — 2026-2027");
const number = (n) => shape("sldNum", String(n));
const slides = [
  slide(shape("ctrTitle", "La photosynthèse : de la lumière au glucose") + shape("subTitle", "Cours 3 — Biologie cellulaire") + number(1) + footer),
  slide(shape("title", "Trois définitions à retenir") + shape("body", "La photosynthèse transforme l’énergie lumineuse en énergie chimique.", "Le chloroplaste est l’organite où elle se déroule.", "La chlorophylle est le pigment vert qui capte la lumière.") + number(2) + footer),
  slide(shape("title", "Ce qui entre, ce qui sort") + number(3) + footer + table(["Entrées", "Sorties"], ["Eau et dioxyde de carbone", "Glucose et dioxygène"], ["Énergie lumineuse", "Énergie chimique"])),
  slide(shape("title", "Diapo masquée") + shape("body", "Cette diapo est masquée : la radio ne la lit pas."), ' show="0"'),
  slide(shape("title", "Deux erreurs fréquentes") + shape("body", "La photosynthèse n’a pas besoin de soleil direct : elle a besoin de lumière.", "Le dioxygène rejeté vient de l’eau, pas du dioxyde de carbone.") + number(5) + footer),
  slide(shape("title", "À vérifier avant l’examen") + shape("body", "Où se trouve la chlorophylle dans la cellule ?", "Quelles molécules entrent dans le chloroplaste ?") + number(6) + footer),
];
const deck = path.join(await mkdtemp(path.join(os.tmpdir(), "guide-pptx-")), "photosynthese.pptx");
await writeFile(deck, zip({
  "ppt/presentation.xml": `<p:presentation ${NS}><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join("")}</p:sldIdLst></p:presentation>`,
  "ppt/_rels/presentation.xml.rels": `<Relationships>${slides.map((_, i) => `<Relationship Id="rId${i + 1}" Target="slides/slide${i + 1}.xml"/>`).join("")}</Relationships>`,
  ...Object.fromEntries(slides.map((body, i) => [`ppt/slides/slide${i + 1}.xml`, body])),
  "ppt/notesSlides/notesSlide1.xml": slide(shape("body", "Note du présentateur : insister sur la différence entre les deux énergies.")),
}));

const server = await startServer();
const { browser, page } = await launch({ profile: "tests/e2e/.chrome-profile/powerpoint-guide", viewport: { width: 1100, height: 850 }, reducedMotion: true });
try {
  await page.goto(server.url, { waitUntil: "networkidle0" });
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await (await page.$("#pdf-input")).uploadFile(deck);
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("examen"), { timeout: 30000 });
  const chapters = () => page.$$eval("#chapter option", (options) => options.map((o) => o.textContent));
  const imported = { chapters: await chapters(), cleanup: !(await page.$eval("#cleanup-open", (el) => el.hidden)), pages: !(await page.$eval("#pages-open", (el) => el.hidden)) };
  await page.click("#cleanup-open");
  await page.waitForSelector('#cleanup-open[aria-pressed="true"]');
  const cleaned = await page.$eval("#screen", (el) => el.value);
  await page.evaluate(() => { window.scrollTo(0, 0); return document.fonts.ready; });
  await page.screenshot({ path: ROOT + "/assets/guides/radio-powerpoint.jpg", type: "jpeg", quality: 86 });
  // Corriger le texte dans RELIRE LE TEXTE : les chapitres par diapo sont-ils gardés ?
  await page.click("#course-tools-toggle");
  await page.click("#review-open");
  await page.waitForSelector("#review-dialog[open]:not([data-entering])", { timeout: 30000 });
  await page.$eval("#review-text", (el) => { el.value = el.value.replace("Deux erreurs", "Deux erreurs très"); el.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.click("#review-apply");
  await page.waitForFunction(() => !document.querySelector("#review-dialog").open);
  console.log(JSON.stringify({ imported, cleaned, notesRead: cleaned.includes("présentateur"), hiddenRead: cleaned.includes("masquée"), afterEdit: { chapters: await chapters(), cleanup: !(await page.$eval("#cleanup-open", (el) => el.hidden)) } }, null, 1));
} finally { await browser.close(); await server.close(); }
