// Généré par npm run build.
const VERSION = "b0696911aa", ASSETS = ["https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.82/+esm","https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/+esm","/","/pdf-en-audio/","/text-to-speech/","/voix-off/","/message-repondeur/","/manifest.webmanifest","/apple-touch-icon.png","/icon-192.png","/styles/machine.css?v=b0696911aa","/assets/fonts/archivo-black-latin.woff2","/assets/fonts/archivo-latin.woff2","/assets/fonts/dotgothic16-latin-ext.woff2","/assets/fonts/dotgothic16-latin.woff2","/assets/fonts/ibm-plex-mono-500-latin.woff2","/assets/fonts/ibm-plex-mono-600-latin.woff2","/src/article.js","/src/audio.js","/src/boot.js","/src/document-cleanup.js","/src/document-review.js","/src/library-dialog.js","/src/library-store.js","/src/limits.js","/src/machine.js","/src/main.js","/src/mp3-encode.js","/src/mp3-export.js","/src/mp3-fast.js","/src/mp3-stream.js","/src/mp3-worker.js","/src/navigation.js","/src/ocr-worker.js","/src/ocr.js","/src/pages.js","/src/pdf-layout.js","/src/pdf-tables.js","/src/pdf-worker.js","/src/pdf.js","/src/player.js","/src/pptx.js","/src/selection.js","/src/session-data.js","/src/shader.js","/src/share-config.js","/src/share-crypto.js","/src/share-dialog.js","/src/share-location.js","/src/share.js","/src/speech-cache.js","/src/spoken.js","/src/stream-iteration.js","/src/text-map.js","/src/text.js","/src/tts-worker.js","/src/tts.js","/src/typewriter.js","/src/usage.js","/src/vendor/vits-web/piper-DeOu3H9E.js","/src/vendor/vits-web/vits-web.js","/src/voice-commands.js","/src/article.js?v=b0696911aa","/src/audio.js?v=b0696911aa","/src/boot.js?v=b0696911aa","/src/document-cleanup.js?v=b0696911aa","/src/document-review.js?v=b0696911aa","/src/library-dialog.js?v=b0696911aa","/src/library-store.js?v=b0696911aa","/src/limits.js?v=b0696911aa","/src/machine.js?v=b0696911aa","/src/main.js?v=b0696911aa","/src/mp3-encode.js?v=b0696911aa","/src/mp3-export.js?v=b0696911aa","/src/mp3-fast.js?v=b0696911aa","/src/mp3-stream.js?v=b0696911aa","/src/mp3-worker.js?v=b0696911aa","/src/navigation.js?v=b0696911aa","/src/ocr-worker.js?v=b0696911aa","/src/ocr.js?v=b0696911aa","/src/pages.js?v=b0696911aa","/src/pdf-layout.js?v=b0696911aa","/src/pdf-tables.js?v=b0696911aa","/src/pdf-worker.js?v=b0696911aa","/src/pdf.js?v=b0696911aa","/src/player.js?v=b0696911aa","/src/pptx.js?v=b0696911aa","/src/selection.js?v=b0696911aa","/src/session-data.js?v=b0696911aa","/src/shader.js?v=b0696911aa","/src/share-config.js?v=b0696911aa","/src/share-crypto.js?v=b0696911aa","/src/share-dialog.js?v=b0696911aa","/src/share-location.js?v=b0696911aa","/src/share.js?v=b0696911aa","/src/speech-cache.js?v=b0696911aa","/src/spoken.js?v=b0696911aa","/src/stream-iteration.js?v=b0696911aa","/src/text-map.js?v=b0696911aa","/src/text.js?v=b0696911aa","/src/tts-worker.js?v=b0696911aa","/src/tts.js?v=b0696911aa","/src/typewriter.js?v=b0696911aa","/src/usage.js?v=b0696911aa","/src/vendor/vits-web/piper-DeOu3H9E.js?v=b0696911aa","/src/vendor/vits-web/vits-web.js?v=b0696911aa","/src/voice-commands.js?v=b0696911aa"];
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
// GitHub Pages ne permet pas d'ajouter d'en-têtes : c'est ce service worker qui isole
// la page (COOP + COEP). Isolée, elle peut faire calculer la voix sur plusieurs cœurs
// (SharedArrayBuffer), environ deux fois plus vite. Toutes les ressources tierces
// (jsDelivr, cdnjs, Hugging Face, Cloudflare) envoient déjà CORS ou CORP cross-origin.
const isolated = res => {
  if (!res || res.type === "opaqueredirect" || res.type === "opaque" || res.status === 0) return res;
  const headers = new Headers(res.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};
self.addEventListener("fetch", event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const own = url.origin === self.location.origin;
  const runtime = /^(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(url.hostname);
  if (!own && !runtime) return; // statistiques, partage et modèles OPFS : pas de copie ici
  if (own && !req.url.includes("/src/") && !req.url.includes("/assets/") && !req.url.includes("/styles/") && req.mode !== "navigate" && !ASSETS.includes(url.pathname)) return;
  event.respondWith((async () => {
    const res = await respond();
    return own ? isolated(res) : res;
  })());
  async function respond() {
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
  }
});
