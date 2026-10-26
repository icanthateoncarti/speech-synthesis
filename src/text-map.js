import { normalizeText } from "./text.js";

const SPACE = /[^\S\n]/u;

// normalizeText avec la correspondance des positions : map[i] est la position,
// dans le texte nettoyé, du caractère i du texte brut (un caractère supprimé
// pointe vers le suivant conservé ; map[raw.length] = longueur du texte nettoyé).
// Le nettoyage ne fait que supprimer des caractères ou remplacer des espaces par
// un seul : un parcours glouton des deux textes suffit à les aligner.
export function normalizeWithMap(raw) {
  const source = String(raw);
  const text = normalizeText(source);
  const map = new Int32Array(source.length + 1);
  let j = 0;
  for (let i = 0; i < source.length; i++) {
    map[i] = j;
    let c = source[i];
    if (c === "\r") c = source[i + 1] === "\n" ? "" : "\n";
    if (j < text.length && (c === text[j] || (SPACE.test(c) && text[j] === " "))) j++;
  }
  map[source.length] = text.length;
  return { text, map };
}
