// Annonces des mises à jour majeures : un fichier annonces/AAAA-MM-JJ-sujet.md
// par mise à jour qui change la façon d'utiliser l'outil, contenant le tweet
// exact à poster (en anglais). Voir AGENTS.md.

const LINK = /https?:\/\/\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:si|com|org|net|io|fr|be|app|dev)(?:\/\S*)?/giu;
const WIDE = /\p{Extended_Pictographic}/u;

/** Longueur comptée comme X : un lien vaut 23 caractères, un emoji 2. */
export function tweetLength(text) {
  let n = 0;
  for (const char of String(text).trim().replace(LINK, "x".repeat(23))) n += WIDE.test(char) ? 2 : 1;
  return n;
}

export const ANNOUNCEMENT_FILE = /^annonces\/\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
