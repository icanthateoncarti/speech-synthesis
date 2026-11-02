// Généré par npm run build.
const VERSION = "e7957589dd", ASSETS = ["https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.82/+esm","https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/+esm","/","/pdf-en-audio/","/text-to-speech/","/voix-off/","/message-repondeur/","/manifest.webmanifest","/apple-touch-icon.png","/icon-192.png","/styles/machine.css?v=e7957589dd","/assets/fonts/archivo-black-latin.woff2","/assets/fonts/archivo-latin.woff2","/assets/fonts/dotgothic16-latin-ext.woff2","/assets/fonts/dotgothic16-latin.woff2","/assets/fonts/ibm-plex-mono-500-latin.woff2","/assets/fonts/ibm-plex-mono-600-latin.woff2","/src/article.js","/src/audio.js","/src/boot.js","/src/document-cleanup.js","/src/document-review.js","/src/library-dialog.js","/src/library-store.js","/src/limits.js","/src/machine.js","/src/main.js","/src/mp3-encode.js","/src/mp3-export.js","/src/mp3-stream.js","/src/mp3-worker.js","/src/navigation.js","/src/ocr-worker.js","/src/ocr.js","/src/pages.js","/src/pdf-layout.js","/src/pdf-tables.js","/src/pdf-worker.js","/src/pdf.js","/src/player.js","/src/pptx.js","/src/selection.js","/src/session-data.js","/src/shader.js","/src/share-config.js","/src/share-crypto.js","/src/share-dialog.js","/src/share-location.js","/src/share.js","/src/speech-cache.js","/src/spoken.js","/src/text-map.js","/src/text.js","/src/tts-worker.js","/src/tts.js","/src/typewriter.js","/src/usage.js","/src/vendor/vits-web/piper-DeOu3H9E.js","/src/vendor/vits-web/vits-web.js","/src/voice-commands.js","/src/article.js?v=e7957589dd","/src/audio.js?v=e7957589dd","/src/boot.js?v=e7957589dd","/src/document-cleanup.js?v=e7957589dd","/src/document-review.js?v=e7957589dd","/src/library-dialog.js?v=e7957589dd","/src/library-store.js?v=e7957589dd","/src/limits.js?v=e7957589dd","/src/machine.js?v=e7957589dd","/src/main.js?v=e7957589dd","/src/mp3-encode.js?v=e7957589dd","/src/mp3-export.js?v=e7957589dd","/src/mp3-stream.js?v=e7957589dd","/src/mp3-worker.js?v=e7957589dd","/src/navigation.js?v=e7957589dd","/src/ocr-worker.js?v=e7957589dd","/src/ocr.js?v=e7957589dd","/src/pages.js?v=e7957589dd","/src/pdf-layout.js?v=e7957589dd","/src/pdf-tables.js?v=e7957589dd","/src/pdf-worker.js?v=e7957589dd","/src/pdf.js?v=e7957589dd","/src/player.js?v=e7957589dd","/src/pptx.js?v=e7957589dd","/src/selection.js?v=e7957589dd","/src/session-data.js?v=e7957589dd","/src/shader.js?v=e7957589dd","/src/share-config.js?v=e7957589dd","/src/share-crypto.js?v=e7957589dd","/src/share-dialog.js?v=e7957589dd","/src/share-location.js?v=e7957589dd","/src/share.js?v=e7957589dd","/src/speech-cache.js?v=e7957589dd","/src/spoken.js?v=e7957589dd","/src/text-map.js?v=e7957589dd","/src/text.js?v=e7957589dd","/src/tts-worker.js?v=e7957589dd","/src/tts.js?v=e7957589dd","/src/typewriter.js?v=e7957589dd","/src/usage.js?v=e7957589dd","/src/vendor/vits-web/piper-DeOu3H9E.js?v=e7957589dd","/src/vendor/vits-web/vits-web.js?v=e7957589dd","/src/voice-commands.js?v=e7957589dd"];
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
