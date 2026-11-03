import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, ROOT } from './harness.mjs';
let server, browser, page;
before(async () => { server = await startServer(); ({browser, page} = await launch({profile:ROOT+'/tests/e2e/.chrome-profile/draft', drafts:true})); });
after(async () => { await browser?.close(); await server?.close(); });

const ready = () => page.waitForSelector('#key-speak[aria-pressed="false"]');
const type = text => page.$eval('#screen', (e, t) => { e.value = t; e.dispatchEvent(new Event('input')); }, text);
// Texte du brouillon tel qu'il est écrit sur l'appareil (null s'il n'y en a pas), sans créer la base.
const storedDraft = () => page.evaluate(() => new Promise(resolve => {
  const open = indexedDB.open('speechsynthesi-library');
  open.onupgradeneeded = () => open.transaction.abort();
  open.onerror = () => resolve(null);
  open.onsuccess = () => {
    const db = open.result;
    try {
      const get = db.transaction('meta').objectStore('meta').get('draft');
      get.onsuccess = () => { db.close(); resolve(get.result?.text ?? null); };
      get.onerror = () => { db.close(); resolve(null); };
    } catch { db.close(); resolve(null); }
  };
}));
// L'enregistrement attend 700 ms après la dernière frappe, parfois plus dans Chrome headless.
async function draftBecomes(expected) {
  for (let i = 0; i < 50 && await storedDraft() !== expected; i++) await new Promise(r => setTimeout(r, 200));
  assert.equal(await storedDraft(), expected);
}

test('brouillon : le texte retouché revient après fermeture, EFFACER le retire', async () => {
  // Base effacée depuis une page sans la radio : ouverte par la radio, la suppression resterait bloquée
  // et retiendrait l'enregistrement du brouillon.
  await page.goto(new URL('ai.txt', server.url).href);
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('speechsynthesi-library');
    request.onsuccess = resolve; request.onerror = () => reject(request.error);
  }));
  await page.goto(server.url); await ready();
  await type('Chapitre un. Les parties gardées après le tri.');
  await draftBecomes('Chapitre un. Les parties gardées après le tri.');
  await page.reload(); await ready();
  await page.waitForFunction(() => document.querySelector('#screen').value.includes('parties gardées'), {timeout: 5000});
  assert.match(await page.$eval('#screen', e => e.value), /^Chapitre un\. Les parties gardées après le tri\.$/);
  await page.click('#key-clear');
  await draftBecomes(null);
  await page.reload(); await ready();
  await new Promise(r => setTimeout(r, 800));
  assert.equal(await page.$eval('#screen', e => e.value), '');
});
