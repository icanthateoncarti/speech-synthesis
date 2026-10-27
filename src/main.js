import { initialState, reduce, audioKey, statusLine } from "./machine.js";
import { createTts } from "./tts.js";
import { createPlayer } from "./player.js";
import { hasSpeakableContent, splitIntoChunks, wordTimeline, detectLanguage } from "./text.js";
import { wavDuration } from "./audio.js";
import { exportMp3Audio } from "./mp3-export.js";
import { buildReadingIndex, generatedDuration, navigationTarget, timeAtTextOffset, textOffsetAtTime } from "./navigation.js";
import { createVoiceCommands, parseVoiceCommand } from "./voice-commands.js";
import { MAX_FILE_BYTES } from "./limits.js";
import { excerpt, hasMarks, readRanges } from "./selection.js";
import { repeatedNoise, documentExcerpt } from "./document-cleanup.js";

const $ = (id) => document.getElementById(id);
const screen = $("screen"), reader = $("reader"), speak = $("key-speak");
const player = createPlayer(), tts = createTts();
let state = initialState(), synthesis = null, exportJob = null, audioDetails = null;
let documentInfo = { name: "", chapters: [] }, index = buildReadingIndex("");
let playbackActive = false, paused = false, pendingNavigation = null;
let preloadJob = null, pdfBusy = false, revision = 0, note = null, noteTimer, importJob = null;
let timeline = [], spans = [], highlighted = -1, elapsed = 0, scrubbing = false, lastPositionPaint = 0;
let micResume = false, voiceListening = false, dragDepth = 0;

function dispatch(event) { state = reduce(state, event); paint(); }
function valid(job) { return synthesis === job && job.key === audioKey(state); }
function formatTime(value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  return n >= 3600 ? `${Math.floor(n / 3600)}:${String(Math.floor(n / 60) % 60).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`
    : `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}
function message(text, milliseconds = 3500) {
  clearTimeout(noteTimer);
  note = text;
  if (milliseconds) noteTimer = setTimeout(() => { note = null; paint(); }, milliseconds);
  paint();
}
function paintPosition(force = false) {
  if (!force && performance.now() - lastPositionPaint < 80) return;
  lastPositionPaint = performance.now();
  const job = synthesis, durations = job?.durations ?? [];
  const available = generatedDuration(durations);
  const spokenChars = job?.chunks.slice(0, durations.length).reduce((n, chunk) => n + chunk.length, 0) ?? 0;
  const estimated = job?.complete ? available : Math.max(available, spokenChars ? available * index.text.length / spokenChars : index.text.length / 14);
  const time = player.getTime();
  $("time-current").textContent = formatTime(time);
  $("time-total").textContent = `${job?.complete ? "" : "~"}${formatTime(estimated)}`;
  $("seek").max = String(Math.max(1, estimated));
  if (!scrubbing) $("seek").value = String(time);
  $("seek").style.setProperty("--buffered", `${estimated ? Math.min(100, available / estimated * 100) : 0}%`);
  $("seek").setAttribute("aria-valuetext", `${formatTime(time)} sur ${job?.complete ? "" : "environ "}${formatTime(estimated)}`);
  if (document.activeElement !== $("chapter")) {
    const offset = textOffsetAtTime(index, time, durations);
    let selected = 0;
    index.chapters.forEach((chapter, i) => { if (chapter.start <= offset) selected = i; });
    $("chapter").value = String(selected);
  }
}
function paint() {
  const { left, right } = statusLine(state);
  const audioPct = synthesis ? Math.min(100, Math.floor((synthesis.completedChars ?? 0) * 100 / Math.max(1, synthesis.totalChars ?? 0))) : 0;
  const progress = exportJob?.stage === "encoding" ? `ENCODAGE MP3 ${exportJob.pct} %`
    : exportJob ? state.phase === "downloading" && !synthesis?.durations.length ? left : `PRÉPARATION AUDIO ${audioPct} %` : null;
  $("status-left").textContent = state.error ? left : pdfBusy ? "LECTURE DU FICHIER…" : progress ?? note ?? (pendingNavigation ? "PRÉPARATION DU PASSAGE…" : paused && playbackActive ? "⏸ PAUSE" : left);
  $("status-right").textContent = right;
  const reading = playbackActive && !paused && !pendingNavigation && (synthesis?.durations.length ?? 0) > 0;
  reader.hidden = !reading;
  screen.style.visibility = reading ? "hidden" : "";
  screen.disabled = reading;
  speak.textContent = playbackActive ? paused ? "▶ REPRENDRE" : "⏸ PAUSE" : "▶ PARLE";
  speak.setAttribute("aria-label", playbackActive ? paused ? "Reprendre la lecture" : "Mettre en pause" : "Parle");
  speak.setAttribute("aria-pressed", String(playbackActive && !paused));
  $("key-mp3").disabled = Boolean(exportJob);
  $("key-mp3").textContent = exportJob ? exportJob.stage === "encoding" ? `MP3 ${exportJob.pct} %` : `AUDIO ${audioPct} %` : "⬇ MP3";
  $("key-pdf").disabled = pdfBusy;
  const pages = documentInfo.pages;
  const cleaning = documentInfo.cleaning;
  $("cleanup-open").hidden = !cleaning;
  $("cleanup-open").textContent = cleaning?.removed.length ? "NETTOYÉ" : "NETTOYER";
  $("cleanup-open").setAttribute("aria-label", cleaning?.removed.length ? "Revoir le nettoyage du document" : "Nettoyer le document : retirer les répétitions");
  $("pages-open").hidden = !pages;
  if (pages) {
    const passages = hasMarks(pages.marks) ? readRanges(pages.fullText.length, pages.marks).length : 0;
    $("pages-open").textContent = passages ? `PAGES · ${passages}` : "PAGES";
    $("pages-open").setAttribute("aria-label", passages ? `Pages du PDF, ${passages} passage${passages > 1 ? "s" : ""} retenu${passages > 1 ? "s" : ""}` : "Pages du PDF : choisir ce qu'il faut lire");
  }
  $("document-label").hidden = !documentInfo.name;
  $("document-label").textContent = documentInfo.name;
  $("document-label").title = documentInfo.name;
  document.querySelector(".machine").dataset.playback = state.error ? "error" : paused ? "paused" : reading ? "playing" : "idle";
  $("transport").hidden = !hasSpeakableContent(state.text);
  for (const name of ["jessica", "tom"]) {
    $("voice-" + name).setAttribute("aria-checked", String(state.voice === name));
    $("voice-" + name).tabIndex = state.voice === name ? 0 : -1;
  }
  $("speed").setAttribute("aria-valuetext", `${state.speed.toFixed(1).replace(".", ",")} fois`);
  paintPosition(true);
}
function rebuildIndex() {
  index = buildReadingIndex(state.text, splitIntoChunks(state.text), documentInfo.chapters);
  $("chapter").replaceChildren(...index.chapters.map((chapter, i) => {
    const option = document.createElement("option");
    option.value = String(i); option.textContent = chapter.title; return option;
  }));
  $("chapter").title = documentInfo.name || "Chapitres du texte";
  paintPosition(true);
}
function resetReader() {
  reader.replaceChildren(); reader.scrollTop = 0;
  timeline = []; spans = []; highlighted = -1; elapsed = 0;
}
function appendWords(text, duration, i, pause = { before: 0, after: 0 }) {
  if (timeline.length) elapsed += 0.15;
  // Les morceaux suivent les lignes : un titre de chapitre garde sa propre ligne.
  if (spans.length && index.text[index.chunks[i]?.start - 1] === "\n") reader.append("\n");
  // Le silence d'un titre fait partie du morceau ; les mots ne s'y étalent pas.
  const speech = Math.max(0, duration - pause.before - pause.after);
  elapsed += pause.before;
  for (const item of wordTimeline([text], [speech])) {
    timeline.push({ ...item, start: item.start + elapsed, end: item.end + elapsed });
    const span = document.createElement("span"); span.className = "w"; span.textContent = item.word;
    reader.append(span, " "); spans.push(span);
  }
  elapsed += speech + pause.after;
}
player.onTime((time) => {
  let lo = 0, hi = timeline.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid].start <= time) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  if (found !== highlighted) {
    spans[highlighted]?.classList.remove("now"); highlighted = found;
    const span = spans[found];
    if (span) {
      span.classList.add("now");
      if (span.offsetTop < reader.scrollTop || span.offsetTop + span.offsetHeight > reader.scrollTop + reader.clientHeight) reader.scrollTop = Math.max(0, span.offsetTop - reader.clientHeight / 2);
    }
  }
  paintPosition();
});
player.onLevel((level) => [...$("meter").children].forEach((bar, i) => {
  const hot = level > i / 12;
  bar.classList.toggle("hot", hot);
  bar.style.height = `${20 + (hot ? level * (60 + (i % 3) * 10) : 0)}%`;
}));
player.onEnded(() => {
  if (!playbackActive || pendingNavigation) return;
  playbackActive = false; paused = false;
  dispatch({ type: "PLAYBACK_ENDED" });
});

function cancelWork({ cancelPreload = false } = {}) {
  const wasGenerating = synthesis && !synthesis.complete;
  synthesis?.controller.abort(); exportJob?.controller.abort();
  synthesis = null; exportJob = null; pendingNavigation = null;
  importJob?.abort(); importJob = null;
  playbackActive = false; paused = false; pdfBusy = false;
  micResume = false; voiceCommands.stop(); voiceListening = false;
  if (wasGenerating || cancelPreload) { preloadJob = null; tts.cancel(); }
  player.stop(); resetReader(); revision++;
  clearTimeout(noteTimer); note = null;
  dispatch({ type: "STOP" });
}
function preload() {
  const lang = detectLanguage(state.text);
  if (!hasSpeakableContent(state.text) || synthesis) return;
  // Un texte qui passe du français à l'anglais précharge l'autre voix.
  if (preloadJob && preloadJob.voice === state.voice && preloadJob.lang === lang) return;
  const job = { voice: state.voice, lang }; preloadJob = job;
  const relevant = () => preloadJob === job && state.voice === job.voice && detectLanguage(state.text) === job.lang;
  tts.preload(job.voice, { lang, onProgress(pct) {
    if (relevant() && hasSpeakableContent(state.text) && !playbackActive) dispatch({ type: "DOWNLOAD_PROGRESS", pct });
  } }).then(() => { if (relevant() && !synthesis) dispatch({ type: "STOP" }); })
    .catch((error) => {
      if (!relevant()) return;
      preloadJob = null;
      if (!synthesis) dispatch(hasSpeakableContent(state.text) && error.kind !== "cancelled" ? { type: "ERROR", kind: error.kind } : { type: "STOP" });
    });
}
function ensureSynthesis() {
  const key = audioKey(state);
  if (synthesis?.key === key) return synthesis;
  const chunks = splitIntoChunks(state.text);
  const job = { key, chunks, durations: [], complete: false, controller: new AbortController(), promise: null, completedChars: 0, totalChars: chunks.reduce((sum, chunk) => sum + chunk.length, 0) };
  synthesis = job;
  resetReader(); player.stop(); player.pause();
  if (state.audio?.key === key && state.audio.wav) {
    const details = audioDetails?.key === key ? audioDetails : { chunks: [state.text], durations: [wavDuration(state.audio.wav)], pauses: [] };
    job.chunks = details.chunks; job.durations = details.durations.slice(); job.complete = true;
    job.completedChars = job.totalChars;
    index = buildReadingIndex(state.text, job.chunks, documentInfo.chapters);
    job.chunks.forEach((chunk, i) => appendWords(chunk, job.durations[i], i, details.pauses?.[i]));
    player.load([state.audio.wav]);
    job.promise = Promise.resolve({ wav: state.audio.wav, chunks: job.chunks, durations: job.durations });
    return job;
  }
  dispatch({ type: "SYNTH_STARTED" });
  const input = { text: state.text, voice: state.voice, speed: state.speed, titles: documentInfo.titles ?? [] };
  job.promise = tts.synthesize(input, {
    onProgress(pct) { if (valid(job) && !player.isPlaying()) dispatch({ type: "DOWNLOAD_PROGRESS", pct }); },
    onChunk(wav, i, _total, pause) {
      if (!valid(job)) return;
      job.durations[i] = wavDuration(wav);
      job.completedChars += chunks[i].length;
      appendWords(chunks[i], job.durations[i], i, pause); player.enqueue(wav);
      applyPending();
      if (playbackActive && !paused && !pendingNavigation) dispatch({ type: "PLAYBACK_STARTED" });
      else if (paused) dispatch({ type: "PLAYBACK_PAUSED" });
      else paint();
      paintPosition(true);
    },
  }).then((result) => {
    if (!valid(job)) return result;
    job.complete = true;
    audioDetails = { key, chunks: result.chunks, durations: result.durations, pauses: result.pauses };
    dispatch({ type: "AUDIO_READY", key, wav: result.wav });
    applyPending(); player.finish();
    if (!playbackActive) dispatch({ type: "STOP" });
    paintPosition(true);
    return result;
  }).catch((error) => {
    if (valid(job)) {
      synthesis = null; pendingNavigation = null; playbackActive = false; paused = false;
      player.stop();
      if (error.kind !== "cancelled" && error.name !== "AbortError") dispatch({ type: "ERROR", kind: error.kind });
      else dispatch({ type: "STOP" });
    }
    throw error;
  });
  // Toutes les actions attachent leur propre résultat ; cette garde couvre une
  // synthèse continuant en arrière-plan après pause ou navigation.
  job.promise.catch(() => {});
  return job;
}
function pausePlayback() {
  if (!playbackActive) return;
  paused = true; player.pause();
  if (pendingNavigation) pendingNavigation.resume = false;
  dispatch({ type: "PLAYBACK_PAUSED" });
}
async function togglePlayback() {
  if (playbackActive && !paused) { pausePlayback(); return; }
  dispatch({ type: "SPEAK_PRESSED" });
  if (!hasSpeakableContent(state.text)) return;
  const ready = player.unlock();
  if (pdfBusy) return;
  const job = ensureSynthesis();
  playbackActive = true; paused = false; note = null;
  if (pendingNavigation) pendingNavigation.resume = true;
  await ready;
  if (!valid(job)) return;
  if (pendingNavigation) applyPending();
  else {
    if (job.complete && player.getTime() >= player.getDuration() - 0.01) player.seek(0);
    player.resume();
  }
  dispatch({ type: job.durations.length ? "PLAYBACK_STARTED" : "SYNTH_STARTED" });
}
function applyPending() {
  const target = pendingNavigation, job = synthesis;
  if (!target || !job) return;
  let result;
  if (target.offset !== null) result = timeAtTextOffset(index, target.offset, job.durations);
  else result = navigationTarget(index, { unit: "seconds", amount: target.time }, 0, job.durations, job.complete);
  if (result.pending) { paint(); return; }
  pendingNavigation = null;
  player.seek(result.time);
  paused = !target.resume; playbackActive = true;
  if (target.resume) player.resume();
  // Un saut jusqu'à la fin de l'audio complet déclenche onEnded pendant resume().
  if (playbackActive) dispatch({ type: target.resume ? "PLAYBACK_STARTED" : "PLAYBACK_PAUSED" });
}
async function navigate(command, { resume } = {}) {
  if (!hasSpeakableContent(state.text)) { dispatch({ type: "SPEAK_PRESSED" }); return; }
  const ready = player.unlock();
  const shouldResume = resume ?? (playbackActive ? !paused : true);
  const job = ensureSynthesis();
  const result = navigationTarget(index, command, player.getTime(), job.durations, job.complete);
  playbackActive = true; player.pause(); paused = !shouldResume;
  pendingNavigation = { time: result.time, offset: result.offset, resume: shouldResume };
  note = null;
  await ready;
  if (valid(job)) applyPending();
}
function commandAction(command, resume) {
  if (command.type === "pause") { pausePlayback(); return; }
  if (command.type === "resume") { if (!playbackActive || paused) void togglePlayback(); return; }
  const spec = command.type === "relative-time" ? { unit: "seconds", amount: command.seconds }
    : command.type === "relative-sentence" ? { unit: "sentences", amount: command.count }
    : command.type === "relative-chapter" ? { unit: "chapters", amount: command.count }
    : { unit: "chapters", amount: 0, restart: true };
  void navigate(spec, { resume });
}
function download(mp3, voice) {
  const url = URL.createObjectURL(new Blob([mp3], { type: "audio/mpeg" }));
  const link = document.createElement("a"); link.href = url; link.download = `speechsynthe-si-${voice}.mp3`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
async function exportMp3() {
  dispatch({ type: "SPEAK_PRESSED" });
  if (!hasSpeakableContent(state.text) || exportJob || pdfBusy) return;
  const ready = player.unlock();
  const job = ensureSynthesis();
  const task = { key: audioKey(state), voice: state.voice, controller: new AbortController() };
  exportJob = task; paint();
  try {
    await ready;
    const result = await job.promise;
    if (exportJob !== task || task.key !== audioKey(state)) return;
    task.stage = "encoding"; task.pct = 0; paint();
    const mp3 = state.audio?.mp3 ?? await exportMp3Audio(result.wav, {
      signal: task.controller.signal,
      onProgress(pct) { if (exportJob === task) { task.pct = pct; paint(); } },
    });
    if (exportJob !== task || task.key !== audioKey(state)) return;
    dispatch({ type: "MP3_READY", key: task.key, mp3 });
    download(mp3, task.voice);
  } catch (error) {
    if (exportJob === task && error.kind !== "cancelled" && error.name !== "AbortError") dispatch({ type: "ERROR", kind: error.kind });
  } finally { if (exportJob === task) { exportJob = null; paint(); } }
}

const PPTX_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const formatOf = (file) => /\.pptx$/i.test(file.name) || file.type === PPTX_TYPE ? "pptx"
  : /\.pdf$/i.test(file.name) || file.type === "application/pdf" ? "pdf" : null;

async function importDocument(file) {
  if (!file) return;
  const format = formatOf(file);
  if (!format) { message(/\.ppt$/i.test(file.name) ? "ENREGISTRE-LE EN .PPTX" : "CHOISIS UN PDF OU UN PPTX"); return; }
  if (file.size > MAX_FILE_BYTES) { message("FICHIER TROP LOURD · 100 MO MAX"); return; }
  cancelWork({ cancelPreload: true });
  const version = revision, job = new AbortController(); importJob = job; pdfBusy = true; paint();
  try {
    const options = { signal: job.signal };
    const document = format === "pptx"
      ? await (await import("./pptx.js")).extractPptxDocument(file, options)
      : await (await import("./pdf.js")).extractPdfDocument(file, options);
    if (version !== revision) return;
    pdfBusy = false;
    if (!hasSpeakableContent(document.text)) { dispatch({ type: "PDF_EMPTY", format }); return; }
    documentInfo = { name: file.name, chapters: document.chapters, titles: document.titles ?? [] };
    documentInfo.cleaning = {
      fullText: document.text, fullChapters: document.chapters,
      suggestions: repeatedNoise(document.fragments ?? [], document.pageCount ?? 0), removed: [], reviewed: false,
    };
    // PDF : la vue des pages permet de choisir ce qu'il faut lire ou sauter.
    if (format === "pdf" && document.pageMaps) {
      documentInfo.pages = { file, pageMaps: document.pageMaps, fullText: document.text, fullChapters: document.chapters, marks: { include: [], exclude: [] } };
    }
    screen.value = document.text; screen.setSelectionRange(0, 0); screen.scrollTop = 0;
    dispatch({ type: "TEXT_CHANGED", text: document.text }); rebuildIndex();
    screen.focus({ preventScroll: true }); preload();
    if (document.truncated) message("TEXTE COUPÉ À 2 MILLIONS DE CARACTÈRES", 8000);
  } catch (error) {
    if (version !== revision || error.name === "AbortError") return;
    pdfBusy = false;
    if (error.name === "TooLargeError") { message("FICHIER TROP VOLUMINEUX", 6000); return; }
    dispatch({ type: "PDF_ERROR", format, password: error.name === "PasswordException" });
  } finally {
    if (importJob === job) importJob = null;
  }
}
// Les passages surlignés deviennent le texte de la machine (chapitres replacés).
function applyMarks() {
  const pages = documentInfo.pages;
  const marked = hasMarks(pages.marks);
  const ranges = readRanges(pages.fullText.length, pages.marks);
  const next = documentInfo.cleaning ? documentExcerpt(documentInfo.cleaning, pages.marks)
    : marked ? excerpt(pages.fullText, ranges, pages.fullChapters) : { text: pages.fullText, chapters: pages.fullChapters };
  if (next.text !== state.text) {
    cancelWork();
    screen.value = next.text; screen.setSelectionRange(0, 0); screen.scrollTop = 0;
    documentInfo.chapters = next.chapters;
    dispatch({ type: "TEXT_CHANGED", text: next.text }); rebuildIndex(); preload();
  }
  message(!marked ? "TOUT LE DOCUMENT" : !next.text ? "RIEN À LIRE · OUVRE PAGES" : `SÉLECTION · ${ranges.length} PASSAGE${ranges.length > 1 ? "S" : ""}`, 5000);
}
async function openPagesView() {
  const pages = documentInfo.pages;
  if (!pages) return;
  pausePlayback();
  try {
    const { openPages } = await import("./pages.js");
    const marks = await openPages({ file: pages.file, pageMaps: pages.pageMaps, text: pages.fullText, marks: pages.marks });
    if (documentInfo.pages !== pages) return;
    pages.marks = marks;
    applyMarks();
  } catch {
    message("PAGES INDISPONIBLES · RÉESSAIE");
  }
}
$("pages-open").addEventListener("click", () => { void openPagesView(); });
$("cleanup-open").addEventListener("click", async () => {
  const source = documentInfo.cleaning;
  if (!source) return;
  pausePlayback();
  const { reviewCleanup } = await import("./cleanup-dialog.js");
  const removed = await reviewCleanup(source);
  if (documentInfo.cleaning !== source || removed === null) return;
  source.removed = removed; source.reviewed = true;
  const next = documentExcerpt(source, documentInfo.pages?.marks);
  if (next.text !== state.text) {
    cancelWork();
    documentInfo.chapters = next.chapters;
    screen.value = next.text; screen.setSelectionRange(0, 0); screen.scrollTop = 0;
    dispatch({ type: "TEXT_CHANGED", text: next.text }); rebuildIndex(); preload();
  } else paint();
  message(removed.length ? `${removed.length} RÉPÉTITION${removed.length > 1 ? "S" : ""} RETIRÉE${removed.length > 1 ? "S" : ""}` : "NETTOYAGE ANNULÉ · TEXTE RÉTABLI", 5000);
});
screen.addEventListener("input", () => {
  if (synthesis || exportJob || pdfBusy || playbackActive) cancelWork();
  documentInfo = { name: "", chapters: [] };
  dispatch({ type: "TEXT_CHANGED", text: screen.value }); rebuildIndex();
  if (!hasSpeakableContent(state.text)) dispatch({ type: "STOP" });
  preload();
});
speak.addEventListener("click", () => { void togglePlayback(); });
$("key-mp3").addEventListener("click", () => { void exportMp3(); });
$("key-clear").addEventListener("click", () => {
  cancelWork({ cancelPreload: true }); screen.value = ""; documentInfo = { name: "", chapters: [] }; audioDetails = null;
  dispatch({ type: "CLEAR" }); rebuildIndex();
  $("commands-panel").hidden = true; $("commands-toggle").setAttribute("aria-expanded", "false"); screen.focus();
});
function chooseVoice(voice, focus = false) {
  if (voice !== state.voice) { cancelWork({ cancelPreload: true }); dispatch({ type: "VOICE_CHANGED", voice }); preload(); }
  if (focus) $("voice-" + voice).focus();
}
for (const name of ["jessica", "tom"]) $("voice-" + name).addEventListener("click", () => chooseVoice(name));
$("voice").addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  chooseVoice(event.key === "Home" ? "jessica" : event.key === "End" ? "tom" : state.voice === "jessica" ? "tom" : "jessica", true);
});
// Deux crans : le repère suit le geste, la voix ne change qu'au relâchement.
// Un clic garde le raccourci de bascule ; les radios restent accessibles au clavier.
const knob = $("voice").querySelector(".knob");
let turn = null;
knob.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0 || turn) return;
  event.preventDefault();
  const angle = state.voice === "tom" ? 42 : -42;
  turn = { id: event.pointerId, x: event.clientX, y: event.clientY, start: angle, angle, moved: false };
  knob.setPointerCapture(event.pointerId);
  knob.classList.add("turning");
});
knob.addEventListener("pointermove", (event) => {
  if (!turn || event.pointerId !== turn.id) return;
  const dx = event.clientX - turn.x, dy = event.clientY - turn.y;
  if (Math.hypot(dx, dy) < 6 && !turn.moved) return;
  turn.moved = true;
  turn.angle = Math.max(-42, Math.min(42, turn.start + (dx - dy) * 1.2));
  knob.style.setProperty("--knob-angle", `${turn.angle}deg`);
});
function finishTurn(event, commit) {
  if (!turn || event.pointerId !== turn.id) return;
  const gesture = turn;
  turn = null;
  knob.classList.remove("turning");
  knob.style.removeProperty("--knob-angle");
  if (knob.hasPointerCapture(gesture.id)) knob.releasePointerCapture(gesture.id);
  if (commit) chooseVoice(gesture.moved ? gesture.angle >= 0 ? "tom" : "jessica" : state.voice === "jessica" ? "tom" : "jessica");
}
knob.addEventListener("pointerup", (event) => finishTurn(event, true));
knob.addEventListener("pointercancel", (event) => finishTurn(event, false));
knob.addEventListener("lostpointercapture", (event) => finishTurn(event, false));
$("speed").addEventListener("input", () => { cancelWork(); dispatch({ type: "SPEED_CHANGED", speed: Number($("speed").value) }); });
$("key-pdf").addEventListener("click", () => $("pdf-input").click());
$("pdf-input").addEventListener("change", () => { const file = $("pdf-input").files[0]; $("pdf-input").value = ""; void importDocument(file); });

const isFileDrag = (event) => [...(event.dataTransfer?.types ?? [])].includes("Files");
function showDrop(show) { $("drop-overlay").hidden = !show; document.querySelector(".machine").classList.toggle("drag-over", show); }
window.addEventListener("dragenter", (event) => { if (isFileDrag(event)) { event.preventDefault(); dragDepth++; showDrop(true); } });
window.addEventListener("dragover", (event) => { if (isFileDrag(event)) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } });
window.addEventListener("dragleave", (event) => { if (isFileDrag(event) && --dragDepth <= 0) { dragDepth = 0; showDrop(false); } });
window.addEventListener("drop", (event) => {
  if (!isFileDrag(event)) return;
  event.preventDefault(); dragDepth = 0; showDrop(false);
  const files = [...event.dataTransfer.files];
  if (files.length !== 1) { message("UN FICHIER À LA FOIS"); return; }
  void importDocument(files[0]);
});
$("rewind").addEventListener("click", () => { void navigate({ unit: "seconds", amount: -30 }); });
$("forward").addEventListener("click", () => { void navigate({ unit: "seconds", amount: 30 }); });
$("chapter-restart").addEventListener("click", () => { void navigate({ unit: "chapters", restart: true }); });
$("chapter").addEventListener("change", () => { void navigate({ unit: "chapters", index: Number($("chapter").value) }); });
$("seek").addEventListener("input", () => { scrubbing = true; $("time-current").textContent = formatTime($("seek").value); });
$("seek").addEventListener("change", () => { const target = Number($("seek").value); scrubbing = false; void navigate({ unit: "seconds", amount: target - player.getTime() }); });
$("commands-toggle").addEventListener("click", () => {
  const open = $("commands-panel").hidden;
  $("commands-panel").hidden = !open; $("commands-toggle").setAttribute("aria-expanded", String(open));
  if (open) {
    $("command").focus({ preventScroll: true });
    $("commands-panel").scrollIntoView({ block: "nearest", behavior: "instant" });
  }
});
$("commands-panel").addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  $("commands-panel").hidden = true;
  $("commands-toggle").setAttribute("aria-expanded", "false");
  $("commands-toggle").focus();
});
for (const [id, direction] of [["jump-back", -1], ["jump-forward", 1]]) $(id).addEventListener("click", () => {
  const count = Number($("jump-count").value);
  if (!Number.isInteger(count) || count < 1 || count > 10000) { $("command-feedback").textContent = "Choisis un nombre entre 1 et 10 000."; return; }
  void navigate({ unit: $("jump-unit").value, amount: count * direction });
});
$("command-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const command = parseVoiceCommand($("command").value);
  $("command-feedback").textContent = command ? `Commande : ${$("command").value}` : "Essaie « reviens 3 phrases en arrière » ou « avance de 5 minutes ».";
  if (command) commandAction(command);
});

function restoreVoiceAudio() {
  if (!micResume) return;
  micResume = false;
  if (playbackActive && paused) void togglePlayback();
}
const voiceCommands = createVoiceCommands({
  onState(next) {
    voiceListening = ["starting", "listening"].includes(next);
    $("voice-command").setAttribute("aria-pressed", String(voiceListening));
    $("voice-command").textContent = next === "downloading" ? "… FR" : voiceListening ? "ARRÊTER" : "MICRO";
    if (next === "listening") $("command-feedback").textContent = "Je t'écoute. Une commande, puis la lecture reprend.";
    else if (next === "downloading") $("command-feedback").textContent = "Installation du français sur cet appareil. Le microphone reste fermé.";
    else if (next === "ready") $("command-feedback").textContent = "Le français est prêt. Appuie sur MICRO pour dicter une commande.";
    else if (next === "idle") restoreVoiceAudio();
  },
  onCommand(command, transcript) {
    const resume = micResume;
    micResume = false;
    $("command-feedback").textContent = `Commande : ${transcript}`;
    commandAction(command, resume);
  },
  onError(error) { $("command-feedback").textContent = error.message; },
});
$("voice-command").title = voiceCommands.supported() ? "Dicter une commande sur cet appareil" : "Reconnaissance locale indisponible ici ; utilise les boutons ou une commande écrite";
$("voice-command").addEventListener("click", async () => {
  if (voiceListening) { voiceCommands.stop(); restoreVoiceAudio(); return; }
  micResume = playbackActive && !paused;
  if (micResume) pausePlayback();
  const started = await voiceCommands.start();
  if (!started) restoreVoiceAudio();
});
// Pages par usage : un exemple de texte se charge dans la machine.
document.addEventListener("click", (event) => {
  const sample = event.target.closest("[data-sample]");
  if (!sample) return;
  screen.value = sample.dataset.sample; screen.dispatchEvent(new Event("input"));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelector(".machine").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  screen.focus({ preventScroll: true }); screen.setSelectionRange(0, 0);
});
window.addEventListener("pagehide", () => { cancelWork({ cancelPreload: true }); });
rebuildIndex(); paint();
