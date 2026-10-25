// Lecture locale d'une présentation PowerPoint (.pptx) : une archive ZIP de XML.
// Le navigateur décompresse lui-même (DecompressionStream) ; rien n'est envoyé.
import { normalizeText } from "./text.js";

const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0];
const TITLE_TYPES = new Set(["title", "ctrTitle"]);
// Numéro de diapo, date, pied de page : du décor, pas du contenu à lire.
const SKIPPED_TYPES = new Set(["sldNum", "dt", "ftr", "hdr"]);
const SENTENCE_END = /[.!?…:;]$/u;

function pptxError(name, message) {
  return Object.assign(new Error(message), { name });
}

function zipEntries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw pptxError("InvalidPptx", "archive ZIP introuvable");
  const entries = new Map();
  const decoder = new TextDecoder();
  let pos = view.getUint32(end + 16, true);
  for (let n = view.getUint16(end + 10, true); n > 0; n--) {
    if (pos + 46 > bytes.length || view.getUint32(pos, true) !== 0x02014b50) throw pptxError("InvalidPptx", "répertoire ZIP abîmé");
    const nameLength = view.getUint16(pos + 28, true);
    entries.set(decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLength)), {
      method: view.getUint16(pos + 10, true),
      size: view.getUint32(pos + 20, true),
      local: view.getUint32(pos + 42, true),
    });
    pos += 46 + nameLength + view.getUint16(pos + 30, true) + view.getUint16(pos + 32, true);
  }
  return entries;
}

async function readEntry(bytes, entries, name) {
  const entry = entries.get(name);
  if (!entry) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const start = entry.local + 30 + view.getUint16(entry.local + 26, true) + view.getUint16(entry.local + 28, true);
  const data = bytes.subarray(start, start + entry.size);
  if (entry.method === 0) return new TextDecoder().decode(data);
  if (entry.method !== 8) throw pptxError("InvalidPptx", `compression ${entry.method} non prise en charge`);
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

const xml = (text) => new DOMParser().parseFromString(text, "application/xml");
const paragraphText = (p) => normalizeText([...p.getElementsByTagName("a:t")].map((t) => t.textContent).join(""));

function slideLines(doc) {
  const titles = [], lines = [];
  for (const shape of doc.getElementsByTagName("p:sp")) {
    const type = shape.getElementsByTagName("p:ph")[0]?.getAttribute("type");
    if (SKIPPED_TYPES.has(type)) continue;
    const paragraphs = [...shape.getElementsByTagName("a:p")].map(paragraphText).filter(Boolean);
    if (TITLE_TYPES.has(type)) titles.push(...paragraphs);
    // Une puce n'a souvent pas de point final : le « • » évite qu'on la prenne
    // pour un titre (et qu'elle reçoive les pauses des titres).
    else lines.push(...paragraphs.map((text) => SENTENCE_END.test(text) ? text : `• ${text}`));
  }
  for (const row of doc.getElementsByTagName("a:tr")) {
    const cells = [...row.getElementsByTagName("a:tc")].map((cell) => [...cell.getElementsByTagName("a:p")].map(paragraphText).filter(Boolean).join(" ")).filter(Boolean);
    if (cells.length) lines.push(`• ${cells.join(" ; ")}`);
  }
  return { title: titles.join(" "), lines };
}

async function slideOrder(bytes, entries) {
  const presentation = await readEntry(bytes, entries, "ppt/presentation.xml");
  const rels = await readEntry(bytes, entries, "ppt/_rels/presentation.xml.rels");
  if (!presentation || !rels) throw pptxError("InvalidPptx", "présentation introuvable");
  const targets = new Map([...xml(rels).getElementsByTagName("Relationship")].map((rel) => [rel.getAttribute("Id"), rel.getAttribute("Target")]));
  return [...xml(presentation).getElementsByTagName("p:sldId")].map((slide) => {
    const target = targets.get(slide.getAttribute("r:id")) ?? "";
    return target.startsWith("/") ? target.slice(1) : `ppt/${target.replace(/^\.\//, "")}`;
  });
}

/** { text, chapters, titles } : un chapitre par diapo, son titre sur sa propre ligne. */
export async function extractPptxDocument(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (OLE_MAGIC.every((value, i) => bytes[i] === value)) throw pptxError("PasswordException", "présentation protégée par mot de passe");
  const entries = zipEntries(bytes);
  const lines = [], chapters = [], titles = [];
  let offset = 0, number = 0;
  for (const path of await slideOrder(bytes, entries)) {
    const source = await readEntry(bytes, entries, path);
    if (!source) continue;
    const doc = xml(source);
    number++;
    if (doc.documentElement.getAttribute("show") === "0") continue;
    const slide = slideLines(doc);
    if (!slide.title && !slide.lines.length) continue;
    chapters.push({ title: `${number} · ${slide.title || `Diapo ${number}`}`, offset });
    if (slide.title) titles.push(slide.title);
    for (const line of slide.title ? [slide.title, ...slide.lines] : slide.lines) {
      lines.push(line);
      offset += line.length + 1;
    }
  }
  return { text: lines.join("\n"), chapters, titles };
}
