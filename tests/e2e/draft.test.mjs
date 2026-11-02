import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, ROOT } from './harness.mjs';
let server, browser, page;
before(async () => { server = await startServer(); ({browser, page} = await launch({profile:ROOT+'/tests/e2e/.chrome-profile/draft', drafts:true})); });
after(async () => { await browser?.close(); await server?.close(); });

const ready = () => page.waitForSelector('#key-speak[aria-pressed="false"]');
const type = text => page.$eval('#screen', (e, t) => { e.value = t; e.dispatchEvent(new Event('input')); }, text);

test('brouillon : le texte retouché revient après fermeture, EFFACER le retire', async () => {
  await page.goto(server.url); await ready();
  await page.evaluate(() => indexedDB.deleteDatabase('speechsynthesi-library'));
  await page.reload(); await ready();
  await type('Chapitre un. Les parties gardées après le tri.');
  await new Promise(r => setTimeout(r, 1200));
  await page.reload(); await ready();
  await page.waitForFunction(() => document.querySelector('#screen').value.includes('parties gardées'), {timeout: 5000});
  assert.match(await page.$eval('#screen', e => e.value), /^Chapitre un\. Les parties gardées après le tri\.$/);
  await page.click('#key-clear');
  await new Promise(r => setTimeout(r, 1200));
  await page.reload(); await ready();
  await new Promise(r => setTimeout(r, 800));
  assert.equal(await page.$eval('#screen', e => e.value), '');
});
