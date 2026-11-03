import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { startServer, launch, ROOT } from "./harness.mjs";

const PDF = path.join(ROOT, "assets/guides/cours-exemple-moyenne-mediane.pdf");
let server, browser, page;
before(async () => { server = await startServer(); ({ browser, page } = await launch()); });
after(async () => { await browser?.close(); await server?.close(); });

async function importAt(viewport) {
  await page.setViewport(viewport);
  await page.goto(server.url); await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await page.evaluate(() => scrollTo(0, 0));
  await (await page.$("#pdf-input")).uploadFile(PDF);
  await page.waitForFunction(() => !document.querySelector("#transport").hidden && document.querySelector("#screen").value.includes("La médiane"));
  return page.evaluate(() => {
    const box = id => document.getElementById(id).getBoundingClientRect();
    return { speak: box("key-speak").bottom, mp3: box("key-mp3").bottom, text: [box("screen").top, box("screen").bottom], height: innerHeight, scrolled: scrollY };
  });
}

for (const [width, height] of [[360, 740], [390, 844], [412, 915]]) {
  test(`import sur téléphone ${width}×${height} : PARLE et MP3 restent à l'écran`, { timeout: 60_000 }, async () => {
    const after = await importAt({ width, height, isMobile: true, hasTouch: true });
    assert.ok(after.speak <= after.height, `PARLE visible (bas ${after.speak} pour ${after.height})`);
    assert.ok(after.mp3 <= after.height, "MP3 visible");
    const [top, bottom] = after.text;
    assert.ok(bottom - Math.max(0, top) >= (bottom - top) / 2, "au moins la moitié du texte importé reste visible");
  });
}

test("import sur ordinateur : la page ne bouge pas", { timeout: 60_000 }, async () => {
  const after = await importAt({ width: 1340, height: 900 });
  assert.equal(after.scrolled, 0);
  assert.ok(after.speak <= after.height);
});
