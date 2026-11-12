import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";
let server, browser, page;
before(async () => { server = await startServer(); ({ browser, page } = await launch()); });
after(async () => { await browser?.close(); await server?.close(); });

test("WebMCP : un agent lit un texte avec la voix et la vitesse demandées", { timeout: 120_000 }, async () => {
  // Chrome n'expose pas encore document.modelContext : on simule le registre d'un agent.
  await page.evaluateOnNewDocument(() => {
    window.__tools = {};
    Object.defineProperty(document, "modelContext", { value: { registerTool: (tool) => { window.__tools[tool.name] = tool; } } });
  });
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  assert.deepEqual(await page.evaluate(() => Object.keys(window.__tools)), ["lire-a-voix-haute", "exporter-mp3"]);
  const reply = await page.evaluate(() => window.__tools["lire-a-voix-haute"].execute({ texte: "Bonjour, ceci est un test.", voix: "tom", vitesse: 1.2 }));
  assert.match(reply.content[0].text, /5 mots/);
  assert.equal(await page.$eval("#screen", (el) => el.value), "Bonjour, ceci est un test.");
  assert.equal(await page.$eval("#voice-tom", (el) => el.getAttribute("aria-checked")), "true");
  assert.equal(await page.$eval("#speed", (el) => el.value), "1.2");
  await page.waitForSelector('#key-speak[aria-pressed="true"]', { timeout: 60_000 });
});
