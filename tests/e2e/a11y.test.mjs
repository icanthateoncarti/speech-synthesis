import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";
let server, browser, page;
before(async () => { server = await startServer(); ({ browser, page } = await launch()); });
after(async () => { await browser?.close(); await server?.close(); });
async function open() {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await page.evaluate(() => document.fonts.ready);
}

test("390×844 et 320×740 : commandes tactiles, pas de débordement", async () => {
  for (const width of [390, 320, 768, 1024]) {
    await page.setViewport({ width, height: 844 });
    await open();
    const result = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      controls: [...document.querySelectorAll(".key, [role=radio], #speed")].map((el) => {
        const { width, height } = el.getBoundingClientRect();
        return { id: el.id, width, height };
      }),
    }));
    assert.ok(result.width <= width, `${width} px : débordement ${result.width}`);
    for (const c of result.controls) assert.ok(c.width >= 44 && c.height >= 44, `${width} px : ${JSON.stringify(c)}`);
    if (width === 390) await page.screenshot({ path: "/tmp/speech-machine-mobile.png", fullPage: true });
  }
});

test("tout au clavier : ordre, flèches voix, vitesse et lecture par Entrée", { timeout: 120_000 }, async () => {
  await page.setViewport({ width: 1340, height: 900 });
  await open();
  await page.focus("#screen");
  for (const id of ["key-speak", "key-mp3", "key-pdf", "key-clear", "voice-jessica", "speed"]) {
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.id), id);
  }
  await page.focus("#voice-jessica");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.$eval("#voice-tom", (el) => el.getAttribute("aria-checked")), "true");
  assert.match(await page.$eval("#status-right", (el) => el.textContent), /TOM/);
  await page.focus("#speed");
  await page.keyboard.press("ArrowUp");
  assert.equal(await page.$eval("#speed", (el) => el.value), "1.1");
  await page.type("#screen", "Bonjour le monde.");
  await page.focus("#key-speak");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector("#status-left").textContent === "▶ LECTURE", { timeout: 120_000 });
  await page.keyboard.press("Enter");
  assert.equal(await page.$eval("#status-left", (el) => el.textContent), "PRÊT");
});

test("prefers-reduced-motion : grain et curseur fixes", async () => {
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open();
  await page.waitForSelector("#plastic canvas, #plastic.no-webgl");
  assert.equal(await page.$eval(".cursor", (el) => getComputedStyle(el).animationName), "none");
  const reduced = await page.$eval("#plastic", (el) => ({
    fallback: el.classList.contains("no-webgl"),
    speed: el.paperShaderMount?.speed ?? null,
  }));
  if (!reduced.fallback) assert.equal(reduced.speed, 0, "le shader doit être arrêté en mouvement réduit");
});
