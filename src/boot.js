// Démarrage de la page, hors du HTML pour que la CSP n'autorise aucun script en ligne.
import { mountPlastic } from "./shader.js";

mountPlastic(document.getElementById("plastic"), { reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches });

// Cloudflare Web Analytics : pages vues sans cookie, jamais le texte tapé. Uniquement en production.
if (location.hostname === "speechsynthe.si") {
  const beacon = document.createElement("script");
  beacon.defer = true;
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = '{"token": "510ca793cd2d4401b410e4ede7f66bac"}';
  document.body.append(beacon);
}
