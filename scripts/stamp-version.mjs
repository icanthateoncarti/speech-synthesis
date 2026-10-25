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

export function stamp(html, version, modules) {
  const mapStart = html.indexOf('<script type="importmap">');
  const jsonStart = html.indexOf("{", mapStart), jsonEnd = html.indexOf("</script>", mapStart);
  const map = JSON.parse(html.slice(jsonStart, jsonEnd));
  const imports = Object.fromEntries(Object.entries(map.imports).filter(([key]) => !key.startsWith("/src/")));
  for (const name of modules) imports[`/src/${name}`] = `/src/${name}?v=${version}`;
  const json = JSON.stringify({ imports }, null, 2).replace(/\n/g, "\n  ");
  return (html.slice(0, jsonStart) + json + "\n  " + html.slice(jsonEnd))
    .replace(/(<script type="module" src="\/src\/main\.js)(?:\?v=[0-9a-f]+)?(">)/, `$1?v=${version}$2`)
    .replace(/(<link rel="stylesheet" href="\/styles\/machine\.css)(?:\?v=[0-9a-f]+)?(">)/, `$1?v=${version}$2`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = path.join(ROOT, "index.html");
  const version = await computeVersion();
  await writeFile(file, stamp(await readFile(file, "utf8"), version, await localModules()));
  console.log(`index.html : version ${version}`);
}
