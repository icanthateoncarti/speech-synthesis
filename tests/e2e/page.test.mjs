import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";
import { initialState, statusLine } from "../../src/machine.js";

const TITLE = "Texte en audio gratuit — écoute tes textes, PDF et PowerPoint";
const VIEWPORT = { width: 1340, height: 900 };

// Textes autorisés au premier écran (Global Constraints) : logotype, sérigraphie,
// libellés des commandes et ligne d'état initiale.
const { left, right } = statusLine(initialState());
const ALLOWED = new Set([
  "speechsynthe.si", "speech", "synthe.si", "Texte en audio",
  "MES COURS", "▶ PARLE", "⬇ MP3", "↑", "IMPORTER", "PDF · PPTX", "EFFACE", "JESSICA", "TOM", "VITESSE",
  left, right,
]);

let server, browser, page;

before(async () => {
  server = await startServer();
  ({ browser, page } = await launch({ viewport: VIEWPORT }));
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function open(p = page) {
  await p.goto(`${server.url}/`, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
}

test("premier écran : seulement la machine", async () => {
  await open();
  assert.equal(await page.title(), TITLE);

  const h1 = await page.$$eval("h1", (els) => els.map((e) => ({
    text: e.textContent.trim(),
    visible: e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== "hidden",
  })));
  assert.equal(h1.length, 1, "un seul <h1>");
  assert.equal(h1[0].text, "Texte en audio");
  assert.ok(h1[0].visible, "le <h1> est visible");

  const { texts, pseudo } = await page.evaluate(({ w, h }) => {
    const visibleEl = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
      }
      return true;
    };
    const inView = (r) => r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < w && r.top < h;
    const texts = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.nodeValue.replace(/\s+/g, " ").trim();
      if (!t || !visibleEl(n.parentElement)) continue;
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(n.parentElement.tagName)) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      if ([...range.getClientRects()].some(inView)) texts.push(t);
    }
    // Aucun texte caché dans un ::before / ::after.
    const pseudo = [];
    for (const el of document.querySelector(".room").querySelectorAll("*")) {
      for (const which of ["::before", "::after"]) {
        const c = getComputedStyle(el, which).content;
        if (c && c !== "none" && c !== "normal" && c !== '""') pseudo.push(`${el.tagName}${which} ${c}`);
      }
    }
    return { texts, pseudo };
  }, { w: VIEWPORT.width, h: VIEWPORT.height });

  assert.ok(texts.length > 0, "des textes visibles sont trouvés");
  const intrus = texts.filter((t) => !ALLOWED.has(t));
  assert.deepEqual(intrus, [], `textes non autorisés au premier écran : ${JSON.stringify(intrus)}`);
  assert.deepEqual(pseudo, [], "pas de texte en pseudo-élément");
  for (const must of ["speechsynthe.si", "▶ PARLE", "⬇ MP3", "IMPORTER", "PDF · PPTX", "EFFACE", "JESSICA", "TOM", "VITESSE", left, right]) {
    assert.ok(texts.includes(must), `« ${must} » est visible`);
  }

  // Écran : un vrai textarea, sans placeholder, étiqueté.
  const screen = await page.$eval("#screen", (el) => ({
    tag: el.tagName, placeholder: (el.getAttribute("placeholder") ?? "").trim(), label: el.getAttribute("aria-label"), value: el.value,
  }));
  // Placeholder éventuel invisible (une espace, pour :placeholder-shown) : aucun texte affiché.
  assert.deepEqual(screen, { tag: "TEXTAREA", placeholder: "", label: "Texte à lire", value: "" });
  assert.equal(await page.$eval("#status-left", (el) => el.textContent), left);
  assert.equal(await page.$eval("#status-right", (el) => el.textContent), right);
});

test("sélecteurs figés de la machine", async () => {
  await open();
  const r = await page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    const reader = $("#reader");
    return {
      keys: ["#key-speak", "#key-mp3", "#key-pdf", "#key-clear"].map((s) => $(s)?.tagName),
      pdf: { type: $("#pdf-input")?.type, accept: $("#pdf-input")?.accept, hidden: $("#pdf-input")?.hidden },
      voice: $("#voice")?.getAttribute("role"),
      radios: ["#voice-jessica", "#voice-tom"].map((s) => [$(s)?.getAttribute("role"), $(s)?.getAttribute("aria-checked"), $("#voice")?.contains($(s))]),
      speed: ["type", "min", "max", "step", "value"].map((a) => $("#speed")?.getAttribute(a)),
      reader: reader ? { tag: reader.tagName, shown: getComputedStyle(reader).display !== "none" } : null,
      importmap: JSON.parse(document.querySelector('script[type="importmap"]')?.textContent ?? "{}").imports,
    };
  });
  assert.deepEqual(r.keys, ["BUTTON", "BUTTON", "BUTTON", "BUTTON"]);
  assert.deepEqual(r.pdf, { type: "file", accept: "application/pdf,.pdf,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation", hidden: true });
  assert.equal(r.voice, "radiogroup");
  assert.deepEqual(r.radios, [["radio", "true", true], ["radio", "false", true]]);
  assert.deepEqual(r.speed, ["range", "0.7", "1.5", "0.1", "1"]);
  assert.deepEqual(r.reader, { tag: "DIV", shown: false });
  assert.deepEqual(Object.fromEntries(Object.entries(r.importmap).filter(([key]) => !key.startsWith("/src/"))), {
    "@paper-design/shaders": "https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.82/+esm",
    "@breezystack/lamejs": "https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/+esm",
    "pdfjs-dist": "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.min.mjs",
  });
});

test("la grille du haut-parleur et le grain sont présents", async () => {
  await open();
  await page.waitForSelector("#plastic canvas", { timeout: 20_000 });
  const r = await page.evaluate(() => {
    const plastic = document.getElementById("plastic");
    const c = plastic.querySelector("canvas").getBoundingClientRect();
    const m = plastic.closest(".machine").getBoundingClientRect();
    return {
      bars: document.querySelectorAll("#meter > i").length,
      holes: document.querySelectorAll(".grille i").length,
      noWebgl: plastic.classList.contains("no-webgl"),
      covers: c.width >= m.width - 2 && c.height >= m.height - 2,
    };
  });
  assert.equal(r.bars, 12);
  assert.ok(r.holes >= 30, `grille : ${r.holes} trous`);
  assert.equal(r.noWebgl, false);
  assert.ok(r.covers, "le canvas du grain couvre tout le boîtier");
});

test("sans WebGL : repli orange", async () => {
  const p = await browser.newPage();
  try {
    await p.setViewport(VIEWPORT);
    await p.evaluateOnNewDocument(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await open(p);
    await p.waitForSelector("#plastic.no-webgl", { timeout: 20_000 });
    const bg = await p.$eval("#plastic", (el) => getComputedStyle(el).backgroundImage);
    assert.match(bg, /gradient/, "le repli affiche un dégradé orange fixe");
  } finally {
    await p.close();
  }
});

test("empreinte de version : chaque script et style local est demandé avec la version du code actuel", { timeout: 120_000 }, async () => {
  const { computeVersion } = await import("../../scripts/stamp-version.mjs");
  const version = await computeVersion();
  const local = [];
  const watch = (req) => { const url = new URL(req.url()); if (/^\/(src|styles)\/.*\.(js|css)$/.test(url.pathname)) local.push(url.pathname + url.search); };
  page.on("request", watch);
  try {
    await open();
    // Le préchargement de la voix démarre le worker : lui aussi doit être versionné.
    await page.$eval("#screen", (el) => { el.value = "Bonjour."; el.dispatchEvent(new Event("input")); });
    await page.waitForFunction(() => performance.getEntriesByType("resource").some((e) => e.name.includes("tts-worker.js")), { timeout: 30_000 });
  } finally { page.off("request", watch); }
  assert.ok(local.some((u) => u.startsWith("/src/main.js")) && local.some((u) => u.startsWith("/src/tts-worker.js")), local.join(", "));
  const stale = local.filter((u) => !u.endsWith(`?v=${version}`) && !u.startsWith("/src/vendor/"));
  assert.deepEqual(stale, [], "lance node scripts/stamp-version.mjs avant de publier");
});
