// Compteur d'usage anonyme : un nom d'événement, jamais le texte, le fichier, sa taille ni un identifiant.
// Sans cookie, uniquement en production, et un échec réseau ne gêne jamais la machine.
import { SHARE_API } from "./share-config.js";

// Les appareils de Jonas : ouvrir une fois /?moi coupe les compteurs sur cet appareil, /?moi=0 les remet.
const OWNER_KEY = "radio-moi";
function takeOwnerFlag() {
  if (typeof location === "undefined") return null;
  const params = new URLSearchParams(location.search);
  if (!params.has("moi")) return null;
  const on = params.get("moi") !== "0";
  try { on ? localStorage.setItem(OWNER_KEY, "1") : localStorage.removeItem(OWNER_KEY); } catch {}
  params.delete("moi");
  const search = params.toString();
  history.replaceState(null, "", location.pathname + (search ? "?" + search : "") + location.hash);
  return on ? "on" : "off";
}
export const ownerChange = takeOwnerFlag();
export function isOwner() {
  try { return localStorage.getItem(OWNER_KEY) === "1"; } catch { return false; }
}

// Cloudflare Web Analytics : pages vues sans cookie, jamais le texte tapé. Uniquement en production, hors appareils de Jonas.
export function startAnalytics() {
  if (location.hostname !== "speechsynthe.si" || isOwner()) return;
  const beacon = document.createElement("script");
  beacon.defer = true;
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = '{"token": "510ca793cd2d4401b410e4ede7f66bac"}';
  document.body.append(beacon);
}

const sent = new Set();
export function countUsage(event, { once = false } = {}) {
  if (location.hostname !== "speechsynthe.si" || isOwner() || (once && sent.has(event))) return;
  sent.add(event);
  fetch(SHARE_API + "/events", { method: "POST", body: event, keepalive: true, credentials: "omit", headers: { "Content-Type": "text/plain" } }).catch(() => {});
}
