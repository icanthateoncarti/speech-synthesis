import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
export async function offlineWorker(root, version) {
  async function walk(dir) {
    const out = [];
    for (const entry of await readdir(path.join(root, dir), { withFileTypes: true })) {
      const name = `${dir}/${entry.name}`;
      if (entry.isDirectory()) out.push(...await walk(name));
      else if (/\.(js|woff2)$/.test(name)) out.push('/' + name);
    }
    return out;
  }
  const scripts = (await walk("src")).filter(name => !name.endsWith("offline-worker.js"));
  const assets = [
    'https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.82/+esm',
    'https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/+esm',
    '/', '/pdf-en-audio/', '/text-to-speech/', '/voix-off/', '/message-repondeur/', '/manifest.webmanifest', '/apple-touch-icon.png', '/icon-192.png', '/styles/machine.css?v=' + version,
    ...await walk("assets"), ...scripts, ...scripts.map(name => name + '?v=' + version)];
  return `// Généré par npm run build.\nconst VERSION = ${JSON.stringify(version)}, ASSETS = ${JSON.stringify(assets)};\n` + await readFile(path.join(root, "src/offline-worker.js"), "utf8");
}
