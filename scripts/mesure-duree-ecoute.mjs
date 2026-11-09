// Mesure, hors build, du guide /temps-lecture-voix-haute/ : durée de l'audio fabriqué
// par la radio pour deux textes publiés dans assets/guides/, avec chaque voix française.
// Usage : node scripts/mesure-duree-ecoute.mjs <fichier-de-sortie.json>
// La première mesure est aussi exportée en MP3 et relue avec ffprobe (ffmpeg),
// pour vérifier que le MP3 a la même durée que l'audio.
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { startServer, launch, ROOT } from "../tests/e2e/harness.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage : node scripts/mesure-duree-ecoute.mjs <sortie.json>");
const texts = {
  cours: await readFile(path.join(ROOT, "assets/guides/texte-mesure-duree.txt"), "utf8"),
  chiffres: await readFile(path.join(ROOT, "assets/guides/texte-mesure-duree-chiffres.txt"), "utf8"),
};
// Mots : suites de caractères séparées par des espaces, qui contiennent au moins une lettre ou un chiffre
// (« l’encodage » et « 13,5 » comptent pour un mot ; un « ; » ou un « : » isolé ne compte pas).
const words = (text) => text.trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
const runs = [
  ...["jessica", "tom"].flatMap(voice => [0.7, 1, 1.2, 1.5].map(speed => ["cours", voice, speed, 1])),
  ["cours", "jessica", 1, 2], ["cours", "tom", 1, 2],
  ["chiffres", "jessica", 1, 1], ["chiffres", "tom", 1, 1],
];

const dir = await mkdtemp(path.join(tmpdir(), "mesure-duree-"));
const server = await startServer();
const { browser, page } = await launch();
const version = (await readFile(path.join(ROOT, "index.html"), "utf8")).match(/main\.js\?v=([0-9a-f]+)/)?.[1];
const results = [];
try {
  for (const [name, voice, speed, pass] of runs) {
    // Page rechargée à chaque mesure : aucun morceau ne vient du cache de la passe précédente.
    await page.goto(server.url, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForSelector("#key-speak", { timeout: 120_000 });
    const withMp3 = !results.length;
    const r = await page.evaluate(async (text, voice, speed, withMp3) => {
      const { createTts } = await import("/src/tts.js");
      const { wavDuration } = await import("/src/audio.js");
      const t0 = performance.now();
      const { wav, chunks } = await createTts().synthesize({ text, voice, speed });
      const ms = performance.now() - t0;
      let b64 = null;
      if (withMp3) {
        const { exportMp3Audio } = await import("/src/mp3-export.js");
        const mp3 = await exportMp3Audio(wav, {});
        let binary = "";
        for (let i = 0; i < mp3.length; i += 0x2000) binary += String.fromCharCode(...mp3.subarray(i, i + 0x2000));
        b64 = btoa(binary);
      }
      return { b64, wavSec: wavDuration(wav), chunks: chunks.length, ms };
    }, texts[name], voice, speed, withMp3);
    let mp3Sec = null;
    if (r.b64) {
      const file = path.join(dir, `${name}-${voice}-${speed}-${pass}.mp3`);
      await writeFile(file, Buffer.from(r.b64, "base64"));
      mp3Sec = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }));
    }
    const n = words(texts[name]);
    const row = { texte: name, voix: voice, vitesse: speed, passe: pass, mots: n, caracteres: texts[name].length, morceaux: r.chunks, audio_s: Math.round(r.wavSec * 1000) / 1000, mp3_s: mp3Sec && Math.round(mp3Sec * 1000) / 1000, mots_par_min: Math.round(n / r.wavSec * 600) / 10, preparation_s: Math.round(r.ms / 100) / 10 };
    results.push(row);
    console.log(JSON.stringify(row));
  }
} finally {
  await browser.close();
  await server.close();
}
await writeFile(out, JSON.stringify({ date: new Date().toISOString(), version, navigateur: "Chrome headless (puppeteer), macOS", mesures: results }, null, 1));
console.log("fini :", out, "· MP3 dans", dir);
