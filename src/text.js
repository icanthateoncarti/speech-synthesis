import { spokenWords } from "./spoken.js";

const SPEAKABLE = /[\p{L}\p{N}]/u;

export function normalizeText(raw) {
  return String(raw)
    .replace(/\r\n?/g, "\n")
    .replace(/[^\P{Cc}\n\t]/gu, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

export function hasSpeakableContent(text) {
  return SPEAKABLE.test(text);
}

function splitSentences(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const parts = line.match(/.*?(?:[.!?…]+["'»)\]]*(?=\s|$)|$)/gu) ?? [];
    for (const p of parts) {
      const s = p.trim();
      if (s) out.push(s);
    }
  }
  return out;
}

function splitLong(sentence, maxChars) {
  if (sentence.length <= maxChars) return [sentence];
  const pieces = sentence.match(/[^,;:]+[,;:]*/g) ?? [sentence];
  const out = [];
  let cur = "";
  const push = (s) => { if (s) out.push(s); };
  for (const piece of pieces) {
    if (piece.length > maxChars) {
      push(cur.trim()); cur = "";
      let line = "";
      for (const word of piece.split(/\s+/).filter(Boolean)) {
        if (word.length > maxChars) {
          push(line); line = "";
          for (let i = 0; i < word.length; i += maxChars) push(word.slice(i, i + maxChars));
        } else if (line && line.length + 1 + word.length > maxChars) {
          push(line); line = word;
        } else {
          line = line ? line + " " + word : word;
        }
      }
      push(line);
    } else if (cur && cur.length + piece.length > maxChars) {
      push(cur.trim()); cur = piece;
    } else {
      cur += piece;
    }
  }
  push(cur.trim());
  return out;
}

const TITLE_END = /[.!?…;:,]$/u;
const BULLET = /^(?:[-–—•*·▪◦]|\d+[.)])\s/u;

// Une ligne courte, seule, sans ponctuation finale : un titre
// (« Cours 6 — Du besoin métier au graphique », « Le fil rouge du cours »).
export function isTitleLine(line) {
  const t = line.trim();
  return t.length >= 3 && t.length <= 120 && SPEAKABLE.test(t) && !TITLE_END.test(t)
    && !BULLET.test(t) && t.split(/\s+/).length <= 15;
}

export function splitIntoParts(text, maxChars = 400) {
  const parts = [];
  for (const line of normalizeText(text).split("\n")) {
    const title = isTitleLine(line);
    for (const sentence of splitSentences(line)) {
      for (const c of splitLong(sentence, maxChars)) {
        const t = c.trim();
        if (t && hasSpeakableContent(t)) parts.push({ text: t, title });
      }
    }
  }
  return parts;
}

export function splitIntoChunks(text, maxChars = 400) {
  return splitIntoParts(text, maxChars).map((part) => part.text);
}

// Silence avant et après chaque titre ; deux titres qui se suivent ne cumulent
// pas leurs pauses, et ni le début ni la fin du texte n'en reçoivent.
export function titlePauses(parts, seconds = 1) {
  return parts.map((part, i) => ({
    before: part.title && i > 0 && !parts[i - 1].title ? seconds : 0,
    after: part.title && i < parts.length - 1 && !parts[i + 1].title ? seconds : 0,
  }));
}

export function clampSpeed(x) {
  return Math.round(Math.min(1.5, Math.max(0.7, x)) * 10) / 10;
}

export function speedToLengthScale(speed) {
  return Math.round(100 / clampSpeed(speed)) / 100;
}

export function wordTimeline(chunks, durations) {
  const out = [];
  let t = 0;
  chunks.forEach((chunk, i) => {
    const words = chunk.split(/\s+/).filter(Boolean);
    // Chaque mot affiché dure le temps de sa forme parlée (« → » = « flèche vers la droite »).
    const weights = spokenWords(words).map((w) => w.match(/[\p{L}\p{N}]/gu)?.length || 0.1);
    const total = weights.reduce((n, w) => n + w, 0) || 1;
    const dur = durations[i] ?? 0;
    let cursor = t;
    for (const [k, word] of words.entries()) {
      const end = cursor + (dur * weights[k]) / total;
      out.push({ word, start: cursor, end });
      cursor = end;
    }
    t += dur;
  });
  return out;
}
