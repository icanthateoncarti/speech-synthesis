// Généré par npm run build.
const VERSION = "b734412a4c", ASSETS = ["https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.82/+esm","https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/+esm","/","/pdf-en-audio/","/text-to-speech/","/voix-off/","/message-repondeur/","/manifest.webmanifest","/apple-touch-icon.png","/icon-192.png","/styles/machine.css?v=b734412a4c","/assets/fonts/archivo-black-latin.woff2","/assets/fonts/archivo-latin.woff2","/assets/fonts/dotgothic16-latin-ext.woff2","/assets/fonts/dotgothic16-latin.woff2","/assets/fonts/ibm-plex-mono-500-latin.woff2","/assets/fonts/ibm-plex-mono-600-latin.woff2","/src/audio.js","/src/boot.js","/src/cleanup-dialog.js","/src/document-cleanup.js","/src/document-review.js","/src/library-dialog.js","/src/library-store.js","/src/limits.js","/src/machine.js","/src/main.js","/src/mp3-encode.js","/src/mp3-export.js","/src/mp3-stream.js","/src/mp3-worker.js","/src/navigation.js","/src/ocr-worker.js","/src/ocr.js","/src/pages.js","/src/pdf-layout.js","/src/pdf-tables.js","/src/pdf-worker.js","/src/pdf.js","/src/player.js","/src/pptx.js","/src/selection.js","/src/session-data.js","/src/shader.js","/src/share-config.js","/src/share-crypto.js","/src/share-dialog.js","/src/share-location.js","/src/share.js","/src/speech-cache.js","/src/spoken.js","/src/text-map.js","/src/text.js","/src/tts-worker.js","/src/tts.js","/src/typewriter.js","/src/usage.js","/src/vendor/vits-web/piper-DeOu3H9E.js","/src/vendor/vits-web/vits-web.js","/src/voice-commands.js","/src/audio.js?v=b734412a4c","/src/boot.js?v=b734412a4c","/src/cleanup-dialog.js?v=b734412a4c","/src/document-cleanup.js?v=b734412a4c","/src/document-review.js?v=b734412a4c","/src/library-dialog.js?v=b734412a4c","/src/library-store.js?v=b734412a4c","/src/limits.js?v=b734412a4c","/src/machine.js?v=b734412a4c","/src/main.js?v=b734412a4c","/src/mp3-encode.js?v=b734412a4c","/src/mp3-export.js?v=b734412a4c","/src/mp3-stream.js?v=b734412a4c","/src/mp3-worker.js?v=b734412a4c","/src/navigation.js?v=b734412a4c","/src/ocr-worker.js?v=b734412a4c","/src/ocr.js?v=b734412a4c","/src/pages.js?v=b734412a4c","/src/pdf-layout.js?v=b734412a4c","/src/pdf-tables.js?v=b734412a4c","/src/pdf-worker.js?v=b734412a4c","/src/pdf.js?v=b734412a4c","/src/player.js?v=b734412a4c","/src/pptx.js?v=b734412a4c","/src/selection.js?v=b734412a4c","/src/session-data.js?v=b734412a4c","/src/shader.js?v=b734412a4c","/src/share-config.js?v=b734412a4c","/src/share-crypto.js?v=b734412a4c","/src/share-dialog.js?v=b734412a4c","/src/share-location.js?v=b734412a4c","/src/share.js?v=b734412a4c","/src/speech-cache.js?v=b734412a4c","/src/spoken.js?v=b734412a4c","/src/text-map.js?v=b734412a4c","/src/text.js?v=b734412a4c","/src/tts-worker.js?v=b734412a4c","/src/tts.js?v=b734412a4c","/src/typewriter.js?v=b734412a4c","/src/usage.js?v=b734412a4c","/src/vendor/vits-web/piper-DeOu3H9E.js?v=b734412a4c","/src/vendor/vits-web/vits-web.js?v=b734412a4c","/src/voice-commands.js?v=b734412a4c"];
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
