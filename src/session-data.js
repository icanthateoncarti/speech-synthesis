import { MAX_TEXT_CHARS } from "./limits.js";
import { hasSpeakableContent, clampSpeed } from "./text.js";

// Liste blanche commune aux sauvegardes et aux liens reçus. Aucune URL ou HTML.
export function sessionData(value) {
  if (!value || value.version !== 1 || typeof value.text !== "string" || value.text.length > MAX_TEXT_CHARS || !hasSpeakableContent(value.text)) throw new Error("Session invalide ou trop volumineuse.");
  if (!["jessica", "tom"].includes(value.voice) || !Number.isFinite(value.speed) || value.speed < 0.7 || value.speed > 1.5) throw new Error("Réglages de session invalides.");
  const chapters = Array.isArray(value.chapters) ? value.chapters.slice(0, 5000).map(c => {
    if (!c || typeof c.title !== "string" || c.title.length > 300 || !Number.isInteger(c.offset) || c.offset < 0 || c.offset > value.text.length) throw new Error("Chapitres invalides.");
    return { title: c.title, offset: c.offset };
  }).sort((a, b) => a.offset - b.offset) : [];
  const offset = Number.isFinite(value.offset) ? Math.max(0, Math.min(value.text.length, Math.floor(value.offset))) : 0;
  return { version: 1, text: value.text, voice: value.voice, speed: clampSpeed(value.speed),
    name: typeof value.name === "string" ? value.name.slice(0, 200) : "Cours partagé", chapters,
    titles: Array.isArray(value.titles) ? value.titles.filter(t => typeof t === "string" && t.length <= 300).slice(0, 5000) : [], offset };
}
