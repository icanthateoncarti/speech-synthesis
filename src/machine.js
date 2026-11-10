import { hasSpeakableContent, clampSpeed, detectLanguage } from "./text.js";

export function initialState() {
  return { text: "", voice: "jessica", speed: 1.0, phase: "idle", downloadPct: null, error: null, notice: null, audio: null };
}

export function audioKey(state) {
  return `${state.voice}|${state.speed.toFixed(1)}|${state.text}`;
}

// Met à jour des champs et vide l'audio si la clé change.
function withInvalidation(state, patch) {
  const next = { ...state, ...patch };
  if (audioKey(next) !== audioKey(state)) next.audio = null;
  return next;
}

// Cause d'un import raté, pour dire quoi faire au lieu d'un « illisible » fourre-tout.
const BROKEN_FILE = new Set(["InvalidPDFException", "FormatError", "InvalidPptx"]);
export function importFailureCause(error, online = true) {
  if (error?.name === "PasswordException") return "password";
  if (BROKEN_FILE.has(error?.name)) return "invalid";
  if (!online || /Failed to fetch|NetworkError|network error|dynamically imported module|Importing a module script failed|Load failed/i.test(String(error?.message ?? error))) return "network";
  return "other";
}

export function reduce(state, event) {
  switch (event.type) {
    // Événements de résultat : ne touchent pas à notice/error (sauf ERROR/PDF_EMPTY).
    case "PLAYBACK_ENDED":
    case "STOP":
      return { ...state, phase: "idle" };
    case "AUDIO_READY":
      if (event.key !== audioKey(state)) return state;
      return { ...state, audio: { key: event.key, wav: event.wav, mp3: state.audio?.mp3 ?? null } };
    case "MP3_READY":
      if (event.key !== audioKey(state)) return state;
      return { ...state, audio: { key: event.key, wav: state.audio?.wav ?? null, mp3: event.mp3 } };
    case "ERROR":
      return { ...state, phase: "idle", downloadPct: null, notice: null, error: event.kind === "network" ? "network" : "other" };
    case "PDF_EMPTY":
      return { ...state, error: null, notice: `${event.format ?? "pdf"}-empty` };
    case "PDF_ERROR":
      return { ...state, phase: "idle", error: null, notice: `${event.format ?? "pdf"}-${event.cause ?? "invalid"}` };
  }

  // Événements d'action : effacent notice et error avant leur propre effet.
  const base = { ...state, notice: null, error: null };
  switch (event.type) {
    case "TEXT_CHANGED":
      return withInvalidation(base, { text: event.text });
    case "VOICE_CHANGED":
      return withInvalidation(base, { voice: event.voice });
    case "SPEED_CHANGED":
      return withInvalidation(base, { speed: clampSpeed(event.speed) });
    case "SPEAK_PRESSED":
      if (state.phase === "playing") return { ...base, phase: "idle" };
      if (!hasSpeakableContent(state.text)) return { ...base, notice: "empty" };
      return base;
    case "DOWNLOAD_PROGRESS":
      return { ...base, phase: "downloading", downloadPct: event.pct };
    case "SYNTH_STARTED":
      return { ...base, phase: "synthesizing", downloadPct: null };
    case "PLAYBACK_STARTED":
      return { ...base, phase: "playing", downloadPct: null };
    case "CLEAR":
      return { ...base, text: "", audio: null, phase: "idle", downloadPct: null };
    default:
      return state;
  }
}

const PHASE_LABELS = {
  synthesizing: "SYNTHÈSE…",
  playing: "▶ LECTURE",
};

const formatName = (notice) => notice.split("-")[0].toUpperCase();

let lastText = null, lastLanguage = "fr";
function languageOf(text) {
  if (text !== lastText) { lastText = text; lastLanguage = detectLanguage(text); }
  return lastLanguage;
}

export function statusLine(state) {
  let left;
  if (state.error === "network") left = "ERREUR RÉSEAU · RÉESSAIE";
  else if (state.error) left = "ERREUR · RÉESSAIE";
  else if (state.notice === "empty") left = "ÉCRAN VIDE";
  else if (/-empty$/.test(state.notice)) left = `${formatName(state.notice)} SANS TEXTE`;
  else if (/-password$/.test(state.notice)) left = `${formatName(state.notice)} PROTÉGÉ · DÉVERROUILLE-LE`;
  else if (state.notice === "pdf-invalid") left = "PDF ABÎMÉ · RETÉLÉCHARGE-LE";
  else if (/-invalid$/.test(state.notice)) left = `${formatName(state.notice)} ABÎMÉ · RÉENREGISTRE-LE`;
  else if (/-network$/.test(state.notice)) left = "CONNEXION COUPÉE · RÉESSAIE";
  else if (/-other$/.test(state.notice)) left = `${formatName(state.notice)} NON LU · RECHARGE LA PAGE`;
  else if (state.phase === "downloading") left = `CHARGEMENT VOIX ${Math.round(state.downloadPct ?? 0)} %`;
  else if (PHASE_LABELS[state.phase]) left = PHASE_LABELS[state.phase];
  else left = state.audio?.mp3 ? "✓ MP3 PRÊT" : "PRÊT";
  const english = languageOf(state.text) === "en";
  const right = `VOIX : ${state.voice.toUpperCase()}${english ? " · EN" : ""} · VITESSE ${state.speed.toFixed(1)}×`;
  return { left, right };
}
