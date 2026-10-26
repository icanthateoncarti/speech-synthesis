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

test("mots de gestion et de supply chain réécrits pour la voix française", () => {
  assert.equal(spokenText("Le team vérifie l'inventory, le process et la quality du planning."),
    "Le tim vérifie l'inn-veun-tori, le pro-sèss et la koua-li-ti du plan-ninng.");
  assert.equal(spokenText("Le warehouse, le sourcing et le forecasting suivent le cashflow."),
    "Le ouère-haouz, le sor-sinng et le for-kas-tinng suivent le cache-flo.");
});

test("mots d'informatique, de data et de finance réécrits pour la voix française", () => {
  assert.equal(spokenText("Une query sur le repository, une feature et une release."),
    "Une koui-ri sur le ri-po-zi-tori, une fi-tcheur et une ri-lisse.");
  assert.equal(spokenText("Le training améliore l'accuracy et réduit le churn."),
    "Le tré-ninng améliore l'a-kiou-ra-si et réduit le tcheurne.");
});

test("mots du travail et de la sécurité informatique réécrits pour la voix française", () => {
  assert.equal(spokenText("Le workshop sur le teamwork demande des skills et un backup."),
    "Le oueurque-chope sur le tim-oueurque demande des skilz et un bak-eup.");
  assert.equal(spokenText("Le password, le login et le firewall protègent le server."),
    "Le passe-oueurde, le loguine et le faïeur-ouol protègent le sèr-veur.");
  assert.equal(spokenText("Un account permet le download et l'upgrade."),
    "Un a-kaoune permet le daoune-lode et l'eupe-grède.");
});

test("mots de marketing, de RH et de formation réécrits pour la voix française", () => {
  assert.equal(spokenText("Le webinar et l'e-book complètent le e-learning."),
    "Le ouèbe-i-nar et l'i-bouk complètent le i-leur-ninng.");
  assert.equal(spokenText("Le recruiting, le hiring et l'onboarding précèdent l'offboarding."),
    "Le ri-krou-tinng, le haïeurinng et l'onne-bordinng précèdent l'ofe-bordinng.");
  assert.equal(spokenText("Le packaging et le merchandising servent la community."),
    "Le pa-ké-djinng et le meur-tchan-dai-zinng servent la keu-myou-ni-ti.");
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

test("phrases inventées : parenthèses, guillemets, flèches, sigles et années", () => {
  assert.equal(spokenText("La réunion (à 14 h) commence après le café."),
    "La réunion, entre parenthèses, à 14 h, commence après le café.");
  assert.equal(spokenText("Le prix « indicatif » sera confirmé lundi."),
    "Le prix, entre guillemets, indicatif, sera confirmé lundi.");
  assert.equal(spokenText("Objectif → plan → action."), "Objectif vers plan vers action.");
  assert.equal(spokenText("Le KPI du mois est en hausse."), "Le K P I du mois est en hausse.");
  assert.equal(spokenText("En 2024/2025, le budget a doublé."), "En 2024, 2025, le budget a doublé.");
  assert.equal(spokenText("Le 1er avril, on fête le printemps."), "Le premier avril, on fête le printemps.");
  assert.equal(spokenText("La 1ère étape est la plus simple."), "La première étape est la plus simple.");
  assert.equal(spokenText("Le sigle ONU et le sigle SNCF."), "Le sigle ONU et le sigle S N C F.");
  assert.equal(spokenText("Le BO du cours mentionne l’UE."), "Le B O du cours mentionne l’U E.");
  assert.equal(spokenText("Le taux est de 3,5 % (environ)."), "Le taux est de 3,5 %, entre parenthèses, environ.");
  assert.equal(spokenText("Le chapitre IV et le chapitre 12."), "Le chapitre IV et le chapitre 12.");
  assert.equal(spokenText("Le signe ↑ indique la hausse."), "Le signe, flèche vers le haut, indique la hausse.");
  assert.equal(spokenText("La flèche ↔ signifie les deux sens."), "La flèche, flèche dans les deux sens, signifie les deux sens.");
  assert.equal(spokenText("Le mot « test » (sans accent) et [une note]."),
    "Le mot, entre guillemets, test, entre parenthèses, sans accent, et, entre crochets, une note.");
  assert.equal(spokenText("La plage 2020-2021 (fermée) → 2022."),
    "La plage 2020-2021, entre parenthèses, fermée, vers 2022.");
});

test("langue : vingt phrases françaises et vingt phrases anglaises inventées", async () => {
  const { detectLanguage } = await import("../../src/text.js");
  const french = [
    "Le chat dort sur la table du salon.",
    "Nous préparons le dîner pour les invités de ce soir.",
    "La bibliothèque ferme ses portes à dix-huit heures.",
    "Il faut arroser les plantes une fois par semaine.",
    "Le train de sept heures arrive avec du retard.",
    "Elle écrit une lettre à sa grand-mère.",
    "Les enfants jouent dans le jardin après l'école.",
    "Ce film raconte l'histoire d'une famille ordinaire.",
    "Le boulanger prépare le pain avant le lever du soleil.",
    "Nous avons marché jusqu'au sommet malgré la pluie.",
    "La réunion est reportée à la semaine prochaine.",
    "Il cherche ses clés dans toute la maison.",
    "Le musée présente une collection de peintures anciennes.",
    "Vous pouvez garer la voiture derrière la gare.",
    "La soupe est trop chaude pour être mangée tout de suite.",
    "Les oiseaux chantent dès que le jour se lève.",
    "Mon voisin répare sa bicyclette dans la cour.",
    "Cette décision a changé le cours de notre voyage.",
    "Le marché du samedi attire beaucoup de monde.",
    "Elle apprend le piano depuis trois ans.",
  ];
  const english = [
    "The cat sleeps on the table in the living room.",
    "We are preparing dinner for the guests tonight.",
    "The library closes its doors at six in the evening.",
    "You should water the plants in the garden once a week.",
    "The train is running late this evening.",
    "She writes a letter to her grandmother and waits for an answer.",
    "The children play in the garden and the dog sleeps.",
    "This film tells the story of an ordinary family.",
    "The baker makes bread in the morning before the sun rises.",
    "We walked to the top despite the rain.",
    "The meeting is postponed to next week.",
    "He is looking for his keys all over the house.",
    "The museum shows a collection of old paintings from the region.",
    "You can park the car behind the station.",
    "The soup is too hot to eat right away.",
    "The birds sing in the morning.",
    "My neighbor repairs the bicycle in the yard with the children.",
    "This decision changed the course of our trip.",
    "The Saturday market attracts a lot of people from the city.",
    "She has been learning the piano for three years.",
  ];
  for (const text of french) assert.equal(detectLanguage(text), "fr", text);
  for (const text of english) assert.equal(detectLanguage(text), "en", text);
});

test("langue : cas limites, anglais dans une phrase française et titres seuls", async () => {
  const { detectLanguage } = await import("../../src/text.js");
  assert.equal(detectLanguage("Le marketing, le storytelling et le dashboard sont dans le cloud."), "fr");
  assert.equal(detectLanguage("Le replenishment est le processus de déplacement de l'inventaire."), "fr");
  assert.equal(detectLanguage("The team will review the marketing plan and the budget."), "en");
  assert.equal(detectLanguage("The KPI dashboard is in the cloud."), "en");
  assert.equal(detectLanguage("Replenishment is the process of moving inventory."), "en");
  // À vérifier : un titre anglais sans petit mot fréquent retombe en français.
  assert.equal(detectLanguage("Supply Chain Management"), "fr");
  assert.equal(detectLanguage("Data Marketing Strategy"), "fr");
  // À vérifier : un titre d'un seul mot est trop court pour trancher.
  assert.equal(detectLanguage("The"), "fr");
});

test("langue : un cours en anglais est lu en anglais, un cours français truffé d'anglais reste en français", async () => {
  const { detectLanguage } = await import("../../src/text.js");
  assert.equal(detectLanguage("Replenishment is the process of moving inventory along the supply chain to ensure products are available at the right place."), "en");
  assert.equal(detectLanguage("Le dashboard du cours de Data Mining présente les KPI et le storytelling des données."), "fr");
  assert.equal(detectLanguage("Bonjour"), "fr");
  assert.equal(detectLanguage(""), "fr");
});

test("règles de lecture en anglais : parenthèses, guillemets, flèche, &, sans dictionnaire français", () => {
  assert.equal(spokenText('Demand (forecast) is "key" → stock & orders, the KPI dashboard.', "en"),
    "Demand, in parentheses, forecast, is, in quotes, key, to stock and orders, the K P I dashboard.");
});
