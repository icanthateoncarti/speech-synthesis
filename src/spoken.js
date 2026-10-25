// Texte à dire : le convertisseur phonétique (espeak) traite la ponctuation comme
// du rythme. Parenthèses, guillemets et flèches deviendraient des silences ; on les
// annonce en mots. Seule l'ouverture est dite (choix de Jonas du 2026-10-25).
// L'écran garde le texte d'origine : la réécriture se fait mot par mot pour que
// chaque mot affiché connaisse sa part de l'audio.

const ARROWS = [
  [/<->|<=>|[↔⇔⟷⟺]/gu, ", flèche dans les deux sens, "],
  // « Donnée brute → Information » se lit « donnée brute vers information » (Jonas, 2026-10-25).
  [/-+>|=+>|[→⇒⟶⟹➔➜➝➞➡]/gu, " vers "],
  [/<-+|<=+|[←⇐⟵⟸⬅]/gu, ", flèche vers la gauche, "],
  [/[↑⇑⬆]/gu, ", flèche vers le haut, "],
  [/[↓⇓⬇]/gu, ", flèche vers le bas, "],
];

// Mots anglais qu'espeak lit avec des sons anglais, inconnus des voix françaises.
// Réécrits comme un francophone les dit ; chaque forme a été vérifiée dans le
// phonémiseur (aucun son anglais : ɑː, ɪ, aɪ, ɜː…). « -inng » donne /iŋ/, connu des deux voix.
const LEXICON = new Map(Object.entries({
  dashboard: "dache-borde", storytelling: "stori-tèlinng", business: "biznèss", "e-business": "i-biznèss",
  marketing: "markétinng", insight: "inn-saïte", feedback: "fide-bak", mining: "maïninng",
  learning: "leurninng", cloud: "claoude", startup: "starte-eup", "start-up": "starte-eup",
  benchmark: "bènche-marque", deadline: "dède-laïne", meeting: "mitinng", leader: "lideur",
  leadership: "lideur-chipe", design: "dizaïne", designer: "dizaïneur", framework: "frèmeweurque",
  workflow: "oueurque-flo", newsletter: "niouze-lèteur", follower: "folo-oueur", growth: "grôsse",
  lead: "lide", branding: "brandinng", brainstorming: "brène-storminng", briefing: "brifinng",
  reporting: "ripor-tinng", tracking: "trakinng", coaching: "kotchinng", coach: "kotche",
  email: "imèle", "e-mail": "imèle", mail: "mèle", live: "laïve", update: "eupe-dète",
  hardware: "hard-ouère", story: "stori", heatmap: "hite-map", website: "ouèbe-saïte", cookie: "kouki",
  power: "paweur", google: "gougueule", facebook: "fèsse-bouk", linkedin: "linkdine",
  shopify: "chopi-faï", deep: "dipe", stakeholder: "stèque-oldeur", input: "inn-poute",
  output: "aoute-poute", targeting: "targuétinng", landing: "landinng", mockup: "mokeupe",
  wireframe: "waïeur-frème", template: "tèmplète",
}));

// Sigles qu'on prononce comme un mot ; les autres sont épelés (KPI → « K P I »).
const ACRONYM_WORDS = new Set(["ONU", "OTAN", "NASA", "OVNI", "SIDA", "ISO", "IKEA", "CAF", "UNIF"]);
const LETTERS = /^\p{Lu}+$/u;
const ROMAN = /^[IVXLCDM]+$/;

function capsWord(raw) {
  const letters = raw?.replace(/[^\p{L}]/gu, "") ?? "";
  return letters.length >= 2 && LETTERS.test(letters);
}

function pronounce(token, previous, next, lang) {
  const acronym = /^(\p{Lu}{2,4})s?$/u.exec(token);
  // Un titre en capitales (« LE FIL ROUGE ») n'est pas une suite de sigles.
  if (acronym && !ROMAN.test(acronym[1]) && !ACRONYM_WORDS.has(acronym[1]) && !capsWord(previous) && !capsWord(next)) {
    return [...acronym[1]].join(" ");
  }
  if (lang !== "fr") return token;
  const lower = token.toLocaleLowerCase("fr");
  return LEXICON.get(lower) ?? (lower.endsWith("s") ? LEXICON.get(lower.slice(0, -1)) : undefined) ?? token;
}

const OPENERS = {
  fr: new Map([["(", "entre parenthèses"], ["[", "entre crochets"], ["«", "entre guillemets"], ["“", "entre guillemets"], ["„", "entre guillemets"], ['"', "entre guillemets"]]),
  en: new Map([["(", "in parentheses"], ["[", "in brackets"], ["«", "in quotes"], ["“", "in quotes"], ["„", "in quotes"], ['"', "in quotes"]]),
};
const ARROWS_EN = [
  [/<->|<=>|[↔⇔⟷⟺]/gu, ", both ways, "],
  [/-+>|=+>|[→⇒⟶⟹➔➜➝➞➡]/gu, " to "],
  [/<-+|<=+|[←⇐⟵⟸⬅]/gu, ", arrow left, "],
  [/[↑⇑⬆]/gu, ", arrow up, "],
  [/[↓⇓⬇]/gu, ", arrow down, "],
];
const CLOSERS = /[)\]»”]/gu;

function tidy(text) {
  return text.replace(/\s+/g, " ").replace(/\s+,/g, ",")
    .replace(/,(?:\s*,)+/g, ",").replace(/,([.!?…;:])/g, "$1").replace(/^[\s,]+|[\s,]+$/g, "");
}

/** Une forme parlée par mot affiché ; « , » = symbole qui ne donne qu'une pause. */
export function spokenWords(words, lang = "fr") {
  const openers = OPENERS[lang] ?? OPENERS.fr;
  const arrows = lang === "en" ? ARROWS_EN : ARROWS;
  let quoted = false;
  return words.map((raw, k) => {
    let word = raw, prefix = "";
    while (word) {
      const first = word[0];
      if (first === '"' && quoted) break;
      if (!openers.has(first)) break;
      if (first === '"') quoted = true;
      prefix += `, ${openers.get(first)}, `;
      word = word.slice(1);
    }
    if (word.includes('"')) { quoted = false; word = word.replaceAll('"', ","); }
    // « mot(s) » : une parenthèse collée au mot reste telle quelle.
    if (!/\p{L}[(\[]/u.test(word)) word = word.replace(CLOSERS, ",");
    for (const [pattern, spoken] of arrows) word = word.replace(pattern, spoken);
    word = word.replace(/\p{L}+(?:-\p{L}+)*/gu, (token) => pronounce(token, words[k - 1], words[k + 1], lang))
      .replace(/&/g, lang === "en" ? " and " : " et ")
      .replace(/^(\d{4})\/(\d{4})/u, "$1, $2");
    if (lang === "fr") {
      word = word.replace(/^1(?:er)(?=$|\P{L})/iu, "premier")
        .replace(/^1(?:re|ère|ere)(?=$|\P{L})/iu, "première");
    }
    return (prefix + word).trim();
  });
}

export function spokenText(text, lang = "fr") {
  return tidy(spokenWords(text.split(/\s+/).filter(Boolean), lang).join(" "));
}
