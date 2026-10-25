import { parseWav } from "./audio.js";

// Horloge audio réelle : les pauses dues à une synthèse plus lente que la lecture
// ne font pas avancer le surlignage. finish() distingue une attente de la fin.
export function createPlayer() {
  let context, analyser, samples, frame;
  let segments = [], sources = new Set(), sealed = false, duration = 0;
  let levelCallback = () => {}, timeCallback = () => {}, endedCallback = () => {};

  function unlock() {
    if (!context) {
      context = new AudioContext();
      analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(context.destination);
      samples = new Float32Array(analyser.fftSize);
    }
    // Appelé directement depuis le clic, avant tout téléchargement (Safari/iOS).
    return context.resume();
  }

  function tick() {
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((n, v) => n + v * v, 0) / samples.length);
    levelCallback(Math.min(1, rms * 5));
    const now = context.currentTime;
    let time = 0;
    for (const part of segments) {
      if (now < part.start) break;
      time = part.offset + Math.min(now - part.start, part.end - part.start);
    }
    timeCallback(time);
    frame = requestAnimationFrame(tick);
  }

  function checkEnded() {
    if (sealed && sources.size === 0) {
      cancelAnimationFrame(frame);
      frame = null;
      levelCallback(0);
      timeCallback(duration);
      endedCallback();
    }
  }

  function enqueue(wav) {
    if (!context) throw new Error("Le lecteur doit être activé par un clic.");
    const { samples: pcm, sampleRate } = parseWav(wav);
    const buffer = context.createBuffer(1, pcm.length, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;
    const previous = segments.at(-1);
    const gap = previous ? 0.15 : 0;
    const start = Math.max(context.currentTime + 0.015, (previous?.end ?? 0) + gap);
    const offset = duration + gap;
    segments.push({ start, end: start + buffer.duration, offset });
    duration = offset + buffer.duration;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);
    sources.add(source);
    source.onended = () => {
      sources.delete(source);
      source.disconnect();
      checkEnded();
    };
    source.start(start);
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function stop() {
    sealed = false;
    for (const source of sources) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    sources.clear();
    segments = [];
    duration = 0;
    cancelAnimationFrame(frame);
    frame = null;
    levelCallback(0);
  }

  return {
    unlock, enqueue, stop,
    finish() { sealed = true; checkEnded(); },
    onLevel(cb) { levelCallback = cb; },
    onTime(cb) { timeCallback = cb; },
    onEnded(cb) { endedCallback = cb; },
  };
}
