import { normalizeText, hasSpeakableContent, splitIntoChunks } from "./text.js";

const GAP_SECONDS = 0.15;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function locateChunk(chunks, offset) {
  if (!chunks.length) return null;
  let lo = 0, hi = chunks.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (chunks[mid].end > offset) hi = mid;
    else lo = mid + 1;
  }
  return chunks[lo];
}

function entryAt(entries, offset) {
  let lo = 0, hi = entries.length - 1, found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (entries[mid].start <= offset) { found = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return found;
}

function sentenceRanges(text) {
  if (typeof Intl.Segmenter === "function") {
    return [...new Intl.Segmenter("fr", { granularity: "sentence" }).segment(text)]
      .filter(({ segment }) => hasSpeakableContent(segment))
      .map(({ segment, index }) => ({
        text: segment.trim(),
        start: index + segment.length - segment.trimStart().length,
        end: index + segment.trimEnd().length,
      }));
  }
  const ranges = [];
  for (const line of text.matchAll(/[^\n]+/gu)) {
    for (const match of line[0].matchAll(/.*?(?:[.!?…]+["'»)\]]*(?=\s|$)|$)/gu)) {
      if (!hasSpeakableContent(match[0])) continue;
      const value = match[0];
      const start = line.index + match.index;
      ranges.push({ text: value.trim(), start: start + value.length - value.trimStart().length, end: start + value.trimEnd().length });
    }
  }
  return ranges;
}

function detectChapters(text) {
  const chapters = [];
  for (const match of text.matchAll(/\b(?:chapitre|partie|cours|module|section)\s+(?:\d+(?:\.\d+)*|[ivxlcdm]+)\b/giu)) {
    const before = text.slice(Math.max(0, match.index - 100), match.index);
    const after = text.slice(match.index + match[0].length);
    const atLineStart = !before.slice(before.lastIndexOf("\n") + 1).trim();
    const afterSentence = /[.!?…]\s*$/.test(before);
    const titled = /^\s*[:–—-]\s+\p{L}/u.test(after) && match[0][0] === match[0][0].toUpperCase();
    if (!atLineStart && !afterSentence && !titled) continue;
    const lineEnd = text.indexOf("\n", match.index);
    const end = lineEnd < 0 ? text.length : lineEnd;
    const title = end - match.index <= 120 ? text.slice(match.index, end).trim() : match[0];
    chapters.push({ title, offset: match.index });
  }
  for (const match of text.matchAll(/^(?:Introduction|Conclusion|Pr[ée]face|Avant-propos)\s*$/gmi)) {
    chapters.push({ title: match[0].trim(), offset: match.index });
  }
  return chapters;
}

// Tous les offsets sont exprimés dans le texte normalisé utilisé par la synthèse.
// Les métadonnées PDF peuvent fournir des chapitres {title, offset} plus précis.
export function buildReadingIndex(rawText, rawChunks, providedChapters = []) {
  const text = normalizeText(rawText);
  const values = rawChunks ?? splitIntoChunks(text);
  let cursor = 0;
  const chunks = values.map((value, index) => {
    const chunk = normalizeText(value);
    const found = text.indexOf(chunk, cursor);
    const start = found < 0 ? cursor : found;
    const end = Math.min(text.length, start + chunk.length);
    cursor = end;
    return { index, text: chunk, start, end };
  });
  const locate = (entry, index) => {
    const chunk = locateChunk(chunks, entry.start);
    return { ...entry, index, chunkIndex: chunk?.index ?? null,
      chunkOffset: chunk ? clamp(entry.start - chunk.start, 0, chunk.end - chunk.start) : 0 };
  };
  const sentences = sentenceRanges(text).map(locate);
  const supplied = providedChapters.filter((entry) => entry && String(entry.title ?? "").trim()
    && Number.isFinite(Number(entry.offset ?? entry.start)));
  const detected = (supplied.length ? supplied : detectChapters(text))
    .map((entry) => ({ title: String(entry.title).trim(), start: clamp(number(entry.offset ?? entry.start), 0, text.length) }))
    .sort((a, b) => a.start - b.start)
    .filter((entry, i, entries) => i === 0 || entry.start !== entries[i - 1].start);
  if (!detected.length || detected[0].start > 0) {
    detected.unshift({ title: detected.length ? "Introduction" : "Texte", start: 0 });
  }
  const chapters = detected.map((entry, index) => locate({ ...entry, end: detected[index + 1]?.start ?? text.length }, index));
  return { text, chunks, sentences, chapters };
}

export function generatedDuration(durations) {
  let seconds = 0;
  for (let i = 0; i < durations.length; i++) {
    if (!Number.isFinite(durations[i]) || durations[i] < 0) break;
    seconds += durations[i] + (i ? GAP_SECONDS : 0);
  }
  return seconds;
}

export function textOffsetAtTime(index, seconds, durations) {
  const time = Math.max(0, number(seconds));
  let start = 0, lastOffset = index.chunks[0]?.start ?? 0;
  for (let i = 0; i < index.chunks.length; i++) {
    const duration = durations[i];
    if (!Number.isFinite(duration) || duration < 0) return lastOffset;
    if (i) start += GAP_SECONDS;
    const chunk = index.chunks[i];
    if (time < start) return lastOffset;
    if (time <= start + duration) {
      const ratio = duration ? clamp((time - start) / duration, 0, 1) : 1;
      return chunk.start + ratio * (chunk.end - chunk.start);
    }
    lastOffset = chunk.end;
    start += duration;
  }
  return lastOffset;
}

export function timeAtTextOffset(index, offset, durations) {
  const targetOffset = clamp(number(offset), 0, index.text.length);
  const chunk = locateChunk(index.chunks, targetOffset);
  if (!chunk) return { time: 0, offset: targetOffset, chunkIndex: null, pending: true };
  let start = 0;
  for (let i = 0; i <= chunk.index; i++) {
    if (!Number.isFinite(durations[i]) || durations[i] < 0) {
      return { time: null, offset: targetOffset, chunkIndex: chunk.index, pending: true };
    }
    if (i) start += GAP_SECONDS;
    if (i < chunk.index) start += durations[i];
  }
  const ratio = clamp((targetOffset - chunk.start) / Math.max(1, chunk.end - chunk.start), 0, 1);
  return { time: start + ratio * durations[chunk.index], offset: targetOffset, chunkIndex: chunk.index, pending: false };
}

// Une destination future reste "pending" au lieu d'être ramenée au dernier son
// disponible. L'interface peut continuer à synthétiser puis réévaluer la cible.
export function navigationTarget(index, command, currentTime, durations, complete = false) {
  const amount = number(command.amount);
  if (command.unit === "seconds") {
    const available = generatedDuration(durations);
    const desired = Math.max(0, number(currentTime) + amount);
    const time = complete ? Math.min(available, desired) : desired;
    const pending = !durations.length || time > available + 1e-6;
    const offset = pending ? null : textOffsetAtTime(index, time, durations);
    return { time, offset, chunkIndex: offset === null ? null : locateChunk(index.chunks, offset)?.index ?? null, pending };
  }
  const entries = command.unit === "chapters" ? index.chapters : index.sentences;
  if (!entries.length) return { time: 0, offset: 0, chunkIndex: null, pending: true };
  const currentOffset = textOffsetAtTime(index, currentTime, durations);
  const current = entryAt(entries, currentOffset);
  const target = command.index === undefined
    ? clamp(current + (command.restart ? 0 : Math.trunc(amount)), 0, entries.length - 1)
    : clamp(Math.trunc(number(command.index)), 0, entries.length - 1);
  return { ...timeAtTextOffset(index, entries[target].start, durations), entryIndex: target, title: entries[target].title ?? null };
}
