// Génère assets/og.png (1200×630) : la machine avec un texte d'exemple.
// Usage : node tests/e2e/og-image.mjs
import path from "node:path";
import { startServer, launch, ROOT } from "./harness.mjs";

const server = await startServer();
const { browser, page } = await launch({ viewport: { width: 1500, height: 900 } });
try {
  await page.goto(`${server.url}/`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector("#plastic canvas, #plastic.no-webgl", { timeout: 20_000 });
  // Le visuel de partage reste à l'arrêt ; aucun téléchargement de voix n'est nécessaire.
  await page.$eval("#screen", (el) => { el.value = "Bonjour ! Colle ton texte, choisis une voix, et la machine te le lit. Gratuit, en français, directement dans ton navigateur."; });
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  // Le nom du site serait coupé par le cadrage ; la machine porte déjà la marque.
  await page.$eval(".top", (el) => { el.style.visibility = "hidden"; });
  await new Promise((r) => setTimeout(r, 1500));
  // Cadrage 1200×630 centré sur la machine, ombre comprise, rendu à l'échelle.
  const box = await page.$eval(".machine", (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  const height = box.height + 90, width = height * 1200 / 630;
  const clip = { x: box.x + box.width / 2 - width / 2, y: box.y - 36, width, height, scale: 1200 / width };
  await page.screenshot({ path: path.join(ROOT, "assets/og.png"), clip });
  console.log("assets/og.png");
} finally {
  await browser.close();
  await server.close();
}
