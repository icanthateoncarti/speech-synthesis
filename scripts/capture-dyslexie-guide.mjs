// Capture réelle du guide « outil de lecture dyslexie » : le cours d'exemple en cours de lecture, mot surligné.
// Ne lit aucun document utilisateur ; nécessite npm run build et Chrome.
// Vérifie aussi ce que le guide affirme : un seul mot surligné, et plus de surlignage en pause.
import { startServer, launch, ROOT } from "../tests/e2e/harness.mjs";

const server = await startServer();
const { browser, page } = await launch({ profile: "tests/e2e/.chrome-profile/dyslexie-guide", viewport: { width: 1100, height: 850 }, reducedMotion: true });
try {
  await page.goto(server.url, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.removeItem("radio-last-course"));
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await (await page.$("#pdf-input")).uploadFile(ROOT + "/assets/guides/cours-exemple-moyenne-mediane.pdf");
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("La médiane"), { timeout: 30000 });
  await page.click("#key-speak");
  // Attendre quelques mots après le début, pour que le mot surligné soit au milieu d'une phrase.
  await page.waitForFunction(() => [...document.querySelectorAll(".reader .w")].findIndex((w) => w.classList.contains("now")) >= 12, { timeout: 180000 });
  const playing = await page.evaluate(() => ({ highlighted: document.querySelectorAll(".reader .w.now").length, word: document.querySelector(".reader .w.now")?.textContent, readerHidden: document.querySelector(".reader").hidden }));
  await page.evaluate(() => document.fonts.ready);
  const box = await page.$eval(".machine", (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 850 - r.y) }; });
  await page.screenshot({ path: ROOT + "/assets/guides/radio-mot-surligne.jpg", type: "jpeg", quality: 82, clip: box });
  await page.click("#key-speak");
  await page.waitForFunction(() => document.querySelector("#key-speak").textContent.includes("REPRENDRE"), { timeout: 10000 });
  const paused = await page.evaluate(() => ({ readerHidden: document.querySelector(".reader").hidden, screenVisible: document.querySelector("#screen").style.visibility !== "hidden" }));
  console.log(JSON.stringify({ playing, paused, box }, null, 1));
} finally { await browser.close(); await server.close(); }
