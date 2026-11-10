// MP3 RAPIDE : Azure fabrique l'audio d'un long cours en quelques secondes, quand le
// téléphone mettrait plus longtemps que l'écoute. Le texte part alors chez Microsoft :
// la personne le choisit à chaque fois, sinon le MP3 reste fabriqué sur l'appareil.
import { SHARE_API } from "./share-config.js";

export const FAST_MAX_CHARS = 3000;
// En dessous, l'appareil prépare l'audio assez vite : pas de question.
export const FAST_MIN_CHARS = 1500;
const VOICES = {
  fr: { jessica: "fr-FR-DeniseNeural", tom: "fr-FR-HenriNeural" },
  en: { jessica: "en-US-JennyNeural", tom: "en-US-GuyNeural" },
  nl: { jessica: "nl-BE-DenaNeural", tom: "nl-BE-ArnaudNeural" },
};
export const fastVoice = (voice, lang) => (VOICES[lang] ?? VOICES.fr)[voice === "tom" ? "tom" : "jessica"];

// Morceaux de FAST_MAX_CHARS au plus, coupés après une phrase ou une ligne quand c'est possible.
export function fastChunks(text, max = FAST_MAX_CHARS) {
  const chunks = [];
  let rest = text.trim();
  while (rest.length > max) {
    const window = rest.slice(0, max + 1);
    let cut = Math.max(window.lastIndexOf("\n"), ...[". ", "! ", "? ", "… "].map((end) => window.lastIndexOf(end) + 1));
    if (cut < max / 2) cut = window.lastIndexOf(" ");
    if (cut < max / 2) cut = max;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks.filter(Boolean);
}

const fastError = (kind, reason) => Object.assign(new Error(`MP3 rapide indisponible (${reason ?? kind})`), { kind, reason });

let status = null, checkedAt = 0;
export async function fastAvailable({ api = SHARE_API, now = Date.now() } = {}) {
  if (status !== null && now - checkedAt < 5 * 60_000) return status;
  try {
    const response = await fetch(`${api}/tts/status`, { credentials: "omit", signal: AbortSignal.timeout(4000) });
    status = response.ok && (await response.json()).available === true;
  } catch { status = false; }
  checkedAt = now;
  return status;
}

export async function fastMp3(text, { voice, lang, speed = 1, signal, onProgress, api = SHARE_API } = {}) {
  const chunks = fastChunks(text), parts = new Array(chunks.length);
  const body = (chunk) => JSON.stringify({ text: chunk, voice: fastVoice(voice, lang), lang: VOICES[lang] ? lang : "fr", rate: speed });
  let next = 0, done = 0;
  async function worker() {
    while (next < chunks.length) {
      const i = next++;
      let response;
      try {
        response = await fetch(`${api}/tts`, { method: "POST", body: body(chunks[i]), credentials: "omit", headers: { "Content-Type": "application/json" }, signal });
      } catch (error) {
        if (error.name === "AbortError") throw error;
        throw fastError("network");
      }
      if (!response.ok) throw fastError(response.status === 429 ? "quota" : "upstream", (await response.json().catch(() => ({}))).reason);
      parts[i] = new Uint8Array(await response.arrayBuffer());
      onProgress?.(Math.round(++done * 100 / chunks.length));
    }
  }
  // Deux morceaux à la fois : le niveau gratuit d'Azure limite le nombre de requêtes par minute.
  await Promise.all([worker(), worker()]);
  const mp3 = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  parts.reduce((offset, part) => { mp3.set(part, offset); return offset + part.length; }, 0);
  return mp3.buffer;
}
