// Généré par npm run build.
const VERSION = "82ce9dbed5", ASSETS = ["https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.82/+esm","https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/+esm","/","/pdf-en-audio/","/text-to-speech/","/voix-off/","/message-repondeur/","/manifest.webmanifest","/apple-touch-icon.png","/icon-192.png","/styles/machine.css?v=82ce9dbed5","/assets/fonts/archivo-black-latin.woff2","/assets/fonts/archivo-latin.woff2","/assets/fonts/dotgothic16-latin-ext.woff2","/assets/fonts/dotgothic16-latin.woff2","/assets/fonts/ibm-plex-mono-500-latin.woff2","/assets/fonts/ibm-plex-mono-600-latin.woff2","/src/audio.js","/src/boot.js","/src/cleanup-dialog.js","/src/document-cleanup.js","/src/document-review.js","/src/library-dialog.js","/src/library-store.js","/src/limits.js","/src/machine.js","/src/main.js","/src/mp3-encode.js","/src/mp3-export.js","/src/mp3-stream.js","/src/mp3-worker.js","/src/navigation.js","/src/ocr-worker.js","/src/ocr.js","/src/pages.js","/src/pdf-layout.js","/src/pdf-tables.js","/src/pdf-worker.js","/src/pdf.js","/src/player.js","/src/pptx.js","/src/selection.js","/src/session-data.js","/src/shader.js","/src/share-config.js","/src/share-crypto.js","/src/share-dialog.js","/src/share-location.js","/src/share.js","/src/speech-cache.js","/src/spoken.js","/src/text-map.js","/src/text.js","/src/tts-worker.js","/src/tts.js","/src/vendor/vits-web/piper-DeOu3H9E.js","/src/vendor/vits-web/vits-web.js","/src/voice-commands.js","/src/audio.js?v=82ce9dbed5","/src/boot.js?v=82ce9dbed5","/src/cleanup-dialog.js?v=82ce9dbed5","/src/document-cleanup.js?v=82ce9dbed5","/src/document-review.js?v=82ce9dbed5","/src/library-dialog.js?v=82ce9dbed5","/src/library-store.js?v=82ce9dbed5","/src/limits.js?v=82ce9dbed5","/src/machine.js?v=82ce9dbed5","/src/main.js?v=82ce9dbed5","/src/mp3-encode.js?v=82ce9dbed5","/src/mp3-export.js?v=82ce9dbed5","/src/mp3-stream.js?v=82ce9dbed5","/src/mp3-worker.js?v=82ce9dbed5","/src/navigation.js?v=82ce9dbed5","/src/ocr-worker.js?v=82ce9dbed5","/src/ocr.js?v=82ce9dbed5","/src/pages.js?v=82ce9dbed5","/src/pdf-layout.js?v=82ce9dbed5","/src/pdf-tables.js?v=82ce9dbed5","/src/pdf-worker.js?v=82ce9dbed5","/src/pdf.js?v=82ce9dbed5","/src/player.js?v=82ce9dbed5","/src/pptx.js?v=82ce9dbed5","/src/selection.js?v=82ce9dbed5","/src/session-data.js?v=82ce9dbed5","/src/shader.js?v=82ce9dbed5","/src/share-config.js?v=82ce9dbed5","/src/share-crypto.js?v=82ce9dbed5","/src/share-dialog.js?v=82ce9dbed5","/src/share-location.js?v=82ce9dbed5","/src/share.js?v=82ce9dbed5","/src/speech-cache.js?v=82ce9dbed5","/src/spoken.js?v=82ce9dbed5","/src/text-map.js?v=82ce9dbed5","/src/text.js?v=82ce9dbed5","/src/tts-worker.js?v=82ce9dbed5","/src/tts.js?v=82ce9dbed5","/src/vendor/vits-web/piper-DeOu3H9E.js?v=82ce9dbed5","/src/vendor/vits-web/vits-web.js?v=82ce9dbed5","/src/voice-commands.js?v=82ce9dbed5"];
// VERSION et ASSETS (application et bibliothèques de démarrage) sont injectés par le build dans /sw.js.
const CACHE = "radio-app-" + VERSION;
self.addEventListener("install", event => event.waitUntil((async () => {
  await (await caches.open(CACHE)).addAll(ASSETS);
  await self.skipWaiting();
})()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  const versions = (await caches.keys()).filter(key => key.startsWith("radio-app-"));
  for (const key of versions.slice(0, -2)) if (key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener("fetch", event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const own = url.origin === self.location.origin;
  const runtime = /^(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(url.hostname);
  if (!own && !runtime) return; // statistiques, partage et modèles OPFS : pas de copie ici
  if (own && !req.url.includes("/src/") && !req.url.includes("/assets/") && !req.url.includes("/styles/") && req.mode !== "navigate" && !ASSETS.includes(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (req.mode === "navigate") {
      try { return await fetch(req); }
      catch { return await cache.match(url.pathname) ?? await cache.match("/"); }
    }
    // Les versions précédentes restent utilisables pour les onglets déjà ouverts.
    const hit = await cache.match(req) ?? (url.search ? await caches.match(req) : undefined);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.type !== "opaque" && Number(res.headers.get("content-length") || 0) < 40 * 1024 * 1024) event.waitUntil(cache.put(req, res.clone()).catch(() => {}));
    return res;
  })());
});
