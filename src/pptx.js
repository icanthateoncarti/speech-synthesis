// Lecture locale d'une présentation PowerPoint (.pptx) : une archive ZIP de XML.
// Le navigateur décompresse lui-même (DecompressionStream) ; rien n'est envoyé.
import { normalizeText } from "./text.js";
import { MAX_FILE_BYTES, MAX_PAGES, MAX_TEXT_CHARS, MAX_XML_ENTRY_BYTES, MAX_XML_TOTAL_BYTES, MAX_ZIP_ENTRIES, throwIfAborted, tooLarge } from "./limits.js";

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
  const count = view.getUint16(end + 10, true);
  if (count > MAX_ZIP_ENTRIES) throw tooLarge("trop de fichiers dans l'archive");
  const entries = new Map();
  const decoder = new TextDecoder();
  let pos = view.getUint32(end + 16, true);
  for (let n = count; n > 0; n--) {
    if (pos + 46 > end || view.getUint32(pos, true) !== 0x02014b50) throw pptxError("InvalidPptx", "répertoire ZIP abîmé");
    const nameLength = view.getUint16(pos + 28, true);
    const next = pos + 46 + nameLength + view.getUint16(pos + 30, true) + view.getUint16(pos + 32, true);
    const entry = { method: view.getUint16(pos + 10, true), size: view.getUint32(pos + 20, true), local: view.getUint32(pos + 42, true) };
    // Chaque bloc doit tenir dans le fichier : pas de lecture hors limites.
    if (next > end || entry.local + 30 > bytes.length || view.getUint32(entry.local, true) !== 0x04034b50) throw pptxError("InvalidPptx", "entrée ZIP abîmée");
    entries.set(decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLength)), entry);
    pos = next;
  }
  return entries;
}

async function readEntry(bytes, entries, name, budget) {
  const entry = entries.get(name);
  if (!entry) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const start = entry.local + 30 + view.getUint16(entry.local + 26, true) + view.getUint16(entry.local + 28, true);
  if (start + entry.size > bytes.length) throw pptxError("InvalidPptx", "entrée ZIP tronquée");
  const data = bytes.subarray(start, start + entry.size);
  if (entry.method === 0) {
    budget.spend(data.length);
    return new TextDecoder().decode(data);
  }
  if (entry.method !== 8) throw pptxError("InvalidPptx", `compression ${entry.method} non prise en charge`);
  // Décompression comptée au fil de l'eau : on s'arrête dès que le plafond est
  // atteint, quelle que soit la taille annoncée (un PPTX de 5 Ko peut en cacher des Go).
  const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const decoder = new TextDecoder();
  let text = "", size = 0;
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      size += chunk.value.length;
      if (size > MAX_XML_ENTRY_BYTES) throw tooLarge(`${name} : décompression trop volumineuse`);
      budget.spend(chunk.value.length);
      text += decoder.decode(chunk.value, { stream: true });
    }
  } catch (error) {
    reader.cancel().catch(() => {});
    if (error.name === "TooLargeError") throw error;
    throw pptxError("InvalidPptx", "données compressées illisibles");
  }
  return text + decoder.decode();
}

function decompressionBudget() {
  let total = 0;
  return { spend(bytes) { total += bytes; if (total > MAX_XML_TOTAL_BYTES) throw tooLarge("décompression totale trop volumineuse"); } };
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

async function slideOrder(bytes, entries, budget) {
  const presentation = await readEntry(bytes, entries, "ppt/presentation.xml", budget);
  const rels = await readEntry(bytes, entries, "ppt/_rels/presentation.xml.rels", budget);
  if (!presentation || !rels) throw pptxError("InvalidPptx", "présentation introuvable");
  const targets = new Map([...xml(rels).getElementsByTagName("Relationship")].map((rel) => [rel.getAttribute("Id"), rel.getAttribute("Target")]));
  return [...xml(presentation).getElementsByTagName("p:sldId")].map((slide) => {
    const target = targets.get(slide.getAttribute("r:id")) ?? "";
    return target.startsWith("/") ? target.slice(1) : `ppt/${target.replace(/^\.\//, "")}`;
  });
}

/** { text, chapters, titles, truncated } : un chapitre par diapo, son titre sur sa propre ligne. */
export async function extractPptxDocument(file, { signal } = {}) {
  if (file.size > MAX_FILE_BYTES) throw tooLarge("fichier trop lourd");
  const bytes = new Uint8Array(await file.arrayBuffer());
  throwIfAborted(signal);
  if (OLE_MAGIC.every((value, i) => bytes[i] === value)) throw pptxError("PasswordException", "présentation protégée par mot de passe");
  const entries = zipEntries(bytes);
  const budget = decompressionBudget();
  const lines = [], chapters = [], titles = [];
  let offset = 0, number = 0, truncated = false;
  const order = await slideOrder(bytes, entries, budget);
  if (order.length > MAX_PAGES) { order.length = MAX_PAGES; truncated = true; }
  for (const path of order) {
    throwIfAborted(signal);
    // Texte plafonné : on garde les diapos entières jusqu'au budget, puis on signale la coupure.
    if (offset >= MAX_TEXT_CHARS) { truncated = true; break; }
    const source = await readEntry(bytes, entries, path, budget);
    if (!source) continue;
    const doc = xml(source);
    number++;
    if (doc.documentElement.getAttribute("show") === "0") continue;
    const slide = slideLines(doc);
    if (!slide.title && !slide.lines.length) continue;
    chapters.push({ title: `${number} · ${slide.title || `Diapo ${number}`}`, offset });
    if (slide.title) titles.push(slide.title);
    for (const line of slide.title ? [slide.title, ...slide.lines] : slide.lines) {
      if (offset + line.length > MAX_TEXT_CHARS) {
        lines.push(line.slice(0, MAX_TEXT_CHARS - offset));
        offset = MAX_TEXT_CHARS; truncated = true;
        break;
      }
      lines.push(line);
      offset += line.length + 1;
    }
  }
  return { text: lines.join("\n"), chapters, titles, truncated };
}
