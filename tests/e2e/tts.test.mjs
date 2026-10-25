import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
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
  // Théorie : 1 / 1,5 = 0,67. Les durées de VITS varient d'un tirage à l'autre (0,68 à 0,83 mesurés).
  assert.ok(ratio >= 0.55 && ratio <= 0.88, `ratio hors plage : ${ratio}`);
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

test("lecture longue : plus de 128 morceaux sans arrêt du moteur", { timeout: 240_000 }, async () => {
  const errors = [];
  const watch = (message) => {
    if (/Aborted\(|out of memory|memory access out of bounds/i.test(message.text())) errors.push(message.text());
  };
  page.on("console", watch);
  try {
    const result = await page.evaluate(async () => {
      let calls = 0;
      const result = await window.tts.synthesize({ text: "Le jour est clair. ".repeat(140), voice: "jessica", speed: 1 }, {
        onChunk: () => calls++,
      });
      return { calls, chunks: result.chunks.length, seconds: window.wavDuration(result.wav) };
    });
    assert.equal(result.calls, 140);
    assert.equal(result.chunks, 140);
    assert.ok(result.seconds > 100);
    assert.deepEqual(errors, [], "aucun redémarrage du moteur ne doit masquer une fuite mémoire");
  } finally { page.off("console", watch); }
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

test("preload d'une voix déjà en cache : aucune requête vers huggingface.co", { timeout: 120_000 }, async () => {
  // jessica est en cache OPFS depuis le premier test. Un Tts neuf = un worker neuf.
  const seen = [];
  const onRequest = (req) => {
    seen.push(req.url());
    req.continue();
  };
  await page.setRequestInterception(true);
  page.on("request", onRequest);
  try {
    const r = await page.evaluate(async (text) => {
      const { createTts } = await import("/src/tts.js");
      const tts = createTts();
      const progress = [];
      await tts.preload("jessica", { onProgress: (pct) => progress.push(pct) });
      const res = await tts.synthesize({ text, voice: "jessica", speed: 1.0 });
      return { progress, seconds: window.wavDuration(res.wav) };
    }, PHRASE);
    const hf = seen.filter((u) => u.includes("huggingface.co"));
    assert.deepEqual(hf, [], `requêtes inattendues : ${hf.join(", ")}`);
    assert.deepEqual(r.progress, []);
    assert.ok(r.seconds > 1);
    // témoin : les requêtes du worker sont bien visibles (import d'onnxruntime-web par le worker neuf)
    assert.ok(seen.some((u) => u.includes("onnxruntime-web")), "requêtes du worker invisibles : test sans valeur");
  } finally {
    page.off("request", onRequest);
    await page.setRequestInterception(false);
  }
});

test("réseau coupé au premier téléchargement → err.kind === 'network', puis PARLE relance", { timeout: 180_000 }, async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), "speechsynthesi-offline-"));
  let local, fresh;
  try {
    local = await startServer();
    fresh = await launch({ profile });
    let offline = false;
    const blocked = [];
    await fresh.page.setRequestInterception(true);
    fresh.page.on("request", (req) => {
      const u = req.url();
      if (offline && (u.includes("huggingface.co") || u.includes("cdn.jsdelivr.net"))) {
        blocked.push(u);
        req.abort("internetdisconnected");
      } else {
        req.continue();
      }
    });
    // la page elle-même charge lamejs depuis jsDelivr : on coupe le réseau une fois chargée
    await openFixture(fresh.page, local.url);
    offline = true;
    const cut = await fresh.page.evaluate(async (text) => {
      const kindOf = (p) => p.then(() => "resolved", (err) => err.kind);
      return {
        synth: await kindOf(window.tts.synthesize({ text, voice: "jessica", speed: 1.0 })),
        preload: await kindOf(window.tts.preload("tom")),
      };
    }, PHRASE);
    assert.equal(cut.synth, "network");
    assert.equal(cut.preload, "network");
    assert.ok(blocked.some((u) => u.includes("onnxruntime-web")), "l'import d'onnxruntime-web n'a pas été coupé");
    assert.ok(blocked.some((u) => u.includes("huggingface.co")), "aucune requête vers huggingface.co n'a été coupée");

    offline = false;
    const retry = await fresh.page.evaluate(async (text) => {
      try {
        const res = await window.tts.synthesize({ text, voice: "jessica", speed: 1.0 });
        return { seconds: window.wavDuration(res.wav) };
      } catch (err) {
        return { error: `${err.kind} : ${err.message}` };
      }
    }, PHRASE);
    assert.equal(retry.error, undefined, `la nouvelle tentative a échoué : ${retry.error}`);
    assert.ok(retry.seconds > 1);
  } finally {
    await fresh?.browser.close();
    await local?.close();
    // Profil temporaire conservé : aucune suppression automatique de fichiers.
  }
});

test("symboles et titres : le moteur reçoit le texte à dire, et un vrai silence encadre le titre", { timeout: 120_000 }, async () => {
  const r = await page.evaluate(async () => {
    const sent = [];
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (message?.type === "synthesize") sent.push(message.text);
      return post.call(this, message, ...rest);
    };
    try {
      const { parseWav } = await import("/src/audio.js");
      const result = await window.tts.synthesize({ text: "Donnée brute → Information (KPI) du dashboard.\nLe fil rouge du cours\nFin.", voice: "jessica", speed: 1 });
      const { samples, sampleRate } = parseWav(result.wav);
      // Morceau 0, 150 ms de liaison, puis le titre encadré d'une seconde de silence.
      const start = Math.round((result.durations[0] + 0.15) * sampleRate);
      const end = start + Math.round(result.durations[1] * sampleRate);
      const peak = (from, to) => samples.subarray(from, to).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
      return { sent, pauses: result.pauses, before: peak(start + 50, start + sampleRate - 50), after: peak(end - sampleRate + 50, end - 50), speech: peak(start + sampleRate, end - sampleRate) };
    } finally { Worker.prototype.postMessage = post; }
  });
  assert.deepEqual(r.sent, ["Donnée brute vers Information, entre parenthèses, K P I, du dache-borde.", "Le fil rouge du cours", "Fin."]);
  assert.deepEqual(r.pauses, [{ before: 0, after: 0 }, { before: 1, after: 1 }, { before: 0, after: 0 }]);
  assert.equal(r.before, 0, "une seconde de silence avant le titre");
  assert.equal(r.after, 0, "une seconde de silence après le titre");
  assert.ok(r.speech > 1000, "le titre lui-même est bien prononcé");
});

test("texte anglais : voix anglaises libres de droits et règles de lecture anglaises", { timeout: 300_000 }, async () => {
  const r = await page.evaluate(async () => {
    const sent = [];
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, ...rest) {
      if (message?.type === "synthesize") sent.push([message.voiceId, message.text]);
      return post.call(this, message, ...rest);
    };
    try {
      const text = "Replenishment is the process of moving inventory (stock) along the supply chain → the customer.";
      const jessica = await window.tts.synthesize({ text, voice: "jessica", speed: 1 });
      const tom = await window.tts.synthesize({ text, voice: "tom", speed: 1 });
      return { sent, lang: jessica.lang, seconds: [window.wavDuration(jessica.wav), window.wavDuration(tom.wav)] };
    } finally { Worker.prototype.postMessage = post; }
  });
  const spoken = "Replenishment is the process of moving inventory, in parentheses, stock, along the supply chain to the customer.";
  assert.equal(r.lang, "en");
  assert.deepEqual(r.sent, [["en_US-kristin-medium", spoken], ["en_US-joe-medium", spoken]]);
  for (const s of r.seconds) assert.ok(s > 3, `audio anglais trop court : ${s}`);
});
