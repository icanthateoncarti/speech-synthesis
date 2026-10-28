// Empreinte de version dans index.html : GitHub Pages laisse le navigateur garder
// les fichiers 10 minutes (max-age=600). Sans empreinte, une mise à jour peut
// mélanger la nouvelle page et d'anciens scripts. L'import map renvoie chaque
// module local vers « ?v=<empreinte> » ; l'empreinte change dès que le code change.
// Usage : node scripts/stamp-version.mjs   (avant chaque publication)
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await files(full));
    else if (/\.(js|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

export async function computeVersion(root = ROOT) {
  const hash = createHash("sha256");
  for (const file of [...await files(path.join(root, "src")), ...await files(path.join(root, "styles"))].sort()) {
    hash.update(path.relative(root, file)).update("\0").update(await readFile(file)).update("\0");
  }
  return hash.digest("hex").slice(0, 10);
}

export async function localModules(root = ROOT) {
  return (await readdir(path.join(root, "src"))).filter((name) => name.endsWith(".js")).sort();
}

// Politique de sécurité du contenu (audit S07), en balise meta : GitHub Pages
// n'envoie pas d'en-têtes personnalisés. Aucun script en ligne n'est autorisé,
// sauf l'import map, désignée par son empreinte exacte (recalculée à chaque build).
// frame-ancestors est sans effet en meta : l'anti-iframe demande un en-tête (S08).
export function contentSecurityPolicy(importMapHash) {
  return [
    "default-src 'self'",
    `script-src 'self' '${importMapHash}' https://cdn.jsdelivr.net https://static.cloudflareinsights.com`,
    "worker-src 'self' https://cdn.jsdelivr.net",
    "connect-src 'self' https://cdn.jsdelivr.net https://cloudflareinsights.com https://speechsynthesi-sharing.speech-synthesis.workers.dev",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function stamp(html, version, modules) {
  const mapStart = html.indexOf('<script type="importmap">');
  const jsonStart = html.indexOf("{", mapStart), jsonEnd = html.indexOf("</script>", mapStart);
  const map = JSON.parse(html.slice(jsonStart, jsonEnd));
  const imports = Object.fromEntries(Object.entries(map.imports).filter(([key]) => !key.startsWith("/src/")));
  for (const name of modules) imports[`/src/${name}`] = `/src/${name}?v=${version}`;
  const json = JSON.stringify({ imports }, null, 2).replace(/\n/g, "\n  ");
  let out = (html.slice(0, jsonStart) + json + "\n  " + html.slice(jsonEnd))
    .replace(/(<script type="module" src="\/src\/[a-z-]+\.js)(?:\?v=[0-9a-f]+)?(">)/g, `$1?v=${version}$2`)
    .replace(/(<link rel="stylesheet" href="\/styles\/machine\.css)(?:\?v=[0-9a-f]+)?(">)/, `$1?v=${version}$2`);
  // L'empreinte porte sur le texte exact entre les balises de l'import map.
  const mapText = /<script type="importmap">([\s\S]*?)<\/script>/.exec(out)[1];
  const hash = `sha256-${createHash("sha256").update(mapText).digest("base64")}`;
  const meta = `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(hash)}">`;
  out = /<meta http-equiv="Content-Security-Policy"[^>]*>/.test(out)
    ? out.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, meta)
    : out.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n  ${meta}`);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = path.join(ROOT, "index.html");
  const version = await computeVersion();
  await writeFile(file, stamp(await readFile(file, "utf8"), version, await localModules()));
  console.log(`index.html : version ${version}`);
}
