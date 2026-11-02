// Capture réelle du guide « PDF à voix haute sur téléphone » : le cours d'exemple importé dans la radio,
// sur un écran de téléphone simulé (390 × 844). Ne lit aucun document utilisateur ; nécessite npm run build et Chrome.
// Affiche aussi ce que le guide affirme : touches visibles au premier écran, PAGES, NETTOYER, export MP3.
import { mkdtemp, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch, ROOT } from "../tests/e2e/harness.mjs";

const VIEW = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const server = await startServer();
const { browser, page } = await launch({ profile: "tests/e2e/.chrome-profile/telephone-guide", viewport: VIEW, reducedMotion: true });
const downloads = await mkdtemp(path.join(os.tmpdir(), "guide-telephone-"));
try {
  const cdp = await page.createCDPSession();
  await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
  await page.goto(server.url, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.removeItem("radio-last-course"));
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  const onScreen = (id) => page.$eval(id, (el) => { const r = el.getBoundingClientRect(); return !el.hidden && r.height > 0 && r.bottom <= innerHeight; });
  const firstScreen = { importer: await onScreen("#key-pdf"), parle: await onScreen("#key-speak"), mp3: await onScreen("#key-mp3") };
  await (await page.$("#pdf-input")).uploadFile(ROOT + "/assets/guides/cours-exemple-moyenne-mediane.pdf");
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("La médiane"), { timeout: 30000 });
  const imported = { pages: !(await page.$eval("#pages-open", (el) => el.hidden)), nettoyer: !(await page.$eval("#cleanup-open", (el) => el.hidden)), mp3: await onScreen("#key-mp3"), parle: await onScreen("#key-speak") };
  await page.click("#cleanup-open");
  await page.waitForSelector('#cleanup-open[aria-pressed="true"]');
  await page.evaluate(() => { window.scrollTo(0, 0); return document.fonts.ready; });
  await page.screenshot({ path: ROOT + "/assets/guides/radio-telephone.jpg", type: "jpeg", quality: 82, clip: { x: 0, y: 48, width: 390, height: 700 } });
  // Export MP3 du cours d'exemple (2 pages) : le fichier arrive-t-il, et sous quel nom ?
  const started = Date.now();
  await page.click("#key-mp3");
  let file = null;
  while (!file && Date.now() - started < 240000) {
    const done = (await readdir(downloads)).filter((name) => name.endsWith(".mp3"));
    if (done.length) file = done[0];
    else await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const size = file ? (await stat(path.join(downloads, file))).size : 0;
  console.log(JSON.stringify({ firstScreen, imported, export: { file, size, seconds: Math.round((Date.now() - started) / 1000) } }, null, 1));
} finally { await browser.close(); await server.close(); }
