import { parseWav } from "./audio.js";

const GAP_SECONDS = 0.15;
const LOOK_AHEAD_SECONDS = 30;
const START_DELAY_SECONDS = 0.015;
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

// Les WAV restent disponibles pour revenir en arrière. Seules les prochaines
// secondes sont converties en Float32 : un long PDF ne double pas sa mémoire audio.
export function createPlayer() {
  let context, analyser, samples, frame;
  let parts = [], records = [], sources = new Set();
  let duration = 0, position = 0, scheduledThrough = 0, revision = 0;
  let sealed = false, running = false, paused = false, ended = false;
  let levelCallback = () => {}, timeCallback = () => {}, endedCallback = () => {};

  function unlock() {
    if (!context) {
      context = new AudioContext();
      analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(context.destination);
      samples = new Float32Array(analyser.fftSize);
    }
    // À appeler directement depuis le geste utilisateur, avant tout await (iOS).
    return context.resume();
  }

  function getTime() {
    if (!running || !records.length) return position;
    const now = context.currentTime;
    let lo = 0, hi = records.length - 1, found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (records[mid].start <= now) { found = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    if (found < 0) return position;
    const record = records[found];
    if (now <= record.end) return Math.min(duration, record.offset + now - record.start);
    // Le silence prévu compte dans la durée. Une attente de synthèse, elle, ne
    // fait pas défiler le texte ni avancer l'horloge au-delà du son disponible.
    return Math.min(duration, record.logicalEnd + Math.min(GAP_SECONDS, now - record.end));
  }

  function cancelSources() {
    revision++;
    for (const source of sources) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    sources.clear();
    records = [];
    scheduledThrough = 0;
  }

  function checkEnded() {
    if (!running || !sealed || sources.size || scheduledThrough < parts.length || ended) return;
    position = duration;
    running = false;
    paused = true;
    ended = true;
    cancelAnimationFrame(frame);
    frame = null;
    levelCallback(0);
    timeCallback(position);
    endedCallback();
  }

  function scheduleMore() {
    if (!running || !context) return;
    const time = getTime();
    while (scheduledThrough < parts.length) {
      const part = parts[scheduledThrough];
      if (part.end <= position + 1e-6) { scheduledThrough++; continue; }
      if (part.offset > time + LOOK_AHEAD_SECONDS) break;
      scheduledThrough++;
      const trim = Math.max(0, position - part.offset);
      const previous = records.at(-1);
      const start = previous
        ? Math.max(context.currentTime + START_DELAY_SECONDS, previous.end + GAP_SECONDS)
        : context.currentTime + START_DELAY_SECONDS + Math.max(0, part.offset - position);
      const buffer = context.createBuffer(1, part.pcm.length, part.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < part.pcm.length; i++) channel[i] = part.pcm[i] / 32768;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(analyser);
      const record = { start, end: start + part.seconds - trim, offset: part.offset + trim, logicalEnd: part.end };
      records.push(record);
      sources.add(source);
      const generation = revision;
      source.onended = () => {
        if (generation !== revision) return;
        source.onended = null;
        sources.delete(source);
        source.disconnect();
        scheduleMore();
        checkEnded();
      };
      source.start(start, trim);
    }
  }

  function tick() {
    if (!running) { frame = null; return; }
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((n, value) => n + value * value, 0) / samples.length);
    levelCallback(Math.min(1, rms * 5));
    timeCallback(getTime());
    scheduleMore();
    checkEnded();
    if (running) frame = requestAnimationFrame(tick);
  }

  function startAt(seconds) {
    if (!context) throw new Error("Le lecteur doit être activé par un clic.");
    cancelSources();
    position = Math.max(0, Math.min(duration, finite(seconds)));
    paused = false;
    running = true;
    ended = false;
    scheduleMore();
    timeCallback(position);
    checkEnded();
    if (running && !frame) frame = requestAnimationFrame(tick);
    return position;
  }

  function append(wav) {
    const { samples: pcm, sampleRate } = parseWav(wav);
    const seconds = pcm.length / sampleRate;
    const offset = duration + (parts.length ? GAP_SECONDS : 0);
    parts.push({ pcm, sampleRate, seconds, offset, end: offset + seconds });
    duration = offset + seconds;
    ended = false;
  }

  function enqueue(wav) {
    if (!context) throw new Error("Le lecteur doit être activé par un clic.");
    append(wav);
    if (!paused && !running) startAt(position);
    else scheduleMore();
  }

  function pause() {
    position = getTime();
    running = false;
    paused = true;
    cancelSources();
    cancelAnimationFrame(frame);
    frame = null;
    levelCallback(0);
    timeCallback(position);
    return position;
  }

  function seek(seconds) {
    const target = Math.max(0, Math.min(duration, finite(seconds)));
    if (running) return startAt(target);
    position = target;
    ended = false;
    timeCallback(position);
    return position;
  }

  function stop() {
    running = false;
    paused = false;
    sealed = false;
    ended = false;
    cancelSources();
    parts = [];
    duration = 0;
    position = 0;
    cancelAnimationFrame(frame);
    frame = null;
    levelCallback(0);
  }

  function load(wavs) {
    stop();
    paused = true;
    for (const wav of wavs) append(wav);
    sealed = true;
    timeCallback(0);
  }

  return {
    unlock, enqueue, stop, load, pause, seek,
    play(seconds = 0) { return startAt(seconds); },
    resume() { return startAt(position); },
    getTime,
    getDuration() { return duration; },
    isPaused() { return paused; },
    isPlaying() { return running; },
    finish() { sealed = true; scheduleMore(); checkEnded(); },
    onLevel(cb) { levelCallback = cb; },
    onTime(cb) { timeCallback = cb; },
    onEnded(cb) { endedCallback = cb; },
  };
}
