import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { startServer, launch } from "./harness.mjs";

// Safari ne sait pas parcourir un ReadableStream avec « for await » : sans
// src/stream-iteration.js, tout import de PDF y échoue avec « PDF NON LU ».
let server, browser, page, fixtures;

before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  fixtures = await mkdtemp(path.join(os.tmpdir(), "speech-pdf-safari-"));
  const generator = await browser.newPage();
  await generator.setContent("<p>Bonjour depuis Safari.</p>");
  await generator.pdf({ path: path.join(fixtures, "texte.pdf") });
  await generator.close();
});

after(async () => {
  await browser?.close();
  await server?.close();
  await rm(fixtures, { recursive: true, force: true });
});

test("PDF importé sans itération asynchrone des flux, comme dans Safari", { timeout: 60_000 }, async () => {
  await page.evaluateOnNewDocument(() => {
    delete ReadableStream.prototype[Symbol.asyncIterator];
    delete ReadableStream.prototype.values;
  });
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await (await page.$("#pdf-input")).uploadFile(path.join(fixtures, "texte.pdf"));
  await page.waitForFunction(() => document.querySelector("textarea")?.value.includes("Bonjour depuis Safari")
    || document.querySelector("#status-left").textContent.startsWith("PDF "), { timeout: 30_000 });
  assert.match(await page.$eval("textarea", (el) => el.value), /Bonjour depuis Safari/);
});
