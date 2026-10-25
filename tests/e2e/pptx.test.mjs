import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { deflateRawSync } from "node:zlib";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "./harness.mjs";

// ZIP minimal (méthode 8, CRC à zéro : non vérifié par le lecteur du site).
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
const shape = (type, ...paragraphs) => `<p:sp><p:nvSpPr><p:nvPr>${type ? `<p:ph type="${type}"/>` : ""}</p:nvPr></p:nvSpPr><p:txBody>${paragraphs.map((p) => `<a:p>${p.map((t) => `<a:r><a:t>${t}</a:t></a:r>`).join("")}</a:p>`).join("")}</p:txBody></p:sp>`;
const slide = (body, show = "") => `<?xml version="1.0"?><p:sld ${NS}${show}><p:cSld><p:spTree>${body}</p:spTree></p:cSld></p:sld>`;
const table = (...rows) => `<p:graphicFrame><a:graphic><a:graphicData><a:tbl>${rows.map((cells) => `<a:tr>${cells.map((c) => `<a:tc><a:txBody><a:p><a:r><a:t>${c}</a:t></a:r></a:p></a:txBody></a:tc>`).join("")}</a:tr>`).join("")}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;

let server, browser, page, fixtures;
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  fixtures = await mkdtemp(path.join(os.tmpdir(), "speech-pptx-"));
  await writeFile(path.join(fixtures, "cours.pptx"), zip({
    "ppt/presentation.xml": `<p:presentation ${NS}><p:sldIdLst><p:sldId id="256" r:id="rId3"/><p:sldId id="257" r:id="rId2"/><p:sldId id="258" r:id="rId4"/></p:sldIdLst></p:presentation>`,
    "ppt/_rels/presentation.xml.rels": `<Relationships><Relationship Id="rId2" Target="slides/slide1.xml"/><Relationship Id="rId3" Target="slides/slide2.xml"/><Relationship Id="rId4" Target="slides/slide3.xml"/></Relationships>`,
    // Ordre de la présentation : slide2, slide1, slide3 (masquée).
    "ppt/slides/slide2.xml": slide(shape("ctrTitle", ["Le fil rouge"]) + shape("body", ["Transformer la donnée ", "en décision"], ["Chaque séance compte."]) + shape("sldNum", ["1"])),
    "ppt/slides/slide1.xml": slide(shape("title", ["Ergonomie ou design ?"]) + table(["Critère", "Ergonomie"], ["Objectif", "Efficacité"])),
    "ppt/slides/slide3.xml": slide(shape("title", ["Diapo cachée"]), ' show="0"'),
  }));
  await writeFile(path.join(fixtures, "protege.pptx"), Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0, 0, 0]));
  await writeFile(path.join(fixtures, "ancien.ppt"), "binaire");
});
after(async () => { await browser?.close(); await server?.close(); });

async function open() {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
}
const status = () => page.$eval("#status-left", (el) => el.textContent);

test("PPTX : diapos dans l'ordre, titres sur leur ligne, puces et tableaux, diapo masquée ignorée", { timeout: 60_000 }, async () => {
  await open();
  await (await page.$("#pdf-input")).uploadFile(path.join(fixtures, "cours.pptx"));
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("Efficacité"), { timeout: 30_000 });
  assert.equal(await page.$eval("#screen", (el) => el.value), [
    "Le fil rouge",
    "• Transformer la donnée en décision",
    "Chaque séance compte.",
    "Ergonomie ou design ?",
    "• Critère ; Ergonomie",
    "• Objectif ; Efficacité",
  ].join("\n"));
  assert.deepEqual(await page.$$eval("#chapter option", (o) => o.map((x) => x.textContent)), ["1 · Le fil rouge", "2 · Ergonomie ou design ?"]);
});

test("PPTX protégé, ancien .ppt : messages clairs, texte conservé", { timeout: 60_000 }, async () => {
  await open();
  await page.$eval("#screen", (el) => { el.value = "Gardé."; el.dispatchEvent(new Event("input")); });
  await (await page.$("#pdf-input")).uploadFile(path.join(fixtures, "protege.pptx"));
  await page.waitForFunction(() => /PPTX/.test(document.querySelector("#status-left").textContent), { timeout: 30_000 });
  assert.equal(await status(), "PPTX PROTÉGÉ · DÉVERROUILLE-LE");
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.items.add(new File(["x"], "ancien.ppt"));
    document.body.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  assert.equal(await status(), "ENREGISTRE-LE EN .PPTX");
});

test("les titres de diapo reçoivent la pause, même avec un « ? »", { timeout: 120_000 }, async () => {
  const pauses = await page.evaluate(async () => {
    const { createTts } = await import("/src/tts.js");
    const result = await createTts().synthesize({ text: "Intro.\nErgonomie ou design ?\nSuite.", voice: "jessica", speed: 1, titles: ["Ergonomie ou design ?"] });
    return result.pauses;
  });
  assert.deepEqual(pauses, [{ before: 0, after: 0 }, { before: 1, after: 1 }, { before: 0, after: 0 }]);
});
