// Budgets d'import (audit de sécurité du 2026-10-25, S02) : un fichier piégé ne
// doit ni saturer la mémoire ni figer l'onglet. Larges pour de vrais cours :
// 2 millions de caractères ≈ 1 000 pages ≈ 40 heures d'audio.
export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_TEXT_CHARS = 2_000_000;
export const MAX_PAGES = 5_000;
export const MAX_ZIP_ENTRIES = 10_000;
// Un fichier XML de diapo pèse quelques dizaines de Ko ; la décompression est
// comptée octet par octet, sans se fier à la taille annoncée dans l'archive.
export const MAX_XML_ENTRY_BYTES = 8 * 1024 * 1024;
export const MAX_XML_TOTAL_BYTES = 200 * 1024 * 1024;

export function tooLarge(message) {
  return Object.assign(new Error(message), { name: "TooLargeError" });
}

export function throwIfAborted(signal) {
  if (signal?.aborted) throw Object.assign(new Error("import annulé"), { name: "AbortError" });
}
