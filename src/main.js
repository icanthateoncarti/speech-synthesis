import { initialState, reduce, audioKey, statusLine } from "./machine.js";
import { createTts } from "./tts.js";
import { createPlayer } from "./player.js";
import { hasSpeakableContent, splitIntoChunks, wordTimeline } from "./text.js";
import { wavDuration, wavToMp3 } from "./audio.js";

const $ = (id) => document.getElementById(id);
const screen = $("screen"), reader = $("reader"), speak = $("key-speak");
const tts = createTts(), player = createPlayer();
let state = initialState(), operation = null, audioDetails = null;
let preloadJob = null, pdfRevision = 0, pdfBusy = false;
let timeline = [], spans = [], highlighted = -1, elapsed = 0;

function paint() {
  const { left, right } = statusLine(state);
  $("status-left").textContent = pdfBusy ? "LECTURE PDF…" : left;
  $("status-right").textContent = right;
  const playing = state.phase === "playing";
  reader.hidden = !playing;
  screen.style.visibility = playing ? "hidden" : "";
  screen.disabled = playing;
  const stoppable = operation?.mode === "speak";
  speak.textContent = stoppable ? "■ STOP" : "▶ PARLE";
  speak.setAttribute("aria-label", stoppable ? "Arrêter la lecture" : "Parle");
  speak.setAttribute("aria-pressed", String(Boolean(stoppable)));
  $("key-mp3").disabled = operation?.mode === "mp3";
  $("key-pdf").disabled = pdfBusy;
  $("voice-jessica").setAttribute("aria-checked", String(state.voice === "jessica"));
  $("voice-tom").setAttribute("aria-checked", String(state.voice === "tom"));
  for (const name of ["jessica", "tom"]) $("voice-" + name).tabIndex = state.voice === name ? 0 : -1;
  $("speed").setAttribute("aria-valuetext", `${state.speed.toFixed(1).replace(".", ",")} fois`);
}
function dispatch(event) { state = reduce(state, event); paint(); }

function resetReader() {
  reader.replaceChildren();
  timeline = []; spans = []; highlighted = -1; elapsed = 0;
}
function appendWords(text, duration) {
  if (timeline.length) elapsed += 0.15;
  for (const item of wordTimeline([text], [duration])) {
    timeline.push({ ...item, start: item.start + elapsed, end: item.end + elapsed });
    const span = document.createElement("span");
    span.className = "w";
    span.textContent = item.word;
    reader.append(span, " ");
    spans.push(span);
  }
  elapsed += duration;
}
player.onTime((time) => {
  let lo = 0, hi = timeline.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid].start <= time) { found = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  if (found === highlighted) return;
  spans[highlighted]?.classList.remove("now");
  highlighted = found;
  const span = spans[found];
  if (span) {
    span.classList.add("now");
    // Défiler uniquement l'écran, jamais la page entière.
    if (span.offsetTop < reader.scrollTop || span.offsetTop + span.offsetHeight > reader.scrollTop + reader.clientHeight) {
      reader.scrollTop = Math.max(0, span.offsetTop - reader.clientHeight / 2);
    }
  }
});
player.onLevel((level) => {
  [...$("meter").children].forEach((bar, i) => {
    const active = level > i / 12;
    bar.classList.toggle("hot", active);
    bar.style.height = `${20 + (active ? level * (60 + (i % 3) * 10) : 0)}%`;
  });
});
player.onEnded(() => {
  if (operation?.mode !== "speak") return;
  operation = null;
  dispatch({ type: "PLAYBACK_ENDED" });
});

function stop({ cancelPreload = false } = {}) {
  const wasRunning = Boolean(operation);
  operation?.controller.abort();
  operation = null;
  if (wasRunning || cancelPreload) {
    preloadJob = null;
    tts.cancel();
  }
  player.stop();
  pdfRevision++;
  pdfBusy = false;
  dispatch({ type: "STOP" });
}

function preload() {
  if (!hasSpeakableContent(state.text) || preloadJob || operation) return;
  const job = { voice: state.voice };
  preloadJob = job;
  const relevant = () => preloadJob === job && state.voice === job.voice;
  tts.preload(job.voice, { onProgress(pct) {
    if (relevant() && hasSpeakableContent(state.text) && (!operation || state.phase === "downloading" || state.phase === "synthesizing")) {
      dispatch({ type: "DOWNLOAD_PROGRESS", pct });
    }
  } }).then(() => {
    if (relevant() && !operation) dispatch({ type: "STOP" });
  }).catch((err) => {
    if (relevant()) {
      preloadJob = null;
      if (!operation) {
        if (hasSpeakableContent(state.text) && err.kind !== "cancelled") dispatch({ type: "ERROR", kind: err.kind });
        else dispatch({ type: "STOP" });
      }
    }
  });
}

function download(mp3, voice) {
  const url = URL.createObjectURL(new Blob([mp3], { type: "audio/mpeg" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `speechsynthe-si-${voice}.mp3`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function run(mode) {
  if (mode === "speak" && operation?.mode === "speak") { stop(); return; }
  if (operation || pdfBusy) stop();
  dispatch({ type: "SPEAK_PRESSED" });
  if (!hasSpeakableContent(state.text)) return;
  const task = { mode, key: audioKey(state), controller: new AbortController() };
  operation = task;
  const current = () => operation === task && audioKey(state) === task.key;
  const input = { text: state.text, voice: state.voice, speed: state.speed };
  dispatch({ type: "SYNTH_STARTED" });
  try {
    if (mode === "speak") {
      player.stop();
      // Crée/reprend l'AudioContext pendant le geste utilisateur.
      const ready = player.unlock();
      resetReader();
      await ready;
      if (!current()) return;
    }
    let wav = state.audio?.wav;
    if (wav && mode === "speak") {
      if (audioDetails?.key === task.key) {
        audioDetails.chunks.forEach((chunk, i) => appendWords(chunk, audioDetails.durations[i]));
      } else appendWords(input.text, wavDuration(wav));
      player.enqueue(wav);
      dispatch({ type: "PLAYBACK_STARTED" });
    } else if (!wav) {
      const chunks = splitIntoChunks(input.text);
      const result = await tts.synthesize(input, {
        onProgress(pct) { if (current() && state.phase !== "playing") dispatch({ type: "DOWNLOAD_PROGRESS", pct }); },
        onChunk(chunk, i) {
          if (!current()) return;
          if (mode === "speak") {
            appendWords(chunks[i], wavDuration(chunk));
            player.enqueue(chunk);
            dispatch({ type: "PLAYBACK_STARTED" });
          } else dispatch({ type: "SYNTH_STARTED" });
        },
      });
      if (!current()) return;
      wav = result.wav;
      audioDetails = { key: task.key, chunks: result.chunks, durations: result.durations };
      dispatch({ type: "AUDIO_READY", key: task.key, wav });
    }
    if (!current()) return;
    if (mode === "speak") player.finish();
    else {
      dispatch({ type: "SYNTH_STARTED" });
      const mp3 = state.audio?.mp3 ?? await wavToMp3(wav, 96, { signal: task.controller.signal });
      if (!current()) return;
      dispatch({ type: "MP3_READY", key: task.key, mp3 });
      operation = null;
      dispatch({ type: "STOP" });
      download(mp3, input.voice);
    }
  } catch (err) {
    if (!current()) return;
    operation = null;
    player.stop();
    if (err.kind !== "cancelled" && err.name !== "AbortError") dispatch({ type: "ERROR", kind: err.kind });
    else dispatch({ type: "STOP" });
  }
}

screen.addEventListener("input", () => {
  if (operation || pdfBusy) stop();
  dispatch({ type: "TEXT_CHANGED", text: screen.value });
  if (!hasSpeakableContent(state.text)) dispatch({ type: "STOP" });
  preload();
});
speak.addEventListener("click", () => run("speak"));
$("key-mp3").addEventListener("click", () => run("mp3"));
$("key-clear").addEventListener("click", () => {
  stop({ cancelPreload: true });
  screen.value = "";
  audioDetails = null;
  resetReader();
  dispatch({ type: "CLEAR" });
  screen.focus();
});
function chooseVoice(voice, focus = false) {
  if (voice !== state.voice) {
    stop({ cancelPreload: true });
    dispatch({ type: "VOICE_CHANGED", voice });
  }
  if (focus) $("voice-" + voice).focus();
}
for (const voice of ["jessica", "tom"]) $("voice-" + voice).addEventListener("click", () => chooseVoice(voice));
$("voice").addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  chooseVoice(event.key === "Home" ? "jessica" : event.key === "End" ? "tom" : state.voice === "jessica" ? "tom" : "jessica", true);
});
$("voice").querySelector(".knob").addEventListener("click", () => chooseVoice(state.voice === "jessica" ? "tom" : "jessica"));
$("speed").addEventListener("input", () => {
  if (operation || pdfBusy) stop();
  dispatch({ type: "SPEED_CHANGED", speed: Number($("speed").value) });
});

$("key-pdf").addEventListener("click", () => $("pdf-input").click());
$("pdf-input").addEventListener("change", async () => {
  const file = $("pdf-input").files[0];
  $("pdf-input").value = ""; // Permet de sélectionner à nouveau le même fichier.
  if (!file) return;
  stop({ cancelPreload: true });
  const revision = pdfRevision;
  pdfBusy = true;
  paint();
  try {
    const { extractPdfText } = await import("./pdf.js");
    const text = await extractPdfText(file);
    if (revision !== pdfRevision) return;
    pdfBusy = false;
    if (!hasSpeakableContent(text)) dispatch({ type: "PDF_EMPTY" });
    else {
      screen.value = text;
      screen.setSelectionRange(0, 0);
      screen.scrollTop = 0;
      dispatch({ type: "TEXT_CHANGED", text });
      screen.focus({ preventScroll: true });
      preload();
    }
  } catch (err) {
    if (revision !== pdfRevision) return;
    pdfBusy = false;
    dispatch({ type: "PDF_ERROR", password: err.name === "PasswordException" });
  }
});
window.addEventListener("pagehide", () => stop({ cancelPreload: true }));
paint();
