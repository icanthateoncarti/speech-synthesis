// Capture du premier écran (1340×900) pour comparer à l'œil avec la maquette.
// Usage : node tests/e2e/screenshot.mjs [sortie.png]   (défaut : /tmp/machine.png)
import { startServer, launch } from "./harness.mjs";

const out = process.argv[2] ?? "/tmp/machine.png";
const server = await startServer();
const { browser, page } = await launch({ viewport: { width: 1340, height: 900 } });
try {
  await page.goto(`${server.url}/`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector("#plastic canvas, #plastic.no-webgl", { timeout: 20_000 });
  await new Promise((r) => setTimeout(r, 1500)); // laisse le grain se peindre
  await page.screenshot({ path: out });
  console.log(out);
} finally {
  await browser.close();
  await server.close();
}
