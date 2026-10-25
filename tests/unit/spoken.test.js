import { test } from "node:test";
import assert from "node:assert/strict";
import { spokenText, spokenWords } from "../../src/spoken.js";
import { wordTimeline, splitIntoParts, splitIntoChunks, titlePauses, isTitleLine } from "../../src/text.js";
import { encodeWav, padWav, wavDuration } from "../../src/audio.js";

test("l'exemple de Jonas : parenthèses et guillemets annoncés, la flèche se dit « vers »", () => {
  assert.equal(spokenText('Le résultat (en %) est "bon" → validé.'),
    "Le résultat, entre parenthèses, en %, est, entre guillemets, bon, vers validé.");
  assert.equal(spokenText("Donnée brute → Information → Message → Action"), "Donnée brute vers Information vers Message vers Action");
});

test("guillemets français, crochets et autres flèches", () => {
  assert.equal(spokenText("Il dit « Message » puis [note]."), "Il dit, entre guillemets, Message, puis, entre crochets, note.");
  assert.equal(spokenText("A->B, C<-D, E⇒F, haut ↑ bas ↓, ↔"),
    "A vers B, C, flèche vers la gauche, D, E vers F, haut, flèche vers le haut, bas, flèche vers le bas, flèche dans les deux sens");
});

test("&, années et 1er/1ère deviennent des mots ; le texte ordinaire ne change pas", () => {
  assert.equal(spokenText("R&D et Data & Storytelling"), "R et D et Data et stori-tèlinng");
  assert.equal(spokenText("EPHEC 1ère e-Business 2025/2026, le 1er cours."), "EPHEC première i-biznèss 2025, 2026, le premier cours.");
  const plain = "Bonjour, l'apprentissage d'aujourd'hui : 3 étapes ! Le mot(s) reste.";
  assert.equal(spokenText(plain), plain);
});

test("sigles épelés, sauf ceux qu'on dit comme un mot, les chiffres romains et les titres en capitales", () => {
  assert.equal(spokenText("Les KPIs et le ROI du CEO, en UX."), "Les K P I et le R O I du C E O, en U X.");
  assert.equal(spokenText("L'ONU et l'OTAN, chapitre IV."), "L'ONU et l'OTAN, chapitre IV.");
  assert.equal(spokenText("LE FIL ROUGE DU COURS"), "LE FIL ROUGE DU COURS");
});

test("mots anglais réécrits pour la voix française, pluriels et majuscules compris", () => {
  assert.equal(spokenText("Un dashboard, des Dashboards et le Marketing."), "Un dache-borde, des dache-borde et le markétinng.");
  assert.equal(spokenText("Data Mining et feedback"), "Data maïninng et fide-bak");
});

test("guillemets droits : ouverture puis fermeture, même séparés du mot", () => {
  assert.equal(spokenText('Le mot " test " puis "fin".'), "Le mot, entre guillemets, test, puis, entre guillemets, fin.");
});

test("une forme parlée par mot affiché, pour minuter le surlignage", () => {
  const words = ["Données", "⇔", "(info)", "»"];
  const spoken = spokenWords(words);
  assert.equal(spoken.length, words.length);
  assert.equal(spoken[3], ",");
  const timeline = wordTimeline(["Données ⇔ (info) »"], [10]);
  const arrow = timeline[1].end - timeline[1].start;
  const word = timeline[0].end - timeline[0].start;
  assert.ok(arrow > word, "la flèche dure le temps de « flèche dans les deux sens »");
  assert.ok(timeline[3].end - timeline[3].start < 0.2, "un guillemet fermant ne prend presque pas de temps");
});

test("titres : ligne courte sans ponctuation finale, une seconde avant et après", () => {
  assert.equal(isTitleLine("Cours 6 — Du besoin métier au graphique"), true);
  assert.equal(isTitleLine("Les 3 piliers reviennent à chaque séance :"), false);
  assert.equal(isTitleLine("- un élément de liste"), false);
  assert.equal(isTitleLine("Une phrase complète."), false);
  const text = "Le fil rouge du cours\nTout le cours répond à une seule logique. Transformer la donnée.\nCours 6\nDu besoin métier\nFin du texte.";
  const parts = splitIntoParts(text);
  assert.deepEqual(parts.map((p) => p.title), [true, false, false, true, true, false]);
  assert.deepEqual(splitIntoChunks(text), parts.map((p) => p.text));
  assert.deepEqual(titlePauses(parts), [
    { before: 0, after: 1 }, { before: 0, after: 0 }, { before: 0, after: 0 },
    { before: 1, after: 0 }, { before: 0, after: 1 }, { before: 0, after: 0 },
  ]);
  assert.deepEqual(titlePauses(splitIntoParts("Bonjour le monde")), [{ before: 0, after: 0 }], "un texte d'une ligne n'a pas de pause");
});

test("padWav ajoute le silence autour du son", () => {
  const wav = encodeWav(new Int16Array(22050).fill(1000), 22050);
  const padded = padWav(wav, 1, 1);
  assert.ok(Math.abs(wavDuration(padded) - 3) < 1e-6);
  assert.equal(padWav(wav, 0, 0), wav);
});
