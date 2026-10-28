import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, ROOT } from './harness.mjs';
let server, browser, page;
before(async () => { server = await startServer(); ({browser, page} = await launch({profile:ROOT+'/tests/e2e/.chrome-profile/course-menu'})); });
after(async () => { await browser?.close(); await server?.close(); });

test('options : clavier, fermeture extérieure, dialogues et focus de retour', async () => {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  assert.equal(await page.$eval('#library-open', e => e.getClientRects().length), 0);
  await page.focus('#course-tools-toggle'); await page.keyboard.press('Enter'); await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'library-open');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'course-tools-toggle');
  assert.equal(await page.$eval('#course-tools-toggle', e => e.getAttribute('aria-expanded')), 'false');
  await page.click('#course-tools-toggle'); await page.click('#screen');
  assert.equal(await page.$eval('#course-tools-panel', e => e.hidden), true);
  await page.focus('#course-tools-toggle'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await page.waitForSelector('#library-dialog[open]'); await page.click('#library-close');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'course-tools-toggle');
  await page.$eval('#screen', e => {e.value='Bonjour. Un cours pour tester les options.'; e.dispatchEvent(new Event('input'));});
  for (const name of ['review', 'share']) {
    await page.click('#course-tools-toggle'); await page.click(`#${name}-open`);
    await page.waitForSelector(`#${name}-dialog[open]`);
    assert.equal(await page.$eval('#course-tools-panel', e => e.hidden), true);
    await page.click(`#${name}-close`);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'course-tools-toggle');
  }
  await page.focus('#course-tools-toggle'); await page.keyboard.press('Enter');
  for (let i=0;i<4;i++) await page.keyboard.press('Tab');
  assert.equal(await page.$eval('#course-tools-panel', e => e.hidden), true);
});

test('options : menu lisible dans le boîtier sur mobile et ordinateur', async () => {
  for (const width of [320,390,768,1340]) {
    await page.setViewport({width,height:900}); await page.goto(server.url);
    await page.waitForSelector('#key-speak[aria-pressed="false"]');
    await page.click('#course-tools-toggle');
    const r = await page.evaluate(() => {
      const panel=document.querySelector('#course-tools-panel').getBoundingClientRect();
      const machine=document.querySelector('.machine').getBoundingClientRect();
      const toggle=document.querySelector('#course-tools-toggle').getBoundingClientRect();
      return {left:panel.left,right:panel.right,bottom:panel.bottom,machineLeft:machine.left,machineRight:machine.right,machineBottom:machine.bottom,width:toggle.width,height:toggle.height,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert.ok(r.left >= r.machineLeft && r.right <= r.machineRight && r.bottom <= r.machineBottom, JSON.stringify(r));
    assert.ok(r.width>=44 && r.height>=44); assert.equal(r.overflow,false);
  }
});
