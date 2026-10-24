import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Port préféré fixe : l'OPFS (cache des modèles de voix) est rangé par origine,
// et l'origine contient le port. Même port d'un passage à l'autre = modèles déjà en cache.
// S'il est pris, on se rabat sur un port libre quelconque.
const PREFERRED_PORT = 4173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

async function handle(req, res) {
  try {
    const { pathname } = new URL(req.url, "http://x");
    let file = path.join(ROOT, decodeURIComponent(pathname));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const s = await stat(file).catch(() => null);
    if (s?.isDirectory()) file = path.join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404");
  }
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => { server.off("listening", onListening); reject(err); };
    const onListening = () => { server.off("error", onError); resolve(); };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "127.0.0.1");
  });
}

export async function startServer() {
  const server = http.createServer(handle);
  try {
    await listen(server, PREFERRED_PORT);
  } catch (err) {
    if (err.code !== "EADDRINUSE") throw err;
    await listen(server, 0);
  }
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => {
      server.closeAllConnections?.();
      server.close(() => resolve());
    }),
  };
}

export async function launch({
  profile = "tests/e2e/.chrome-profile",
  viewport = { width: 1340, height: 900 },
  reducedMotion = false,
} = {}) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    userDataDir: path.resolve(ROOT, profile),
    defaultViewport: viewport,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const [first] = await browser.pages();
  const page = first ?? (await browser.newPage());
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  return { browser, page };
}
