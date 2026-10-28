// Parcours réel, à lancer explicitement : utilise un lien public de test puis le supprime.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { launch, ROOT } from './harness.mjs';

test('partage complet : lien chiffré, import volontaire, réglages, suppression', {skip: !process.env.SHARING_LIVE_TEST,timeout:120000},async()=>{
  const {browser,page}=await launch({profile:'tests/e2e/.chrome-profile/sharing'});
  page.setDefaultTimeout(15000);
  console.log('browser ready');
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const requests=[];
  async function localFrontend(p) {
    await p.setBypassServiceWorker(true);await p.setRequestInterception(true);
    p.on('request',async req=>{
      const url=new URL(req.url());
      if(url.hostname==='speechsynthe.si') {
        if(url.pathname==='/sw.js')return req.respond({status:503,body:'test without cache'});
        const file=path.resolve(ROOT,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
        if(!file.startsWith(ROOT+path.sep))return req.abort();
        try{const body=await readFile(file);const contentType=url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.woff2')?'font/woff2':url.pathname.endsWith('.png')?'image/png':'text/html';await req.respond({status:200,contentType,body});}catch{await req.respond({status:404,body:'missing'});}return;
      }
      if(url.hostname.includes('workers.dev'))requests.push({url:req.url(),method:req.method()});
      if(url.hostname==='static.cloudflareinsights.com')return req.abort();
      await req.continue();
    });
  }
  try {
    await localFrontend(page);await page.goto('https://speechsynthe.si/', {waitUntil:'domcontentloaded'}); console.log('front loaded');await page.waitForSelector('#share-open');
    await page.$eval('#screen',el=>{el.value='Chapitre 1\nCours de test de partage. Aucun document personnel.';el.dispatchEvent(new Event('input'));});
    await page.click('#voice-tom');await page.$eval('#speed',el=>{el.value='1.2';el.dispatchEvent(new Event('input'));});
    await page.click('#share-open');await page.waitForSelector('#share-dialog[open] #share-create:not([hidden])');await page.click('#share-create'); console.log('creating link');
    await page.waitForFunction(()=>document.querySelector('#share-link').value || document.querySelector('#share-feedback').textContent.includes('indisponible'),{timeout:30000});
    const link=await page.$eval('#share-link',el=>el.value);assert.match(link,/^https:\/\/speechsynthe.si\/#session=[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/);
    console.log('link created'); const receiver=await browser.newPage(); receiver.setDefaultTimeout(15000);await localFrontend(receiver);await receiver.goto(link,{waitUntil:"domcontentloaded"});
    await receiver.waitForSelector('#share-import:not([hidden])');
    assert.equal(await receiver.$eval('#screen',el=>el.value),'');assert.equal(await receiver.evaluate(()=>location.hash),'');
    console.log('received'); await receiver.click('#share-import');assert.match(await receiver.$eval('#screen',el=>el.value),/Cours de test/);assert.equal(await receiver.$eval('#speed',el=>el.value),'1.2');assert.equal(await receiver.$eval('#voice-tom',el=>el.getAttribute('aria-checked')),'true');
    assert.ok(requests.every(req=>!req.url.includes(link.split('#session=')[1].split('.')[1]) && !req.url.includes('#')));
    console.log('deleting'); await page.bringToFront(); await page.click('#share-list .library-row:last-child button:last-child');await page.waitForFunction(()=>document.querySelector('#share-feedback').textContent.startsWith('Lien supprimé'));
    await receiver.bringToFront();await receiver.goto(link,{waitUntil:"domcontentloaded"});await receiver.waitForFunction(()=>document.querySelector('#share-feedback').textContent.includes('expiré ou a été supprimé'));
    assert.deepEqual(errors,[]);
  }catch(error){console.log(error.stack);throw error;}finally{await page.bringToFront().catch(()=>{});await page.evaluate(async()=>{const m=await import('/src/share.js');for(const e of m.createdShares())await m.deleteShare(e).catch(()=>{});}).catch(()=>{});await browser.close();}
});
