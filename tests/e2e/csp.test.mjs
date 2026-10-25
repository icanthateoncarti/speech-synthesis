import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "./harness.mjs";

let server, browser, page, pdf;
const violations = [];
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  const dir = await mkdtemp(path.join(os.tmpdir(), "speech-csp-"));
  const generator = await browser.newPage();
  await generator.setContent("<h1 style='font-size:28px'>Le fil rouge</h1><p>Une phrase du cours. Une autre phrase.</p>");
  pdf = path.join(dir, "cours.pdf");
  await writeFile(pdf, await generator.pdf());
  await generator.close();
  await page.evaluateOnNewDocument(() => document.addEventListener("securitypolicyviolation", (e) => console.log(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`)));
  page.on("console", (m) => { if (/CSP-VIOLATION|Content Security Policy|Refused to/.test(m.text())) violations.push(m.text()); });
});
after(async () => { await browser?.close(); await server?.close(); });

test("S07 : la CSP ne bloque rien d'une utilisation réelle (grain, lecture, import PDF, page par usage)", { timeout: 180_000 }, async () => {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await page.waitForSelector("#plastic canvas, #plastic.no-webgl");
  await page.$eval("#screen", (el) => { el.value = "Bonjour le monde. Voici la machine."; el.dispatchEvent(new Event("input")); });
  await page.click("#key-speak");
  await page.waitForFunction(() => document.querySelector("#status-left").textContent === "▶ LECTURE", { timeout: 120_000 });
  await (await page.$("#pdf-input")).uploadFile(pdf);
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("Le fil rouge"), { timeout: 60_000 });
  await page.goto(`${server.url}/voix-off/`);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await page.click(".example button");
  assert.deepEqual(violations, []);
  // La CSP est bien appliquée : un script en ligne injecté est refusé.
  const blocked = await page.evaluate(() => new Promise((resolve) => {
    document.addEventListener("securitypolicyviolation", () => resolve(true), { once: true });
    const s = document.createElement("script"); s.textContent = "window.injected = true"; document.body.append(s);
    setTimeout(() => resolve(window.injected !== true), 500);
  }));
  assert.equal(blocked, true, "un script en ligne injecté doit être bloqué");
});
