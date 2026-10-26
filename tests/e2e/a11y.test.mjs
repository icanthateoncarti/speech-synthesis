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
  for (const id of ["key-pdf", "key-clear", "voice-jessica", "speed", "key-speak", "key-mp3"]) {
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
  assert.equal(await page.$eval("#status-left", (el) => el.textContent), "⏸ PAUSE");
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

test("bouton rotatif : clic, glisser sans sélectionner le texte, annulation tactile", async () => {
  await page.setViewport({ width: 1340, height: 900 });
  await open();
  const selected = () => page.$eval('#voice [aria-checked="true"]', (el) => el.id);
  const center = () => page.$eval('.knob', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.click('.knob');
  assert.equal(await selected(), 'voice-tom', 'un clic bascule toujours la voix');
  const point = await center();
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.mouse.move(point.x - 65, point.y, { steps: 6 });
  assert.equal(await selected(), 'voice-tom', 'le moteur attend la fin du geste');
  await page.mouse.up();
  assert.equal(await selected(), 'voice-jessica');
  assert.equal(await page.evaluate(() => getSelection().toString()), '', 'le geste ne sélectionne pas les libellés');
  assert.equal(await page.$eval('.knob', (el) => el.classList.contains('turning')), false);

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await open();
  const touch = await center();
  const client = await page.createCDPSession();
  try {
    const down = () => client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touch.x, y: touch.y }] });
    const move = () => client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touch.x + 65, y: touch.y }] });
    await down(); await move();
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    assert.equal(await selected(), 'voice-jessica', 'un geste interrompu conserve la voix');
    await down(); await move();
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await selected(), 'voice-tom', 'le glisser au doigt change de cran');
    assert.equal(await page.$eval('.knob', (el) => el.style.getPropertyValue('--knob-angle')), '', 'le repère retrouve son cran');
  } finally { await client.detach(); }
});

test("commandes sur mobile : saisie lisible, focus à l'ouverture et retour par Échap", async () => {
  for (const width of [320, 390]) {
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    await open();
    await page.$eval('#screen', (el) => { el.value = 'Bonjour le monde. Voici une deuxième phrase.'; el.dispatchEvent(new Event('input')); });
    assert.notEqual(await page.$eval('#time-total', (el) => el.textContent), '~0:00', 'la durée estimée est affichée dès la saisie');
    await page.click('#commands-toggle');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'command');
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      font: parseFloat(getComputedStyle(document.querySelector('#command')).fontSize),
      controls: [...document.querySelectorAll('#commands-panel input, #commands-panel select, #commands-panel button')].map(el => { const r = el.getBoundingClientRect(); return { id: el.id, left: r.left, right: r.right, height: r.height }; }),
    }));
    assert.ok(layout.width <= width);
    assert.ok(layout.font >= 16);
    for (const c of layout.controls) assert.ok(c.left >= 0 && c.right <= width && c.height >= 44, JSON.stringify(c));
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('#commands-panel', el => el.hidden), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'commands-toggle');
  }
});
