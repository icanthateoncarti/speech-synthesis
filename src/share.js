import { SHARE_API } from "./share-config.js";
import { sealSession, unsealSession, base64url, bounded, parseSharedFragment } from "./share-crypto.js";
const STORAGE = "radio-created-shares";
function endpoint() { if (!SHARE_API) throw new Error("Le service de partage n’est pas encore activé."); return SHARE_API + "/sessions"; }
export function createdShares() { try { return JSON.parse(localStorage.getItem(STORAGE) || "[]").filter(item => item.expires > Date.now()).slice(-100); } catch { return []; } }
function saveList(list) { localStorage.setItem(STORAGE, JSON.stringify(list)); }
function failure(response) { return new Error(response.status === 429 ? "Trop de demandes. Réessaie plus tard." : response.status === 404 ? "Ce lien a expiré ou a été supprimé." : "Partage indisponible. Réessaie plus tard."); }
export async function createShare(data, signal) {
  const url = endpoint(), list = createdShares();
  // Vérifier le stockage avant l'envoi : le moyen de suppression doit rester accessible.
  saveList(list);
  const sealed = await sealSession(data), deletion = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(deletion))), b => b.toString(16).padStart(2, "0")).join("");
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/octet-stream", "X-Delete-Hash": hash }, body: sealed.body, signal, referrerPolicy: "no-referrer", credentials: "omit" });
  if (!response.ok) throw failure(response);
  const value = await response.json();
  if (!/^[A-Za-z0-9_-]{22}$/.test(value.id) || !Number.isFinite(value.expires)) throw new Error("Réponse de partage invalide.");
  const link = `${location.origin}/#session=${value.id}.${sealed.key}`;
  const entry = { ...value, deletion, name: data.name, link };
  try { saveList([...list, entry]); }
  catch { await deleteShare(entry).catch(() => {}); throw new Error("Impossible de conserver le moyen de suppression sur cet appareil."); }
  return entry;
}
export async function receiveShare(fragment, signal) {
  const { id, key } = parseSharedFragment(fragment);
  const response = await fetch(endpoint() + "/" + id, { signal, referrerPolicy: "no-referrer", credentials: "omit" });
  if (!response.ok) throw failure(response);
  const body = await bounded(response.body, 512 * 1024);
  return unsealSession(body.buffer, key);
}
export async function deleteShare(entry) {
  const response = await fetch(endpoint() + "/" + entry.id, { method: "DELETE", headers: { Authorization: "Bearer " + entry.deletion }, referrerPolicy: "no-referrer", credentials: "omit" });
  if (!response.ok && response.status !== 404) throw failure(response);
  saveList(createdShares().filter(value => value.id !== entry.id));
}
