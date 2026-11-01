import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";

let server, browser, page;
before(async () => { server = await startServer(); ({ browser, page } = await launch()); });
after(async () => { await browser?.close(); await server?.close(); });

test("EXEMPLE : le mini-cours s'importe et la lecture démarre, mobile", { timeout: 120_000 }, async () => {
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(server.url); await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await page.evaluate(() => localStorage.removeItem("radio-last-course"));
  await page.reload(); await page.waitForSelector('#key-speak[aria-pressed="false"]');
  const key = await page.waitForSelector("#key-example", { visible: true });
  const box = await key.boundingBox();
  assert.ok(box.y + box.height <= 844 && box.width >= 44 && box.height >= 44, "touche visible et assez grande sur téléphone");
  const speak = await (await page.$("#key-speak")).boundingBox();
  assert.ok(speak.y + speak.height <= 844, "PARLE reste au premier écran");
  await key.click();
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("La médiane"));
  assert.equal(await page.$eval("#document-label", el => el.textContent), "cours-exemple-moyenne-mediane.pdf");
  await page.waitForFunction(() => document.querySelector("#key-speak").getAttribute("aria-pressed") === "true", { timeout: 90_000 });
  await page.waitForFunction(() => document.querySelector("#status-left").textContent.includes("LECTURE"), { timeout: 90_000 });
  assert.equal(await page.$eval("#cleanup-open", el => el.hidden), false, "les en-têtes répétés de l'exemple montrent NETTOYER");
  assert.equal(await page.$eval("#key-example", el => el.disabled), false);
  await page.click("#key-speak");
});

test("EXEMPLE : touche désactivée pendant le chargement, puis rendue", { timeout: 60_000 }, async () => {
  await page.goto(server.url); await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await page.setRequestInterception(true);
  let release;
  const held = new Promise(resolve => { release = resolve; });
  const onRequest = async request => {
    if (request.url().includes("cours-exemple-moyenne-mediane")) await held;
    request.continue();
  };
  page.on("request", onRequest);
  try {
    await page.click("#key-example");
    assert.equal(await page.$eval("#key-example", el => el.disabled), true);
    release();
    await page.waitForFunction(() => document.querySelector("#screen").value.includes("La moyenne"));
    await page.waitForFunction(() => !document.querySelector("#key-example").disabled);
    await page.click("#key-speak").catch(() => {});
  } finally { page.off("request", onRequest); await page.setRequestInterception(false); }
});
