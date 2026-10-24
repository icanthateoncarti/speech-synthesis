import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, audioKey, reduce, statusLine } from "../../src/machine.js";

test("état initial : Jessica, 1.0×, PRÊT", () => {
  assert.deepEqual(statusLine(initialState()), { left: "PRÊT", right: "VOIX : JESSICA · VITESSE 1.0×" });
});
test("PARLE sur écran vide ou emojis → ÉCRAN VIDE", () => {
  for (const text of ["", "   ", "🙂 !!"]) {
    const s = reduce(reduce(initialState(), { type: "TEXT_CHANGED", text }), { type: "SPEAK_PRESSED" });
    assert.equal(statusLine(s).left, "ÉCRAN VIDE");
  }
});
test("progression du téléchargement", () => {
  assert.equal(statusLine(reduce(initialState(), { type: "DOWNLOAD_PROGRESS", pct: 42 })).left, "CHARGEMENT VOIX 42 %");
});
test("changer voix, vitesse ou texte invalide l'audio", () => {
  let s = reduce(initialState(), { type: "TEXT_CHANGED", text: "Bonjour." });
  s = reduce(s, { type: "AUDIO_READY", key: audioKey(s), wav: new ArrayBuffer(8) });
  assert.ok(s.audio);
  for (const ev of [{ type: "VOICE_CHANGED", voice: "tom" }, { type: "SPEED_CHANGED", speed: 1.2 }, { type: "TEXT_CHANGED", text: "Salut." }]) {
    assert.equal(reduce(s, ev).audio, null);
  }
});
test("un audio arrivé en retard pour une autre clé est ignoré", () => {
  let s = reduce(initialState(), { type: "TEXT_CHANGED", text: "Bonjour." });
  const oldKey = audioKey(s);
  s = reduce(s, { type: "VOICE_CHANGED", voice: "tom" });
  assert.equal(reduce(s, { type: "AUDIO_READY", key: oldKey, wav: new ArrayBuffer(8) }).audio, null);
});
test("PARLE pendant la lecture arrête", () => {
  const s = reduce({ ...initialState(), text: "Bonjour.", phase: "playing" }, { type: "SPEAK_PRESSED" });
  assert.equal(s.phase, "idle");
});
test("erreurs et avis", () => {
  assert.equal(statusLine(reduce(initialState(), { type: "ERROR", kind: "network" })).left, "ERREUR RÉSEAU · RÉESSAIE");
  const s = reduce({ ...initialState(), text: "Gardé." }, { type: "PDF_EMPTY" });
  assert.equal(statusLine(s).left, "PDF SANS TEXTE"); assert.equal(s.text, "Gardé.");
});
test("vitesse et voix dans la partie droite", () => {
  let s = reduce(initialState(), { type: "VOICE_CHANGED", voice: "tom" });
  s = reduce(s, { type: "SPEED_CHANGED", speed: 1.2 });
  assert.equal(statusLine(s).right, "VOIX : TOM · VITESSE 1.2×");
});
test("MP3 prêt", () => {
  let s = reduce(initialState(), { type: "TEXT_CHANGED", text: "Bonjour." });
  s = reduce(s, { type: "AUDIO_READY", key: audioKey(s), wav: new ArrayBuffer(8) });
  s = reduce(s, { type: "MP3_READY", key: audioKey(s), mp3: new Uint8Array(4) });
  assert.equal(statusLine(s).left, "✓ MP3 PRÊT");
});
test("un événement d'action efface erreur et avis", () => {
  let s = reduce(initialState(), { type: "ERROR", kind: "other" });
  s = reduce(s, { type: "SYNTH_STARTED" });
  assert.equal(s.error, null);
  assert.equal(statusLine(s).left, "SYNTHÈSE…");
});
