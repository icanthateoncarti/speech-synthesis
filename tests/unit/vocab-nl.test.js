import { test } from "node:test";
import assert from "node:assert/strict";
import { hasDutch, languageSegments } from "../../src/text.js";

const lexique = `aantekening, de mv: de aantekeningen ; la note.
blokken (blokte – heeft geblokt) ; étudier beaucoup, bûcher.
blokperiode, de ; le blocus.
academiejaar, het ; l’année académique.
Mag ik je aantekeningen van de laatste les rechten bekijken?
buitenland, het ; l’étranger.`;

test("un lexique néerlandais–français est reconnu, un texte français non", () => {
  assert.equal(hasDutch(lexique), true);
  assert.equal(hasDutch("Le cours de droit commence à huit heures. Les étudiants prennent des notes dans l’auditoire."), false);
});

test("chaque moitié de ligne reçoit sa langue", () => {
  assert.deepEqual(languageSegments("blokken (blokte – heeft geblokt) ; étudier beaucoup, bûcher."),
    [{ text: "blokken (blokte – heeft geblokt)", lang: "nl" }, { text: "étudier beaucoup, bûcher.", lang: "fr" }]);
  assert.deepEqual(languageSegments("buizen (buisde – is gebuisd) (Vl.) ; péter, recaler."),
    [{ text: "buizen (buisde – is gebuisd) (Vl.)", lang: "nl" }, { text: "péter, recaler.", lang: "fr" }]);
  assert.deepEqual(languageSegments("academiejaar, het ; l’année académique."),
    [{ text: "academiejaar, het", lang: "nl" }, { text: "l’année académique.", lang: "fr" }]);
  assert.deepEqual(languageSegments("bachelor, de ; le bachelier."),
    [{ text: "bachelor, de", lang: "nl" }, { text: "le bachelier.", lang: "fr" }]);
  assert.deepEqual(languageSegments("Mag ik je aantekeningen van de laatste les rechten bekijken?"),
    [{ text: "Mag ik je aantekeningen van de laatste les rechten bekijken?", lang: "nl" }]);
  assert.deepEqual(languageSegments("de hond - le chien"), [{ text: "de hond", lang: "nl" }, { text: "le chien", lang: "fr" }]);
});
