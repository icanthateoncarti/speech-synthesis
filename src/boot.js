// Démarrage de la page, hors du HTML pour que la CSP n'autorise aucun script en ligne.
import "./share-location.js";
import { mountPlastic } from "./shader.js";
import { isOwner } from "./usage.js";

mountPlastic(document.getElementById("plastic"), { reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches });

if ("serviceWorker" in navigator && (location.hostname === "speechsynthe.si" || location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
}

// Cloudflare Web Analytics : pages vues sans cookie, jamais le texte tapé. Uniquement en production, hors appareils de Jonas.
if (location.hostname === "speechsynthe.si" && !isOwner()) {
  const beacon = document.createElement("script");
  beacon.defer = true;
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = '{"token": "510ca793cd2d4401b410e4ede7f66bac"}';
  document.body.append(beacon);
}
