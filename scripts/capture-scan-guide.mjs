// Capture réelle du guide « PDF scanné à voix haute » : un petit cours fictif de 3 pages, rendu en images
// (aucun texte sélectionnable), importé dans la radio sur un écran de téléphone simulé (390 × 844), puis reconnu.
// Ne lit aucun document utilisateur ; nécessite npm run build, Chrome et l'accès à jsDelivr (moteur de reconnaissance).
// Affiche ce que le guide affirme : messages de l'écran de relecture, texte reconnu, touches après validation.
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch, ROOT } from "../tests/e2e/harness.mjs";

const PAGES = [
  ["Chapitre 3 — La photosynthèse",
    "La photosynthèse est le processus par lequel les végétaux chlorophylliens convertissent l'énergie lumineuse en énergie chimique. Elle se déroule dans les chloroplastes, plus précisément dans les thylakoïdes, où se trouvent les pigments capteurs de lumière.",
    "La phase claire produit de l'ATP et du NADPH. La phase obscure, appelée cycle de Calvin, utilise ces deux composés pour fixer le carbone atmosphérique."],
  ["Chapitre 4 — Les mesures du rendement",
    "Une expérience menée sur 48 plants de maïs a donné les résultats suivants : la masse sèche moyenne a augmenté de 12,5 % entre le 14 mars et le 28 avril.",
    "Groupe A : 1 284 cm2. Groupe B : 1 190 cm2. Groupe C : 1 342 cm2. Groupe D : 1 107 cm2."],
  ["Chapitre 5 — Limites et erreurs fréquentes",
    "La première erreur consiste à confondre respiration et photosynthèse : la respiration consomme du dioxygène et du glucose, alors que la photosynthèse les produit.",
    "Il faut aussi distinguer la vitesse de croissance, exprimée en millimètres par jour, de la croissance totale."],
];
const VIEW = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const dir = await mkdtemp(path.join(os.tmpdir(), "guide-scan-"));
const pdf = path.join(dir, "cours-scanne.pdf");
const server = await startServer();
const { browser, page } = await launch({ profile: "tests/e2e/.chrome-profile/scan-guide", viewport: VIEW, reducedMotion: true });
try {
  // 1. Le « scan » : chaque page est une image PNG du texte, sans police ni couche de texte.
  const maker = await browser.newPage();
  await maker.setViewport({ width: 1240, height: 1754 });
  const shots = [];
  for (const [i, [title, ...body]] of PAGES.entries()) {
    await maker.setContent(`<body style="margin:0;padding:120px 110px;font:30px/1.55 Georgia,serif;color:#111;background:#fff"><h1 style="font-size:46px">${title}</h1>${body.map(p => `<p>${p}</p>`).join("")}<p style="font-size:22px;color:#444;margin-top:60px">Cours de biologie — page ${i + 1} sur 3</p></body>`);
    shots.push(Buffer.from(await maker.screenshot({ type: "png" })).toString("base64"));
  }
  await maker.setContent(`<style>@page{size:A4;margin:0}body{margin:0}img{display:block;width:100%;height:296mm;page-break-after:always}img:last-child{page-break-after:auto}</style>${shots.map(b => `<img src="data:image/png;base64,${b}">`).join("")}`, { waitUntil: "load" });
  await writeFile(pdf, await maker.pdf({ format: "A4", preferCSSPageSize: true }));
  await maker.close();

  // 2. Import : l'écran de relecture s'ouvre seul, vide.
  await page.goto(server.url, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.removeItem("radio-last-course"));
  await page.reload({ waitUntil: "networkidle0" });
  await (await page.$("#pdf-input")).uploadFile(pdf);
  await page.waitForSelector("#review-dialog[open]:not([data-entering])");
  const text = (id) => page.$eval(id, el => el.value ?? el.textContent);
  const opened = { feedback: await text("#review-feedback"), chars: (await text("#review-text")).length, applyDisabled: await page.$eval("#review-apply", el => el.disabled) };

  // 3. Le geste : réglages, case des pages scannées, français, Relire le PDF.
  await page.click("#review-settings");
  await page.click("#review-ocr");
  await page.select("#review-lang", "fra");
  const steps = [];
  await page.exposeFunction("step", value => steps.push(value));
  await page.evaluate(() => new MutationObserver(() => window.step(document.querySelector("#review-feedback").textContent)).observe(document.querySelector("#review-feedback"), { childList: true, characterData: true, subtree: true }));
  const started = Date.now();
  await page.click("#review-extract");
  await page.waitForFunction(() => document.querySelector("#review-feedback").textContent.startsWith("Nouveau texte") || document.querySelector("#review-feedback").textContent.startsWith("Lecture impossible"), { timeout: 180000 });
  const seconds = Math.round((Date.now() - started) / 100) / 10;
  await page.evaluate(() => { document.querySelector("#review-text").scrollTop = 0; return document.fonts.ready; });
  await page.screenshot({ path: ROOT + "/assets/guides/relecture-scan.jpg", type: "jpeg", quality: 82, clip: { x: 0, y: 0, width: 390, height: 844 } });
  const recognized = await text("#review-text");

  // 4. Validation : ce qui reste dans la radio.
  await page.click("#review-apply");
  await page.waitForFunction(() => !document.querySelector("#review-dialog").open && document.querySelector("#screen").value.length > 0);
  const after = await page.evaluate(() => ({
    label: document.querySelector("#document-label")?.textContent.trim(),
    pages: !document.querySelector("#pages-open").hidden, nettoyer: !document.querySelector("#cleanup-open").hidden,
    chapters: [...document.querySelectorAll("#chapter option")].map(o => o.textContent),
  }));
  console.log(JSON.stringify({ opened, steps: [...new Set(steps)], seconds, recognized, after }, null, 1));
} finally { await browser.close(); await server.close(); }
