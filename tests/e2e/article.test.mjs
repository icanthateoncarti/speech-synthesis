import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch } from './harness.mjs';
let server, browser, page;
before(async () => {server = await startServer(); ({browser,page}=await launch());});
after(async () => {await browser?.close();await server?.close();});

test('guide étudiant : accessible sur mobile, ressources chargées et liens utilisables sans JavaScript', async () => {
  await page.setJavaScriptEnabled(false);
  await page.setViewport({width:375,height:812});
  const errors=[];
  page.on('console', msg=>{if(msg.type()==='error') errors.push(msg.text());});
  await page.goto(server.url+'/ecouter-ses-cours/',{waitUntil:'networkidle0'});
  assert.match(await page.$eval('h1',el=>el.textContent), /écouter ses cours PDF ou PowerPoint/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
  const resources=await page.$$eval('img', imgs=>imgs.map(img=>({src:img.getAttribute('src'),alt:img.alt})));
  assert.equal(resources.length,2);
  for(const image of resources){assert.ok(image.alt.length>20);assert.equal((await fetch(server.url+image.src)).status,200);}
  const pdf = await fetch(server.url+await page.$eval('[download]',el=>el.getAttribute('href')));
  assert.equal(pdf.status,200);
  assert.equal((await pdf.text()).slice(0,5),'%PDF-');
  // Les liens de sommaire doivent atteindre une section existante.
  for(const href of await page.$$eval('.article-toc a',els=>els.map(el=>el.getAttribute('href')))) assert.ok(await page.$(href));
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.className),'article-skip');
  await page.keyboard.press('Enter');
  assert.match(page.url(),/#article$/);
  await page.click('.article-toc a[href="#emporter"]');
  assert.match(page.url(),/#emporter$/);
  await page.click('.article-button');
  assert.equal(new URL(page.url()).pathname,'/');
  assert.ok(await page.$('.machine'));
  assert.ok(await page.$('.usages a[href="/ecouter-ses-cours/"]'));
  // Retour au guide via le lien réellement publié dans le pied de page.
  await page.click('.usages a[href="/ecouter-ses-cours/"]');
  assert.equal(new URL(page.url()).pathname,'/ecouter-ses-cours/');
  assert.deepEqual(errors,[]);
});

test('guide PowerPoint : sans fichier d’exemple, liens croisés entre guides et mesure d’audience chargée', async () => {
  await page.setJavaScriptEnabled(true);
  await page.setViewport({width:375,height:812});
  const errors=[];
  page.on('console', msg=>{if(msg.type()==='error') errors.push(msg.text());});
  await page.goto(server.url+'/powerpoint-en-mp3/',{waitUntil:'networkidle0'});
  assert.match(await page.$eval('h1',el=>el.textContent), /PowerPoint de cours en MP3/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
  // Pas de fichier d'exemple pour ce guide : aucun encart de téléchargement vide.
  assert.equal(await page.$('.article-sample'),null);
  const images=await page.$$eval('img', imgs=>imgs.map(img=>({src:img.getAttribute('src'),alt:img.alt})));
  assert.equal(images.length,1);
  assert.equal((await fetch(server.url+images[0].src)).status,200);
  assert.equal(await page.$eval('meta[property="og:image"]',el=>el.content),'https://speechsynthe.si'+images[0].src);
  // Le script de mesure est chargé (le beacon Cloudflare, lui, ne part qu'en production).
  assert.ok(await page.$('script[type="module"][src^="/src/article.js"]'));
  assert.equal(await page.$('script[src*="cloudflareinsights"]'),null);
  for(const href of await page.$$eval('.article-toc a',els=>els.map(el=>el.getAttribute('href')))) assert.ok(await page.$(href));
  for(const href of await page.$$eval('.article-related a',els=>els.map(el=>el.getAttribute('href')))) assert.equal((await fetch(server.url+href)).status,200);
  await page.click('.article-related a[href="/ecouter-ses-cours/"]');
  await page.waitForSelector('.article-related a[href="/powerpoint-en-mp3/"]');
  assert.deepEqual(errors,[]);
});
