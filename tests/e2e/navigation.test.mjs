import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";

const TEXT = [
  "Chapitre 1 : Le départ",
  "Le camp se réveille tôt. Les tentes sont humides. On allume le feu avant le petit déjeuner. Chacun prépare son sac.",
  "Chapitre 2 : La marche",
  "La route monte dans la forêt. Le groupe avance en silence. Une pause est prévue au sommet. La vue est dégagée.",
  "Chapitre 3 : Le retour",
  "On redescend par le ruisseau. Le soleil se couche derrière les arbres. Tout le monde rentre fatigué.",
].join("\n");

let server, browser, page, pdfBase64;
const errors = [];
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  page.on("pageerror", (err) => errors.push(err.message));
  const generator = await browser.newPage();
  await generator.setContent("<p>Le texte déposé arrive sur l'écran.</p>");
  pdfBase64 = Buffer.from(await generator.pdf()).toString("base64");
  await generator.close();
});
after(async () => { await browser?.close(); await server?.close(); });

async function open(text = TEXT) {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  if (text) await page.$eval("#screen", (el, value) => { el.value = value; el.dispatchEvent(new Event("input")); }, text);
}
const status = () => page.$eval("#status-left", (el) => el.textContent);
const waitStatus = (value, timeout = 120_000) => page.waitForFunction((s) => document.querySelector("#status-left").textContent === s, { timeout }, value);
const position = () => page.$eval("#seek", (el) => Number(el.value));
const chapter = () => page.$eval("#chapter", (el) => el.value);
async function command(text) {
  if (await page.$eval("#commands-panel", (el) => el.hidden)) await page.click("#commands-toggle");
  await page.$eval("#command", (el) => { el.value = ""; });
  await page.type("#command", text);
  await page.click('#command-form button[type="submit"]');
}

test("la barre de lecture n'apparaît qu'avec du texte et liste les chapitres", async () => {
  await open("");
  assert.equal(await page.$eval("#transport", (el) => el.hidden), true);
  await open();
  assert.equal(await page.$eval("#transport", (el) => el.hidden), false);
  const titles = await page.$$eval("#chapter option", (options) => options.map((o) => o.textContent));
  assert.deepEqual(titles, ["Chapitre 1 : Le départ", "Chapitre 2 : La marche", "Chapitre 3 : Le retour"]);
});

test("chapitre, phrases et secondes : la position et le chapitre restent synchronisés", { timeout: 180_000 }, async () => {
  await open();
  await page.click("#key-speak");
  await waitStatus("▶ LECTURE");
  await page.select("#chapter", "2");
  await page.waitForFunction(() => document.querySelector("#chapter").value === "2" && document.querySelector("#status-left").textContent === "▶ LECTURE", { timeout: 120_000 });
  const atThird = await position();
  assert.ok(atThird > 5, `le chapitre 3 doit être loin du début (${atThird} s)`);
  await page.focus("#key-speak");

  await command("recommence le chapitre");
  await waitStatus("▶ LECTURE", 10_000);
  assert.equal(await chapter(), "2");

  await command("reviens 3 phrases en arrière");
  await waitStatus("▶ LECTURE", 10_000);
  assert.equal(await chapter(), "1", "trois phrases avant le chapitre 3 = fin du chapitre 2");
  assert.ok(await position() < atThird);

  await command("reviens 5 minutes en arrière");
  await waitStatus("▶ LECTURE", 10_000);
  assert.ok(await position() < 1.5, "reculer au-delà du début ramène au début");
  assert.equal(await chapter(), "0");

  // Le texte dure moins de 30 s : le saut s'arrête à la fin et la machine redevient prête.
  await page.click("#forward");
  await waitStatus("PRÊT", 10_000);
  assert.equal(await page.$eval("#key-speak", (el) => el.textContent), "▶ PARLE");

  await command("dis bonjour");
  assert.match(await page.$eval("#command-feedback", (el) => el.textContent), /Essaie/);
  await page.click("#key-speak");
  await waitStatus("▶ LECTURE", 2000);
  assert.ok(await position() < 1.5, "PARLE après la fin relit depuis le début");
  await page.click("#key-speak");
  await waitStatus("⏸ PAUSE", 2000);
  assert.deepEqual(errors, []);
});

test("glisser-déposer un PDF : zone signalée, texte importé, navigateur ne l'ouvre pas", { timeout: 90_000 }, async () => {
  await open("");
  const url = page.url();
  await page.evaluate(() => {
    window.dropData = new DataTransfer();
    window.dropData.items.add(new File(["x"], "placeholder.txt"));
    document.querySelector("#screen").dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: window.dropData }));
  });
  assert.equal(await page.$eval("#drop-overlay", (el) => el.hidden), false);
  assert.equal(await page.$eval(".machine", (el) => el.classList.contains("drag-over")), true);
  await page.evaluate((base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const data = new DataTransfer();
    data.items.add(new File([bytes], "depose.pdf", { type: "application/pdf" }));
    document.querySelector("#screen").dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }));
  }, pdfBase64);
  assert.equal(await page.$eval("#drop-overlay", (el) => el.hidden), true);
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("texte déposé"), { timeout: 60_000 });
  assert.equal(page.url(), url);

  await page.evaluate(() => {
    const data = new DataTransfer();
    data.items.add(new File(["a"], "a.pdf", { type: "application/pdf" }));
    data.items.add(new File(["b"], "b.pdf", { type: "application/pdf" }));
    document.body.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  assert.equal(await status(), "UN PDF À LA FOIS");
  assert.match(await page.$eval("#screen", (el) => el.value), /texte déposé/);
});
