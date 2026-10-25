// Génère assets/og.png (1200×630) : la machine avec un texte d'exemple.
// Usage : node tests/e2e/og-image.mjs
import path from "node:path";
import { startServer, launch, ROOT } from "./harness.mjs";

const server = await startServer();
const { browser, page } = await launch({ viewport: { width: 1200, height: 630 } });
try {
  await page.goto(`${server.url}/`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector("#plastic canvas, #plastic.no-webgl", { timeout: 20_000 });
  // Le visuel de partage reste à l'arrêt ; aucun téléchargement de voix n'est nécessaire.
  await page.$eval("#screen", (el) => { el.value = "Bonjour ! Colle ton texte, choisis une voix, et la machine te le lit. Gratuit, en français, directement dans ton navigateur."; });
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ROOT, "assets/og.png"), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log("assets/og.png");
} finally {
  await browser.close();
  await server.close();
}
