// Mesures locales réelles du moteur, sans prétendre simuler un téléphone.
// Usage : node scripts/benchmark-tts.mjs
// Comparaison facultative, sans modifier le checkout : BASELINE=<commit> node scripts/benchmark-tts.mjs
import { execFileSync } from "node:child_process";
import { startServer, launch } from "../tests/e2e/harness.mjs";

const baseline = process.env.BASELINE;
const previous = new Map();
if (baseline) for (const name of ["tts.js", "tts-worker.js", "vendor/vits-web/vits-web.js"]) {
  previous.set(`/src/${name}`, execFileSync("git", ["show", `${baseline}:src/${name}`], { encoding: "utf8" }));
}
const server = await startServer();
const { browser, page } = await launch({ profile: "/tmp/speechsynthesi-tts-benchmark" });
try {
  if (baseline) {
    await page.setRequestInterception(true);
    page.on("request", request => {
      const body = previous.get(new URL(request.url()).pathname);
      if (body) void request.respond({ status: 200, contentType: "text/javascript", body });
      else void request.continue();
    });
  }
  await page.goto(`${server.url}/tests/e2e/fixtures/tts.html`);
  await page.waitForFunction(() => window.ttsReady);
  const results = await page.evaluate(async () => {
    let requests = 0;
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (message.type === "synthesize") requests++;
      return post.call(this, message, ...rest);
    };
    const started = performance.now();
    await window.tts.preload("jessica");
    const preloadMs = Math.round(performance.now() - started);
    const sentences = Array.from({ length: 20 }, (_, i) => `La variable numéro ${i + 1} contient une valeur que le programme peut modifier.`);
    const cases = [];
    for (const scenario of ["initial", "one-edit", "repeat"]) {
      if (scenario === "one-edit") sentences[10] = "Une fonction reçoit des paramètres et retourne un résultat.";
      const start = performance.now(), before = requests;
      let first;
      const result = await window.tts.synthesize({ text: sentences.join(" "), voice: "jessica", speed: 1 }, {
        onChunk() { first ??= performance.now() - start; },
      });
      cases.push({ scenario, ms: Math.round(performance.now() - start), firstChunkMs: Math.round(first), inferenceRequests: requests - before, audioSeconds: Math.round(window.wavDuration(result.wav)), wavBytes: result.wav.byteLength });
    }
    return { preloadMs, cases };
  });
  console.log(JSON.stringify({ baseline: baseline ?? null, ...results }, null, 2));
} finally { await browser.close(); await server.close(); }
