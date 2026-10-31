// Démarrage de la page, hors du HTML pour que la CSP n'autorise aucun script en ligne.
import "./share-location.js";
import { mountPlastic } from "./shader.js";
import { startAnalytics } from "./usage.js";

mountPlastic(document.getElementById("plastic"), { reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches });

if ("serviceWorker" in navigator && (location.hostname === "speechsynthe.si" || location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
}

startAnalytics();
