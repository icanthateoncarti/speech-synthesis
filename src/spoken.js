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
  // Gestion, supply chain et pilotage (cours EPHEC, 2026-10-26).
  team: "tim", inventory: "inn-veun-tori", warehouse: "ouère-haouz", purchasing: "peur-tché-sinng",
  delivery: "di-liv-ri", sourcing: "sor-sinng", forecasting: "for-kas-tinng", flow: "flo",
  cashflow: "cache-flo", wholesale: "hol-séle", strategy: "stra-té-dji", process: "pro-sèss",
  quality: "koua-li-ti", lean: "linne", backlog: "bak-log", milestone: "maïle-stonn",
  planning: "pla-ninng", network: "nète-oueurque",
  // Informatique, data et finance (2026-10-26).
  server: "sèr-veur", software: "soft-ouère", query: "koui-ri", feature: "fi-tcheur",
  release: "ri-lisse", repository: "ri-po-zi-tori", branch: "brantche", library: "laï-bre-ri",
  training: "tré-ninng", accuracy: "a-kiou-ra-si", churn: "tcheurne", advertising: "ad-veur-taï-zinng",
  copywriting: "ko-pi-raï-tinng", funding: "feun-dinng", founder: "fone-deur", equity: "ékoui-ti",
  deal: "dile", board: "borde",
  // Monde du travail et sécurité informatique (2026-10-26).
  shareholder: "chère-hol-deur", risk: "risque", liability: "la-y-a-bi-li-ti", workshop: "oueurque-chope",
  work: "oueurque", teamwork: "tim-oueurque", skills: "skilz", firewall: "faïeur-ouol",
  backup: "bak-eup", upgrade: "eupe-grède", download: "daoune-lode", upload: "eupe-lode",
  login: "loguine", account: "a-kaoune", password: "passe-oueurde", phishing: "fi-sinng",
  ransomware: "ran-some-ouère", fork: "forque",
  // Marketing, RH et formation (2026-10-26).
  push: "pouche", onboarding: "onne-bordinng", offboarding: "ofe-bordinng",
  recruiting: "ri-krou-tinng", hiring: "haïeurinng", positioning: "po-zi-sio-ninng",
  merchandising: "meur-tchan-dai-zinng", packaging: "pa-ké-djinng", "e-learning": "i-leur-ninng",
  "e-book": "i-bouk", webinar: "ouèbe-i-nar", streaming: "stri-minng", community: "keu-myou-ni-ti",
  copy: "kopi", reel: "rile", blogging: "blo-guinng",
  // Mots anglais lus à la française, session 2 (2026-10-26), lot 1.
  supply: "seu-plaï", chain: "tchène", project: "pro-djèkt", user: "youzeur",
  customer: "keusse-teu-meur", journey: "djeur-ni", supplier: "seu-plaï-eur",
  procurement: "pro-kiou-meurt", logistics: "lo-djisse-tik", transportation: "trasse-por-té-cheune",
  demand: "di-mad", revenue: "re-ve-niou", margin: "mar-djine", operations: "o-pé-ré-cheune",
  value: "va-lou", deployment: "di-ploï-meurte",
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
    if (/[\uE000-\uF8FF]/u.test(word)) {
      word = word.replace(/[\uE000-\uF8FF]/gu, "");
      if (!word) return ",";
    }
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
    // Lignes de formulaire et puces décoratives : une pause, jamais l'épellation.
    // « ... » exact reste une ponctuation ; les nombres (3.5, 1.2.3) et les
    // abréviations (p., etc.) ne forment pas de suite de trois caractères.
    word = word.replace(/[-_.…·•─=*]{3,}/gu, (run) => run === "..." ? run : ",");
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
