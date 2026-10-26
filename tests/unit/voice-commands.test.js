import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVoiceCommand, createVoiceCommands } from "../../src/voice-commands.js";

test("les demandes de navigation de Jonas sont reconnues avec chiffres ou mots", () => {
  const cases = [
    ["Attends, attends, reviens 30 secondes en arrière", { type: "relative-time", seconds: -30 }],
    ["Reviens trente secondes en arrière", { type: "relative-time", seconds: -30 }],
    ["Reviens 3 phrases en arrière", { type: "relative-sentence", count: -3 }],
    ["Avance de six phrases", { type: "relative-sentence", count: 6 }],
    ["Avance de 5 minutes", { type: "relative-time", seconds: 300 }],
    ["Avance de cinq minutes", { type: "relative-time", seconds: 300 }],
    ["Reviens au précédent chapitre", { type: "relative-chapter", count: -1 }],
    ["Reviens au chapitre précédent", { type: "relative-chapter", count: -1 }],
    ["Recommence le chapitre", { type: "chapter-start" }],
    ["Reviens au début du chapitre", { type: "chapter-start" }],
    ["Skip jusqu’aux 3 prochains chapitres", { type: "relative-chapter", count: 3 }],
    ["Skip jusqu'aux trois prochains chapitres", { type: "relative-chapter", count: 3 }],
    ["Chapitre suivant", { type: "relative-chapter", count: 1 }],
    ["Phrase précédente", { type: "relative-sentence", count: -1 }],
    ["Recule d'une minute", { type: "relative-time", seconds: -60 }],
    ["Avance de quatre-vingt-dix-neuf secondes", { type: "relative-time", seconds: 99 }],
    ["Avance de septante et une secondes", { type: "relative-time", seconds: 71 }],
    ["Recule de cent vingt secondes", { type: "relative-time", seconds: -120 }],
    ["Avance de mille secondes", { type: "relative-time", seconds: 1000 }],
    ["Pause", { type: "pause" }],
    ["Attends, attends !", { type: "pause" }],
    ["Reprends la lecture", { type: "resume" }],
    ["S'il te plaît, avance de deux phrases, merci", { type: "relative-sentence", count: 2 }],
  ];
  for (const [raw, expected] of cases) assert.deepEqual(parseVoiceCommand(raw), expected, raw);
});

test("cinquante-cinq formulations françaises réalistes sont reconnues telles qu'aujourd'hui", () => {
  const cases = [
    ["recule de deux minutes", { type: "relative-time", seconds: -120 }],
    ["va au chapitre suivant", { type: "relative-chapter", count: 1 }],
    ["reviens 10 secondes en arrière", { type: "relative-time", seconds: -10 }],
    ["avance de trois chapitres", { type: "relative-chapter", count: 3 }],
    ["passe à la phrase suivante", { type: "relative-sentence", count: 1 }],
    ["retourne à la phrase précédente", { type: "relative-sentence", count: -1 }],
    ["remonte de quinze secondes", { type: "relative-time", seconds: -15 }],
    ["saute deux phrases", { type: "relative-sentence", count: 2 }],
    ["skip de cinq minutes", { type: "relative-time", seconds: 300 }],
    ["avance de quatre-vingt-dix secondes", { type: "relative-time", seconds: 90 }],
    ["recule de septante secondes", { type: "relative-time", seconds: -70 }],
    ["avance de nonante-neuf secondes", { type: "relative-time", seconds: 99 }],
    ["recule de cent secondes", { type: "relative-time", seconds: -100 }],
    ["avance de deux cents secondes", { type: "relative-time", seconds: 200 }],
    ["avance de mille cinq cents secondes", { type: "relative-time", seconds: 1500 }],
    ["mets en pause", { type: "pause" }],
    ["arrête la lecture", { type: "pause" }],
    ["continue la lecture", { type: "resume" }],
    ["lecture", { type: "resume" }],
    ["recommence ce chapitre", { type: "chapter-start" }],
    ["retourne au début du chapitre", { type: "chapter-start" }],
    ["reviens en début de chapitre", { type: "chapter-start" }],
    ["va au chapitre précédent", { type: "relative-chapter", count: -1 }],
    ["passe au chapitre suivant", { type: "relative-chapter", count: 1 }],
    ["va à la phrase précédente", { type: "relative-sentence", count: -1 }],
    ["passe à la phrase suivante", { type: "relative-sentence", count: 1 }],
    ["reviens au chapitre précédent", { type: "relative-chapter", count: -1 }],
    ["retourne au chapitre suivant", { type: "relative-chapter", count: 1 }],
    ["s'il te plaît, recule de trente secondes", { type: "relative-time", seconds: -30 }],
    ["avance de dix secondes, merci", { type: "relative-time", seconds: 10 }],
    ["attends, attends, avance de cinq phrases", { type: "relative-sentence", count: 5 }],
    ["stop, recule de deux phrases", { type: "relative-sentence", count: -2 }],
    ["recule de quatre-vingt-dix-neuf secondes", { type: "relative-time", seconds: -99 }],
    ["avance de soixante et onze secondes", { type: "relative-time", seconds: 71 }],
    ["recule de trois cents secondes", { type: "relative-time", seconds: -300 }],
    ["avance d'une minute", { type: "relative-time", seconds: 60 }],
    ["recule de deux heures", { type: "relative-time", seconds: -7200 }],
    ["avance de 24 heures", { type: "relative-time", seconds: 86400 }],
    ["s'il te plaît avance de deux phrases", { type: "relative-sentence", count: 2 }],
    ["avance de deux phrases s'il te plaît", { type: "relative-sentence", count: 2 }],
    ["recule de dix secondes merci", { type: "relative-time", seconds: -10 }],
    ["recule deux minutes", { type: "relative-time", seconds: -120 }],
    ["avance cinq minutes", { type: "relative-time", seconds: 300 }],
    ["recule de 1 minute", { type: "relative-time", seconds: -60 }],
    ["avance de 1 phrase", { type: "relative-sentence", count: 1 }],
    ["recule de 1 chapitre", { type: "relative-chapter", count: -1 }],
    ["skip jusqu'aux trois prochains chapitres", { type: "relative-chapter", count: 3 }],
    ["recule de deux chapitres", { type: "relative-chapter", count: -2 }],
    ["avance de quatre phrases", { type: "relative-sentence", count: 4 }],
    ["reviens de dix secondes", { type: "relative-time", seconds: -10 }],
    ["recule de cinq phrases", { type: "relative-sentence", count: -5 }],
    ["passe deux chapitres", { type: "relative-chapter", count: 2 }],
    ["saute trois chapitres", { type: "relative-chapter", count: 3 }],
    ["reviens à la phrase précédente", { type: "relative-sentence", count: -1 }],
    ["retourne deux phrases en arrière", { type: "relative-sentence", count: -2 }],
  ];
  for (const [raw, expected] of cases) assert.deepEqual(parseVoiceCommand(raw), expected, raw);
});

test("les tournures naturelles comprises au fil de la session 2", () => {
  const cases = [
    ["merci, recule de dix secondes", { type: "relative-time", seconds: -10 }],
    ["je voudrais reculer de deux minutes", { type: "relative-time", seconds: -120 }],
    ["peux-tu reculer de deux minutes", { type: "relative-time", seconds: -120 }],
    ["tu peux avancer de cinq minutes", { type: "relative-time", seconds: 300 }],
    ["reculer de deux minutes", { type: "relative-time", seconds: -120 }],
    ["avancer de deux minutes", { type: "relative-time", seconds: 120 }],
  ];
  for (const [raw, expected] of cases) assert.deepEqual(parseVoiceCommand(raw), expected, raw);
});

test("formulations naturelles encore non comprises : comportement actuel verrouillé", () => {
  // À vérifier : ces tournures naturelles ne sont pas reconnues aujourd'hui.
  // Le test fige le comportement actuel ; le journal les liste pour Jonas.
  for (const text of [
    "recule de 2 min",
    "avance de 30 s",
    "reviens 30s en arrière",
    "avance de 0,5 minute",
    "recule d'un quart d'heure",
    "avance d'une minute et demie",
    "recule de 2 minutes 30",
    "va 2 chapitres plus loin",
    "avance jusqu'au chapitre suivant",
  ]) assert.equal(parseVoiceCommand(text), null, text);
});

test("le texte ordinaire et les demandes ambiguës ne déclenchent pas de navigation", () => {
  for (const text of [
    "", "Le chapitre précédent explique les cinq minutes de pause.",
    "Je voudrais avancer dans ma lecture.", "Je voudrais un café.",
    "Avance de deux trois secondes",
    "Avance de -30 secondes", "Reviens de moins trente secondes", "Avance de zéro phrase",
    "Avance de trois phrases en arrière", "Reviens de trois minutes en avant",
    "Avance de 99999999999999999999 secondes", "Avance de cent heures", "Reviens au chapitre trois",
  ]) assert.equal(parseVoiceCommand(text), null, text);
});

function fakeRecognition({ status = "available", installed = true, installPromise, localProperty = true, acceptLocal = true } = {}) {
  const calls = { available: [], install: [], started: 0, stopped: 0, aborted: 0, instances: [] };
  class Recognition {
    static async available(options) { calls.available.push(options); return status; }
    static async install(options) { calls.install.push(options); return installPromise ?? installed; }
    constructor() {
      calls.instances.push(this);
      if (localProperty) {
        if (acceptLocal) this.processLocally = false;
        else Object.defineProperty(this, "processLocally", { get: () => false, set: () => {} });
      }
    }
    start() { calls.started++; this.onstart?.(); }
    abort() { calls.aborted++; queueMicrotask(() => this.onend?.()); }
    stop() { calls.stopped++; queueMicrotask(() => this.onend?.()); }
    result(transcripts, isFinal = true) {
      const result = transcripts.map((transcript) => ({ transcript }));
      result.isFinal = isFinal;
      this.onresult?.({ resultIndex: 0, results: [result] });
    }
    error(error) { this.onerror?.({ error }); this.onend?.(); }
  }
  return { Recognition, calls };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("une capture exige le traitement local, ne garde qu'une commande et ferme le micro", async () => {
  const { Recognition, calls } = fakeRecognition();
  const commands = [], states = [];
  const voice = createVoiceCommands({ recognitionConstructor: Recognition, secureContext: true,
    onCommand: (command) => commands.push(command), onState: (state) => states.push(state) });
  try {
    assert.equal(voice.supported(), true);
    assert.equal(await voice.start(), true);
    const active = calls.instances.at(-1);
    assert.equal(active.processLocally, true);
    assert.equal(active.lang, "fr-FR");
    assert.equal(active.continuous, false);
    assert.equal(active.interimResults, false);
    assert.deepEqual(calls.available, [{ langs: ["fr-FR"], processLocally: true }]);
    active.result(["un résultat hésitant"], false);
    assert.deepEqual(commands, []);
    active.result(["un résultat hésitant", "avance de cinq minutes"]);
    active.result(["reviens trente secondes"]);
    await tick();
    assert.deepEqual(commands, [{ type: "relative-time", seconds: 300 }]);
    assert.equal(calls.aborted, 1);
    assert.equal(calls.started, 1);
    assert.equal(voice.getState(), "idle");
    assert.ok(states.includes("listening"));
  } finally { voice.dispose(); }
});

test("une API historique ou une page non sécurisée n'ouvre jamais le micro", async () => {
  for (const options of [{ localProperty: false }, {}]) {
    const { Recognition, calls } = fakeRecognition(options);
    const errors = [];
    const voice = createVoiceCommands({ recognitionConstructor: Recognition, secureContext: options.localProperty === false,
      onError: (error) => errors.push(error.code) });
    assert.equal(voice.supported(), false);
    assert.equal(await voice.start(), false);
    assert.equal(calls.started, 0);
    assert.deepEqual(errors, ["unsupported"]);
    voice.dispose();
  }
});

test("un navigateur qui refuse processLocally=true n'a aucun repli distant", async () => {
  const { Recognition, calls } = fakeRecognition({ acceptLocal: false });
  const errors = [];
  const voice = createVoiceCommands({ recognitionConstructor: Recognition, secureContext: true, onError: (error) => errors.push(error.code) });
  try {
    assert.equal(await voice.start(), false);
    assert.equal(calls.started, 0);
    assert.deepEqual(errors, ["start"]);
  } finally { voice.dispose(); }
});

test("le pack français s'installe au premier clic sans ouvrir le micro", async () => {
  const { Recognition, calls } = fakeRecognition({ status: "downloadable" });
  const states = [];
  const voice = createVoiceCommands({ recognitionConstructor: Recognition, secureContext: true, onState: (state) => states.push(state) });
  try {
    assert.equal(await voice.start(), false);
    assert.deepEqual(calls.install, [{ langs: ["fr-FR"] }]);
    assert.equal(calls.started, 0);
    assert.equal(voice.getState(), "ready");
    assert.equal(await voice.start(), true);
    assert.equal(calls.started, 1);
    assert.ok(states.includes("downloading"));
  } finally { voice.dispose(); }
});

test("la simple vérification d'un pack à télécharger ne bloque pas la préparation", async () => {
  const { Recognition, calls } = fakeRecognition({ status: "downloadable" });
  const voice = createVoiceCommands({ recognitionConstructor: Recognition, secureContext: true });
  try {
    assert.equal(await voice.availability(), "downloadable");
    assert.equal(await voice.prepare(), "available");
    assert.equal(calls.install.length, 1);
    assert.equal(calls.started, 0);
  } finally { voice.dispose(); }
});

test("un français local indisponible garde les commandes écrites sans capture", async () => {
  const { Recognition, calls } = fakeRecognition({ status: "unavailable" });
  const errors = [];
  const voice = createVoiceCommands({ recognitionConstructor: Recognition, secureContext: true, onError: (error) => errors.push(error.code) });
  try {
    assert.equal(await voice.start(), false);
    assert.equal(calls.started, 0);
    assert.equal(calls.install.length, 0);
    assert.deepEqual(errors, ["language-unavailable"]);
  } finally { voice.dispose(); }
});

test("annuler une installation empêche toute activation tardive du microphone", async () => {
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  const { Recognition, calls } = fakeRecognition({ status: "downloadable", installPromise: promise });
  const states = [];
  const voice = createVoiceCommands({ recognitionConstructor: Recognition, secureContext: true, onState: (state) => states.push(state) });
  const starting = voice.start();
  while (!calls.install.length) await tick();
  voice.stop();
  release(true);
  assert.equal(await starting, false);
  assert.equal(calls.started, 0);
  assert.equal(voice.getState(), "idle");
  assert.notEqual(states.at(-1), "ready");
  voice.dispose();
});

test("annuler une capture ignore un résultat tardif ; les refus ne redémarrent rien", async () => {
  const { Recognition, calls } = fakeRecognition();
  const commands = [], errors = [];
  const voice = createVoiceCommands({ recognitionConstructor: Recognition, secureContext: true,
    onCommand: (command) => commands.push(command), onError: (error) => errors.push(error.code) });
  try {
    assert.equal(await voice.start(), true);
    const first = calls.instances.at(-1);
    voice.stop();
    first.result(["avance de six phrases"]);
    await tick();
    assert.deepEqual(commands, []);
    assert.equal(await voice.start(), true);
    calls.instances.at(-1).error("not-allowed");
    assert.deepEqual(errors, ["not-allowed"]);
    assert.equal(calls.started, 2);
    assert.equal(voice.getState(), "idle");
  } finally { voice.dispose(); }
});

test("une capture silencieuse est bornée dans le temps", async () => {
  const { Recognition, calls } = fakeRecognition();
  const errors = [];
  const voice = createVoiceCommands({ recognitionConstructor: Recognition, secureContext: true,
    captureTimeout: 5, onError: (error) => errors.push(error.code) });
  try {
    assert.equal(await voice.start(), true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(calls.stopped, 1);
    assert.deepEqual(errors, ["no-speech"]);
    assert.equal(voice.getState(), "idle");
  } finally { voice.dispose(); }
});
