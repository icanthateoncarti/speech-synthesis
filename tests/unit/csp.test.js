import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PAGES } from "../../scripts/pages.mjs";

const files = ["index.html", ...PAGES.map((page) => `${page.slug}/index.html`)];

test("S07 : chaque page porte une CSP dont l'empreinte autorise exactement son import map", async () => {
  for (const file of files) {
    const html = await readFile(new URL(`../../${file}`, import.meta.url), "utf8");
    const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html)?.[1];
    assert.ok(csp, `${file} : CSP absente`);
    assert.ok(html.indexOf("Content-Security-Policy") < html.indexOf("<script"), `${file} : la CSP doit précéder les scripts`);
    const map = /<script type="importmap">([\s\S]*?)<\/script>/.exec(html)[1];
    assert.ok(csp.includes(`'sha256-${createHash("sha256").update(map).digest("base64")}'`), `${file} : empreinte de l'import map périmée (npm run build)`);
    for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]) assert.ok(csp.includes(directive), `${file} : ${directive}`);
    assert.ok(!/unsafe-inline[^;]*;|'unsafe-eval'/.test(csp.split("; ").find((d) => d.startsWith("script-src"))), `${file} : script-src trop permissif`);
    // Plus aucun script exécutable écrit dans la page : seulement l'import map et les données structurées.
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].map((m) => m[1].trim());
    assert.deepEqual([...new Set(inline)].sort(), ['type="application/ld+json"', 'type="importmap"'], `${file} : script en ligne inattendu`);
  }
});
