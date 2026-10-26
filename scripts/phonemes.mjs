// Phonèmes espeak d'un texte, tels que la voix les reçoit.
// Usage : node scripts/phonemes.mjs fr "dashboard" "dache-borde"
import { startServer, launch } from "../tests/e2e/harness.mjs";
const [lang, ...words] = process.argv.slice(2);
const server = await startServer();
const { browser, page } = await launch();
await page.goto(server.url + "/tests/e2e/fixtures/tts.html");
const out = await page.evaluate(async (lang, words) => {
  const { createPiperPhonemize } = await import("/src/vendor/vits-web/piper-DeOu3H9E.js");
  const base = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";
  let last;
  const p = await createPiperPhonemize({ print(l) { last = l; }, printErr() {},
    locateFile: (f) => f.endsWith(".wasm") ? base + ".wasm" : f.endsWith(".data") ? base + ".data" : f });
  return words.map((w) => {
    last = null;
    p.callMain(["-l", lang === "en" ? "en-us" : "fr", "--input", JSON.stringify([{ text: w }]), "--espeak_data", "/espeak-ng-data"]);
    const j = JSON.parse(last);
    return [w, (j.phonemes ?? []).flat().join("")];
  });
}, lang, words);
for (const [w, ph] of out) console.log(`${w} => ${ph}`);
await browser.close(); await server.close();
