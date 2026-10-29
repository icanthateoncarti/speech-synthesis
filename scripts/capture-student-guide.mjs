// Recrée le PDF pédagogique original et deux captures réelles du parcours local.
// Ne lit aucun document utilisateur ; nécessite npm run build et Chrome.
import { startServer, launch, ROOT } from '../tests/e2e/harness.mjs';
const server = await startServer();
const {browser,page} = await launch({profile:'tests/e2e/.chrome-profile/student-guide',viewport:{width:1100,height:850},reducedMotion:true});
try {
  await page.setContent(`<!doctype html><html lang="fr"><meta charset="utf-8"><style>body{font:18px/1.65 Arial;color:#17251f;margin:50px}h1{font-size:32px}h2{font-size:25px}header,footer{font-size:12px;color:#555}section+section{break-before:page}aside{padding:16px;background:#eee}footer{margin-top:50px}</style><body>
  <section><header>COURS D’EXEMPLE · SPEECHSYNTHE.SI · 2026</header><h1>Chapitre 1 — La moyenne</h1><p>La moyenne donne une valeur représentative d’une série de nombres. Pour la calculer, on additionne toutes les valeurs, puis on divise cette somme par le nombre de valeurs.</p><h2>Un exemple avec trois notes</h2><p>Imaginons trois notes : 8, 12 et 16. Leur somme est égale à 36. On divise 36 par 3 : la moyenne est donc 12.</p><h2>À toi de jouer</h2><p>Trois trajets durent 10, 20 et 30 minutes. Quelle est leur durée moyenne ? Fais une pause avant de lire la réponse.</p><aside>Réponse : la somme des durées est 60 minutes. On divise par 3. La durée moyenne est de 20 minutes.</aside><footer>Mini-cours original créé pour le guide étudiant de speechsynthe.si. Tu peux le réutiliser librement. Page 1.</footer></section>
  <section><header>COURS D’EXEMPLE · SPEECHSYNTHE.SI · 2026</header><h1>Chapitre 2 — La médiane</h1><p>La médiane est la valeur qui se trouve au milieu d’une série ordonnée. Avec un nombre impair de valeurs, il suffit de prendre celle du centre.</p><h2>Comparer moyenne et médiane</h2><p>Trois trajets durent 10, 20 et 90 minutes. Les valeurs sont déjà rangées dans l’ordre. La médiane est 20 minutes. La moyenne est 40 minutes, car la somme est 120 et il y a trois trajets.</p><p>Le trajet de 90 minutes fait augmenter la moyenne. La médiane reste la valeur du milieu.</p><h2>Vérifie que tu as compris</h2><p>Dans cet exemple, pourquoi la moyenne est-elle plus grande que la médiane ? Essaie de répondre avec tes mots, puis relis le paragraphe précédent.</p><footer>Mini-cours original créé pour le guide étudiant de speechsynthe.si. Tu peux le réutiliser librement. Page 2.</footer></section></body></html>`);
  await page.pdf({path:ROOT+'/assets/guides/cours-exemple-moyenne-mediane.pdf',format:'A4',printBackground:true,margin:{top:'12mm',bottom:'12mm'}});
  await page.goto(server.url,{waitUntil:'networkidle0'});
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await (await page.$('#pdf-input')).uploadFile(ROOT+'/assets/guides/cours-exemple-moyenne-mediane.pdf');
  await page.waitForFunction(()=>document.querySelector('#screen').value.includes('Chapitre 2'),{timeout:30000});
  await page.click('#course-tools-toggle');
  await page.click('#review-open');
  await page.waitForSelector('#review-dialog[open]:not([data-entering])',{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#review-text').value.includes('Chapitre 2'),{timeout:30000});
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:ROOT+'/assets/guides/relire-cours.jpg',type:'jpeg',quality:86});
  await page.click('#review-apply');
  await page.waitForFunction(()=>!document.querySelector('#review-dialog').open);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:ROOT+'/assets/guides/radio-cours.jpg',type:'jpeg',quality:86});
  console.log(JSON.stringify({pdfImported:true,screen:await page.$eval('#screen',el=>el.value.slice(0,180))}));
} finally {await browser.close();await server.close();}
