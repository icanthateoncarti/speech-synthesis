// Démarrage de la page, hors du HTML pour que la CSP n'autorise aucun script en ligne.
import "./share-location.js";
import { mountPlastic } from "./shader.js";
import { startAnalytics } from "./usage.js";

mountPlastic(document.getElementById("plastic"), { reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches });

// Rechargement fait par isolateOnFirstVisit() : la page vue est déjà comptée.
const ISOLATION_RELOAD = "radio-isolation";
let isolationReload = false;
try {
  isolationReload = sessionStorage.getItem(ISOLATION_RELOAD) === "1";
  sessionStorage.removeItem(ISOLATION_RELOAD);
} catch {}

if ("serviceWorker" in navigator && (location.hostname === "speechsynthe.si" || location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
  const firstVisit = !navigator.serviceWorker.controller;
  navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
  if (firstVisit && !globalThis.crossOriginIsolated && !isolationReload) isolateOnFirstVisit();
}

if (!isolationReload) startAnalytics();

// Le service worker isole la page (voir src/offline-worker.js), ce qui permet de calculer
// la voix sur plusieurs cœurs. À la toute première visite, la page s'est ouverte sans lui :
// elle se recharge une fois dès qu'il est actif, seulement si la personne n'a encore rien fait.
function isolateOnFirstVisit() {
  let touched = false;
  const touch = () => { touched = true; };
  for (const type of ["pointerdown", "keydown", "drop", "paste"]) addEventListener(type, touch, { capture: true, once: true });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (touched || document.hidden) return;
    // Sans mémoire de session, pas de garde-fou contre une boucle : on ne recharge pas.
    try { sessionStorage.setItem(ISOLATION_RELOAD, "1"); } catch { return; }
    location.reload();
  }, { once: true });
}
