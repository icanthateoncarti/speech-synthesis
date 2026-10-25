import { test } from "node:test";
import assert from "node:assert/strict";
import { spokenText, spokenWords } from "../../src/spoken.js";
import { wordTimeline } from "../../src/text.js";

test("l'exemple de Jonas : parenthèses, guillemets et flèche annoncés à l'ouverture", () => {
  assert.equal(spokenText('Le résultat (en %) est "bon" → validé.'),
    "Le résultat, entre parenthèses, en %, est, entre guillemets, bon, flèche vers la droite, validé.");
});

test("guillemets français, crochets et flèches de toutes formes", () => {
  assert.equal(spokenText("Il dit « Message » puis [note]."), "Il dit, entre guillemets, Message, puis, entre crochets, note.");
  assert.equal(spokenText("Donnée brute → Information → Action"), "Donnée brute, flèche vers la droite, Information, flèche vers la droite, Action");
  assert.equal(spokenText("A->B, C<-D, E⇒F, haut ↑ bas ↓, ↔"),
    "A, flèche vers la droite, B, C, flèche vers la gauche, D, E, flèche vers la droite, F, haut, flèche vers le haut, bas, flèche vers le bas, flèche dans les deux sens");
});

test("&, années et 1er/1ère deviennent des mots ; le texte ordinaire ne change pas", () => {
  assert.equal(spokenText("R&D et Data & Storytelling"), "R et D et Data et Storytelling");
  assert.equal(spokenText("EPHEC 1ère e-Business 2025/2026, le 1er cours."), "EPHEC première e-Business 2025, 2026, le premier cours.");
  const plain = "Bonjour, l'apprentissage d'aujourd'hui : 3 étapes ! Le mot(s) reste.";
  assert.equal(spokenText(plain), plain);
});

test("guillemets droits : ouverture puis fermeture, même séparés du mot", () => {
  assert.equal(spokenText('Le mot " test " puis "fin".'), "Le mot, entre guillemets, test, puis, entre guillemets, fin.");
});

test("une forme parlée par mot affiché, pour minuter le surlignage", () => {
  const words = ["Données", "→", "(info)", "»"];
  const spoken = spokenWords(words);
  assert.equal(spoken.length, words.length);
  assert.equal(spoken[3], ",");
  const timeline = wordTimeline(["Données → (info) »"], [10]);
  const arrow = timeline[1].end - timeline[1].start;
  const word = timeline[0].end - timeline[0].start;
  assert.ok(arrow > word, "la flèche dure le temps de « flèche vers la droite »");
  assert.ok(timeline[3].end - timeline[3].start < 0.2, "un guillemet fermant ne prend presque pas de temps");
});
