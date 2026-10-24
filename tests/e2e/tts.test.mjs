import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "./harness.mjs";

const PHRASE = "Le 14 juillet 1789, le peuple de Paris prend la Bastille.";

async function openFixture(page, url) {
  await page.goto(`${url}/tests/e2e/fixtures/tts.html`);
  await page.waitForFunction(() => window.ttsReady || window.ttsError, { timeout: 30_000 });
  const err = await page.evaluate(() => window.ttsError);
  assert.equal(err, undefined, `la page de test n'a pas chargé src/tts.js : ${err}`);
}

let server, browser, page;

before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  await openFixture(page, server.url);
});

after(async () => {
  await browser?.close();
  await server?.close();
});

test("Jessica et Tom synthétisent, la vitesse change vraiment la durée", { timeout: 300_000 }, async (t) => {
  const r = await page.evaluate(async (text) => {
    const one = async (voice, speed) => {
      const t0 = performance.now();
      const res = await window.tts.synthesize({ text, voice, speed });
      return {
        seconds: window.wavDuration(res.wav),
        chunks: res.chunks,
        durations: res.durations,
        ms: Math.round(performance.now() - t0),
      };
    };
    return {
      voices: window.VOICES,
      j10: await one("jessica", 1.0),
      j15: await one("jessica", 1.5),
      t10: await one("tom", 1.0),
    };
  }, PHRASE);

  t.diagnostic(`jessica 1.0 : ${r.j10.seconds.toFixed(3)} s audio en ${r.j10.ms} ms`);
  t.diagnostic(`jessica 1.5 : ${r.j15.seconds.toFixed(3)} s audio en ${r.j15.ms} ms`);
  t.diagnostic(`tom 1.0 : ${r.t10.seconds.toFixed(3)} s audio en ${r.t10.ms} ms`);
  const ratio = r.j15.seconds / r.j10.seconds;
  t.diagnostic(`ratio durée(1.5) / durée(1.0) = ${ratio.toFixed(3)}`);

  assert.deepEqual(r.voices, { jessica: "fr_FR-upmc-medium", tom: "fr_FR-tom-medium" });
  for (const x of [r.j10, r.j15, r.t10]) {
    assert.ok(x.seconds > 1, `durée trop courte : ${x.seconds}`);
    assert.deepEqual(x.chunks, [PHRASE]);
    assert.equal(x.durations.length, 1);
    assert.ok(Math.abs(x.durations[0] - x.seconds) < 0.01);
  }
  assert.ok(ratio >= 0.55 && ratio <= 0.8, `ratio hors plage : ${ratio}`);
});

test("onChunk arrive avant la fin pour un texte de 30 phrases", { timeout: 300_000 }, async (t) => {
  const sentences = Array.from({ length: 30 }, (_, i) =>
    `Voici la phrase numéro ${i + 1}, lue par la machine sans se presser.`);
  const r = await page.evaluate(async (text) => {
    let settled = false;
    const calls = [];
    const t0 = performance.now();
    const res = await window.tts.synthesize({ text, voice: "jessica", speed: 1.0 }, {
      onChunk: (wav, index, total) => {
        calls.push({
          index,
          total,
          isBuffer: wav instanceof ArrayBuffer,
          seconds: window.wavDuration(wav),
          settled,
          ms: Math.round(performance.now() - t0),
        });
      },
    }).finally(() => { settled = true; });
    return {
      calls,
      chunks: res.chunks,
      durations: res.durations,
      total: window.wavDuration(res.wav),
      ms: Math.round(performance.now() - t0),
    };
  }, sentences.join(" "));

  t.diagnostic(`${r.chunks.length} morceaux, ${r.total.toFixed(1)} s audio en ${r.ms} ms ; 1er morceau à ${r.calls[0]?.ms} ms`);
  assert.ok(r.chunks.length > 1, "le texte doit être découpé en plusieurs morceaux");
  assert.equal(r.calls.length, r.chunks.length);
  assert.equal(r.calls[0].settled, false, "le premier onChunk doit arriver avant la résolution");
  r.calls.forEach((c, i) => {
    assert.equal(c.index, i);
    assert.equal(c.total, r.chunks.length);
    assert.ok(c.isBuffer);
    assert.ok(Math.abs(c.seconds - r.durations[i]) < 0.01);
  });
  // concatWavs ajoute 150 ms de silence entre deux morceaux
  const expected = r.durations.reduce((a, b) => a + b, 0) + 0.15 * (r.chunks.length - 1);
  assert.ok(Math.abs(r.total - expected) < 0.05, `durée totale ${r.total} ≠ ${expected}`);
});

test("cancel() rejette avec kind 'cancelled', et la synthèse suivante marche", { timeout: 300_000 }, async () => {
  const r = await page.evaluate(async (phrase) => {
    const text = Array.from({ length: 20 }, () => phrase).join(" ");
    let kind = null;
    let chunksAfterCancel = 0;
    let cancelled = false;
    const p = window.tts.synthesize({ text, voice: "jessica", speed: 1.0 }, {
      onChunk: () => {
        if (cancelled) { chunksAfterCancel++; return; }
        cancelled = true;
        window.tts.cancel();
      },
    });
    try { await p; } catch (err) { kind = err.kind; }
    await new Promise((res) => setTimeout(res, 500));
    const preload = await window.tts.preload("jessica").then(() => "ok", (err) => err.kind);
    const next = await window.tts.synthesize({ text: phrase, voice: "jessica", speed: 1.0 });
    return { kind, chunksAfterCancel, preload, nextSeconds: window.wavDuration(next.wav) };
  }, PHRASE);

  assert.equal(r.kind, "cancelled");
  assert.equal(r.chunksAfterCancel, 0, "aucun onChunk après cancel()");
  assert.equal(r.preload, "ok");
  assert.ok(r.nextSeconds > 1);
});

test("réseau coupé au premier téléchargement → err.kind === 'network'", { timeout: 120_000 }, async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), "speechsynthesi-offline-"));
  const local = await startServer();
  const fresh = await launch({ profile });
  try {
    const blocked = [];
    await fresh.page.setRequestInterception(true);
    fresh.page.on("request", (req) => {
      if (req.url().includes("huggingface.co")) {
        blocked.push(req.url());
        req.abort("internetdisconnected");
      } else {
        req.continue();
      }
    });
    await openFixture(fresh.page, local.url);
    const r = await fresh.page.evaluate(async (text) => {
      const kindOf = (p) => p.then(() => "resolved", (err) => err.kind);
      return {
        synth: await kindOf(window.tts.synthesize({ text, voice: "jessica", speed: 1.0 })),
        preload: await kindOf(window.tts.preload("tom")),
      };
    }, PHRASE);
    assert.equal(r.synth, "network");
    assert.equal(r.preload, "network");
    assert.ok(blocked.length > 0, "aucune requête vers huggingface.co n'a été interceptée");
  } finally {
    await fresh.browser.close();
    await local.close();
    await rm(profile, { recursive: true, force: true });
  }
});
