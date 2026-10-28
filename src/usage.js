// Compteur d'usage anonyme : un nom d'événement, jamais le texte, le fichier, sa taille ni un identifiant.
// Sans cookie, uniquement en production, et un échec réseau ne gêne jamais la machine.
import { SHARE_API } from "./share-config.js";

const sent = new Set();
export function countUsage(event, { once = false } = {}) {
  if (location.hostname !== "speechsynthe.si" || (once && sent.has(event))) return;
  sent.add(event);
  fetch(SHARE_API + "/events", { method: "POST", body: event, keepalive: true, credentials: "omit", headers: { "Content-Type": "text/plain" } }).catch(() => {});
}
