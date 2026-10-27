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
  // Mots anglais lus à la française, session 2 (2026-10-26), lot 2.
  campaign: "kem-pène", funnel: "feu-nèle", brand: "brènde", investor: "ine-vesse-teur",
  unicorn: "you-ni-corne", merger: "meur-djeur", governance: "go-veur-nasse",
  insurance: "ine-chou-rasse", consumer: "ko-sou-meur", vendor: "vèn-deur",
  username: "you-zeur-nème", venture: "vène-tcheur", manufacturer: "ma-niou-fak-teur",
  distributor: "disse-tri-biou-teur", purchaser: "peur-tché-seur",
  merchandiser: "meur-tcheune-dai-zeur",
  // Mots anglais relevés dans les cours français, session 3 (2026-10-27).
  online: "onne-laïne", computer: "keum-piou-teur", study: "steu-di",
  moodle: "mou-deul", missing: "missinng",
}));

// Mots français rencontrés dans les cours anglais : réécrits en graphie anglaise
// pour que la voix anglaise approche les sons français. Chaque forme a été
// vérifiée dans le phonémiseur anglais ; quand aucun son anglais ne correspond
// exactement, la graphie la plus proche est gardée. Les mots que les anglophones
// disent déjà à l'anglaise (Paris, Belgium, café, résumé…) restent volontairement
// hors de ce dictionnaire, comme ceux qui sont aussi des mots anglais (temps,
// travail).
const LEXICON_EN = new Map(Object.entries({
  "à": "ah", "développer": "day-vlaw-pay", "être": "et", "prévisible": "pray-vee-zee-bull",
  "dépasser": "day-pah-say", "tâche": "tahsh", "projet": "praw-zhay",
  "passé": "pah-say", "problème": "praw-blem", "défi": "day-fee", "étape": "eh-tahp",
  "objectif": "ob-zhek-teef", "objectifs": "ob-zhek-teef", "résoudre": "ray-zood",
  "achevée": "ahsh-vay", "décision": "day-see-zhon",
  "donné": "daw-nay", "échéance": "eh-shay-ahns", "partie": "par-tee",
  "gérer": "zheh-ray", "élaborer": "eh-lah-bo-ray", "réaliser": "ray-ah-lee-zay",
  "améliorer": "ah-mel-yaw-ray", "contrôler": "kon-troh-lay", "entreprise": "ahn-trer-preez",
  "récompense": "ray-kom-pahns", "adaptée": "ah-dahp-tay", "ans": "awn",
  "budgétaires": "bood-zhay-tair", "compétences": "kom-pay-tahns", "créer": "kray-eh",
  "établir": "eh-tah-bleer", "défendez": "day-fahn-day", "définir": "day-fee-neer",
  "délai": "day-leh", "délais": "day-leh", "déroulée": "day-roo-lay",
  "dérouler": "day-roo-lay", "durée": "dew-ray",
  "enquête": "ahn-ket", "êtes": "et", "intérêts": "ahn-tay-ray", "méthode": "may-tawd",
  "paramètres": "pa-ra-metr", "réponse": "ray-pawns", "représentez": "ruh-pray-zahn-tay",
  "utilisé": "ew-tee-lee-zay", "améliorations": "ah-mel-yaw-rah-syohn",
  "antérieur": "ahn-tay-ree-ur", "aperçu": "ah-pair-sue", "après": "ah-pray",
  "compétence": "kom-pay-tahns", "comptabilité": "kon-tah-bee-lee-tay", "déjà": "day-zhah",
  "demande": "de-mahnd", "développé": "day-vlaw-pay", "diplôme": "dee-plohm",
  "façon": "fah-sawn", "général": "zheh-neh-rahl", "générale": "zheh-neh-rahl",
  "échéancier": "eh-shay-ahn-see-eh", "expérience": "ek-spay-ree-ahns", "extra-légal": "ek-strah-lay-gahl",
  "gestion": "zhest-yon", "intrinsèque": "an-tran-sek", "manière": "mah-nee-air",
  "motivé": "maw-tee-vay", "opérationnels": "aw-peh-rah-syo-nel",
  "réalisable": "ray-ah-lee-zah-bull", "réalisation": "ray-ah-lee-zah-syohn",
  "règlement": "reh-gluh-mahn", "rémunération": "ray-mew-nay-rah-syohn", "terminé": "ter-mee-nay",
  "qualité": "kah-lee-tay", "propriétaire": "pro-pree-eh-tair", "capacité": "kah-pah-see-tay",
  "présent": "preh-zahn", "activité": "ahk-tee-vee-tay", "année": "ah-nay",
  "bien-être": "byan-et-ruh",
  "développe": "day-vlawp", "développement": "day-vlawp-mahn",
  // Mots français des cours anglais, session 6 (2026-10-27), lot 1.
  "accès": "ahk-seh", "acquérir": "ah-kay-reer", "adopté": "ah-dawp-tay", "agréable": "ah-gray-ah-bull",
  "américain": "ah-may-ree-kan", "antérieure": "ahn-tay-ree-ur", "assisté": "ah-siss-tay", "associée": "ah-soh-say",
  "atténuer": "ah-tay-nway", "autorisé": "oh-toh-ree-zay", "basé": "bah-zay",
  "bâton": "bah-tawn", "célèbre": "say-leb-r", "chaîne": "shen", "chargé": "shar-zhay",
  "chronométrer": "kroh-noh-may-tray", "commencé": "koh-mahn-say",
  // Mots français des cours anglais, session 6 (2026-10-27), lot 2.
  "complète": "kom-plet", "complètement": "kom-plet-mahn", "comptabilisés": "kon-tah-bee-lee-zay", "confronté": "kon-frawn-tay",
  "conseil": "kon-sell", "cours": "koor", "éthique": "eh-teek", "évolution": "eh-voh-lew-syon",
  "dégouliner": "day-goo-lee-nay", "déléguer": "day-lay-gay", "délivrable": "day-lee-vrah-bull", "délocaliser": "day-loh-kah-lee-zay",
  "dépassé": "day-pah-say", "désir": "day-zeer", "dirigé": "dee-ree-zhay", "échange": "eh-shahnzh",
  "échelons": "eh-shlon", "écologique": "eh-koh-loh-zheek", "économique": "eh-koh-noh-meek", "élégance": "eh-lay-gahns",
  // Mots français des cours anglais, session 6 (2026-10-27), lot 3.
  "éloignée": "eh-loo-ah-nay", "employés": "ahn-ploo-ah-yay", "entêté": "ahn-tet-tay", "épuiser": "eh-poo-ee-zay",
  "équipe": "eh-keep", "équitable": "eh-kee-tah-bull", "ères": "air", "état": "eh-tah",
  "étudiants": "eh-tew-dyahn", "évènement": "eh-ven-mahn", "évident": "eh-vee-dahn", "éviter": "eh-vee-tay",
  "évoluer": "eh-voh-loo-eh", "exercice": "egg-zair-seess", "extrinsèque": "ek-stran-sek", "famille": "fah-mee",
  "fêtes": "fet", "figuré": "fee-goo-ray", "financière": "fee-nahn-see-air", "financières": "fee-nahn-see-air",
  // Mots français des cours anglais, session 6 (2026-10-27), lot 4.
  "français": "frahn-say", "gérant": "zhay-rahn", "géré": "zhay-ray", "hiérarchique": "yay-rar-sheek",
  "horaire": "oh-rair", "hypothèse": "ee-poh-tez", "idée": "ee-day", "idées": "ee-day",
  "inadéquation": "ee-nah-day-kwah-syon", "indiquée": "an-dee-kay", "intérêt": "ahn-tay-ray", "inventée": "an-vahn-tay",
  "irrégulières": "ee-ray-goo-lee-air", "isolée": "ee-zoh-lay", "juvénile": "zhoo-vay-neel", "éloge": "eh-lohzh",
  "exécution": "egg-zay-kew-syon", "lancé": "lahn-say", "maîtrise": "may-treez", "mathématiques": "mah-tay-mah-teek",
  // Mots français des cours anglais, session 7 (2026-10-27), lot 1.
  "matières": "mah-tee-air", "mémoire": "mem-wahr", "méthodologie": "may-toh-doh-loh-zhee", "néerlandais": "nay-air-lahn-day",
  "nouveau": "noo-voh", "obsolète": "ob-soh-let", "opportunités": "aw-por-tew-nee-tay", "payé": "peh-yay",
  "période": "pay-ree-ohd", "pièces": "pee-yes", "plaît": "pleh", "planifié": "plah-nee-fee-yay",
  "première": "pruh-mee-air", "prénom": "pray-nohm", "prévisions": "pray-vee-zhon", "prévu": "pray-vew",
  "puéril": "pew-air-eel", "réalisé": "ray-ah-lee-zay", "récompenser": "ray-kom-pahn-say", "rédige": "ray-deezh",
}));

// Pluriel anglais dont le singulier est une entrée française : « parties » ne
// doit pas devenir « par-tee ».
const ENGLISH_KEEP = new Set(["parties"]);

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
  if (lang === "en") {
    const lower = token.toLocaleLowerCase("en");
    if (ENGLISH_KEEP.has(lower)) return token;
    const withoutS = lower.endsWith("s") ? lower.slice(0, -1) : undefined;
    // Féminin : « basée » se dit comme « basé », « développées » comme « développé ».
    const masculine = lower.endsWith("ées") ? lower.slice(0, -2) : lower.endsWith("ée") ? lower.slice(0, -1) : undefined;
    return LEXICON_EN.get(lower)
      ?? (withoutS === undefined ? undefined : LEXICON_EN.get(withoutS))
      ?? (masculine === undefined ? undefined : LEXICON_EN.get(masculine))
      ?? token;
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

// Symboles et abréviations que la voix ignore ou lit à l'anglaise. Les formes
// ambiguës (« ex. », « h. », « ~ ») restent telles quelles : voir le journal.
function replaceMarks(word, next, lang) {
  const french = lang === "fr";
  const numberNext = /^\d/u.test(next ?? "");
  word = word.replace(/[nN][°º]/gu, french ? "numéro " : " number ")
    // « versusse » donne /vɛʁsys/ à la voix française ; « versus » y perd le s.
    .replace(/(?<![\p{L}\p{N}])vs\.?(?![\p{L}\p{N}])/giu, french ? "versusse" : "versus")
    .replace(/(?<![\p{L}\p{N}])e\.g\./giu, french ? "par exemple" : "for example");
  if (french) {
    word = word.replace(/§{2,}/gu, "paragraphes").replace(/§/gu, "paragraphe")
      .replace(/≠/gu, " différent de ")
      // « | » sépare des colonnes : une pause, pas « barre verticale » à chaque case.
      .replace(/\|/gu, ",");
  } else {
    word = word.replace(/\|/gu, ",")
      .replace(/(?<![\p{L}\p{N}])km(?![\p{L}\p{N}])/giu, "kilometers");
  }
  if ((word === "p." || word === "pp.") && numberNext) word = word === "p." ? "page" : "pages";
  word = word.replace(/(?<![\p{L}\p{N}])p\.(?=\d)/giu, "page ")
    .replace(/(?<![\p{L}\p{N}])pp\.(?=\d)/giu, "pages ")
    .replace(/#(?=\d)/gu, french ? "numéro " : " number ");
  if (word === "#" && numberNext) word = french ? "numéro" : "number";
  return word;
}

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
    word = replaceMarks(word, words[k + 1], lang);
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
