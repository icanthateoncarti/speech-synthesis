// Texte à dire : le convertisseur phonétique (espeak) traite la ponctuation comme
// du rythme. Parenthèses, guillemets et flèches deviendraient des silences ; on les
// annonce en mots. Seule l'ouverture est dite (choix de Jonas du 2026-10-25).
// L'écran garde le texte d'origine : la réécriture se fait mot par mot pour que
// chaque mot affiché connaisse sa part de l'audio.

const ARROWS = [
  [/<->|<=>|[↔⇔⟷⟺]/gu, "flèche dans les deux sens"],
  [/-+>|=+>|[→⇒⟶⟹➔➜➝➞➡]/gu, "flèche vers la droite"],
  [/<-+|<=+|[←⇐⟵⟸⬅]/gu, "flèche vers la gauche"],
  [/[↑⇑⬆]/gu, "flèche vers le haut"],
  [/[↓⇓⬇]/gu, "flèche vers le bas"],
];
const OPENERS = new Map([["(", "entre parenthèses"], ["[", "entre crochets"], ["«", "entre guillemets"], ["“", "entre guillemets"], ["„", "entre guillemets"]]);
const CLOSERS = /[)\]»”]/gu;

function tidy(text) {
  return text.replace(/\s+/g, " ").replace(/\s+,/g, ",")
    .replace(/,(?:\s*,)+/g, ",").replace(/,([.!?…;:])/g, "$1").replace(/^[\s,]+|[\s,]+$/g, "");
}

/** Une forme parlée par mot affiché ; « , » = symbole qui ne donne qu'une pause. */
export function spokenWords(words) {
  let quoted = false;
  return words.map((raw) => {
    let word = raw, prefix = "";
    while (word) {
      const first = word[0];
      if (OPENERS.has(first)) { prefix += `, ${OPENERS.get(first)}, `; word = word.slice(1); }
      else if (first === '"' && !quoted) { quoted = true; prefix += ", entre guillemets, "; word = word.slice(1); }
      else break;
    }
    if (word.includes('"')) { quoted = false; word = word.replaceAll('"', ","); }
    // « mot(s) » : une parenthèse collée au mot reste telle quelle.
    if (!/\p{L}[(\[]/u.test(word)) word = word.replace(CLOSERS, ",");
    for (const [pattern, name] of ARROWS) word = word.replace(pattern, `, ${name}, `);
    word = word.replace(/&/g, " et ")
      .replace(/^(\d{4})\/(\d{4})/u, "$1, $2")
      .replace(/^1(?:er)(?=$|\P{L})/iu, "premier")
      .replace(/^1(?:re|ère|ere)(?=$|\P{L})/iu, "première");
    return (prefix + word).trim();
  });
}

export function spokenText(text) {
  return tidy(spokenWords(text.split(/\s+/).filter(Boolean)).join(" "));
}
