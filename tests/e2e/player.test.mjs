import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { startServer, launch } from "./harness.mjs";

test("vrai lecteur : pause stable, avance et retour pendant la lecture", { timeout: 30_000 }, async () => {
  const server = await startServer();
  const profile = await mkdtemp(path.join(os.tmpdir(), "speech-player-"));
  let browser;
  try {
    const launched = await launch({ profile, reducedMotion: true });
    browser = launched.browser;
    const page = launched.page;
    await page.goto(`${server.url}/tests/e2e/fixtures/player.html`);
    await page.waitForFunction(() => window.playerReady);
    await page.click("#start");
    await page.waitForFunction(() => window.player.getTime() > 0.2);
    const paused = await page.evaluate(() => window.player.pause());
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.ok(Math.abs(await page.evaluate(() => window.player.getTime()) - paused) < 0.01);
    assert.ok(await page.evaluate(() => window.level) > 0, "le vumètre doit mesurer le vrai signal");
    await page.evaluate(() => {
      window.player.enqueue(window.wav);
      window.player.seek(1.8);
    });
    assert.equal(await page.evaluate(() => window.player.isPaused()), true);
    assert.ok(Math.abs(await page.evaluate(() => window.player.getTime()) - 1.8) < 0.01);
    await page.evaluate(() => window.player.resume());
    await page.waitForFunction(() => window.player.getTime() > 2);
    await page.evaluate(() => window.player.seek(0.1));
    await page.waitForFunction(() => window.player.getTime() > 0.2 && window.player.getTime() < 1);
    assert.ok(await page.evaluate(() => window.player.isPlaying()));
    await page.evaluate(() => window.player.stop());
  } finally {
    await browser?.close();
    await server.close();
  }
});
