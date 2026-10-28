import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";

let server, browser, page;
before(async () => {
  server = await startServer(); ({ browser, page } = await launch());
  await page.setBypassServiceWorker(true);
    await page.goto(`${server.url}/tests/e2e/fixtures/tts.html`);
  await page.waitForFunction(() => window.ttsReady);
});

test("un worker versionné ignore un ancien moteur encore dans le cache HTTP", { timeout: 120_000 }, async () => {
  const engines = [];
  const watch = request => {
    const url = new URL(request.url());
    if (url.pathname === "/src/vendor/vits-web/vits-web.js") {
      engines.push(url.search);
      if (!url.search) {
        void request.respond({ status: 200, contentType: "text/javascript", body: 'throw Error("Ancien moteur");' });
        return;
      }
    }
    void request.continue();
  };
  await page.setRequestInterception(true); page.on("request", watch);
  try {
    const seconds = await page.evaluate(async () => {
      const { createTts } = await import("/src/tts.js?v=cache-version-test");
      const tts = createTts();
      await tts.preload("jessica");
      return window.wavDuration((await tts.synthesize({ text: "Le nouveau moteur est prêt.", voice: "jessica", speed: 1 })).wav);
    });
    assert.ok(seconds > 1);
    assert.deepEqual(engines, ["?v=cache-version-test"]);
  } finally { page.off("request", watch); await page.setRequestInterception(false); }
});
after(async () => { await browser?.close(); await server?.close(); });

test("après préparation, seule la phrase corrigée repasse dans le moteur ; le son conservé est identique", { timeout: 120_000 }, async () => {
  const result = await page.evaluate(async () => {
    let calls = 0;
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (message.type === "synthesize") calls++;
      return post.call(this, message, ...rest);
    };
    try {
      await window.tts.preload("jessica");
      const one = async text => {
        const chunks = [], start = performance.now(), before = calls;
        const result = await window.tts.synthesize({ text, voice: "jessica", speed: 1 }, { onChunk: wav => chunks.push(new Uint8Array(wav)) });
        return { chunks, calls: calls - before, ms: performance.now() - start, seconds: window.wavDuration(result.wav) };
      };
      const first = await one("Une variable contient une valeur. Une boucle répète une action. Une fonction retourne un résultat.");
      const edited = await one("Une variable contient une valeur. Une boucle parcourt les éléments. Une fonction retourne un résultat.");
      const same = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);
      window.tts.clearCache();
      const cleared = await one("Une variable contient une valeur.");
      return { firstCalls: first.calls, editedCalls: edited.calls, clearedCalls: cleared.calls,
        sameStart: same(first.chunks[0], edited.chunks[0]), sameEnd: same(first.chunks[2], edited.chunks[2]),
        seconds: edited.seconds };
    } finally { Worker.prototype.postMessage = post; }
  });
  assert.equal(result.firstCalls, 3); assert.equal(result.editedCalls, 1); assert.equal(result.clearedCalls, 1);
  assert.ok(result.sameStart && result.sameEnd); assert.ok(result.seconds > 3);
});
