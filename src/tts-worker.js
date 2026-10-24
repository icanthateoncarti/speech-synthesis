// Worker module : fait tourner vits-web (phonémisation + ONNX) hors du fil de la page.
// Un message = une tâche ; les tâches passent l'une après l'autre.
//   reçoit : { id, type: "synthesize", text, voiceId, lengthScale } | { id, type: "download", voiceId }
//   envoie : { id, type: "progress", pct } | { id, type: "done", wav? } | { id, type: "error", kind, message }
import { predict, download, PATH_MAP } from "./vendor/vits-web/vits-web.js";

// --- réseau : tout échec de fetch pendant une tâche la classe en "network" ---------------
// vits-web ne vérifie jamais res.ok : une page d'erreur serait mise en cache comme modèle.
// On lève donc aussi une erreur sur toute réponse non OK, et sur une coupure en cours de flux.
let netFailure = null;

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
}

const nativeFetch = self.fetch.bind(self);

self.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input?.url ?? String(input);
  const fail = (why) => {
    const err = new NetworkError(`${why} : ${url}`);
    netFailure ??= err;
    return err;
  };
  let res;
  try {
    res = await nativeFetch(input, init);
  } catch (e) {
    throw fail(e?.message || "fetch impossible");
  }
  if (!res.ok) throw fail(`HTTP ${res.status}`);
  if (!res.body) return res;
  const reader = res.body.getReader();
  const body = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (e) {
        controller.error(fail(e?.message || "flux interrompu"));
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
};

// L'import d'onnxruntime-web depuis le CDN échoue par un TypeError, pas par notre fetch.
const looksLikeNetwork = (err) =>
  err instanceof NetworkError ||
  /Failed to fetch|NetworkError|network error|dynamically imported module|Load failed/i.test(String(err?.message ?? err));

// --- cache OPFS ---------------------------------------------------------------------------
// vits-web range les fichiers dans OPFS /piper/<nom>. getFileHandle({create:true}) crée un
// fichier vide avant l'écriture : interrompue (cancel → terminate, onglet fermé), elle laisse
// un fichier de 0 octet que vits-web prendrait pour un modèle en cache.
const cacheNames = (voiceId) => {
  const name = PATH_MAP[voiceId].split("/").at(-1);
  return [name, `${name}.json`];
};

async function piperDir() {
  return (await navigator.storage.getDirectory()).getDirectoryHandle("piper", { create: true });
}

async function cachedSizes(voiceId) {
  const dir = await piperDir();
  const out = {};
  for (const name of cacheNames(voiceId)) {
    try {
      out[name] = (await (await dir.getFileHandle(name)).getFile()).size;
    } catch {
      out[name] = null;
    }
  }
  return out;
}

async function dropEmptyCache(voiceId) {
  try {
    const dir = await piperDir();
    for (const [name, size] of Object.entries(await cachedSizes(voiceId))) {
      if (size === 0) await dir.removeEntry(name).catch(() => {});
    }
  } catch {
    // OPFS indisponible : vits-web retéléchargera, rien à nettoyer
  }
}

// download() de vits-web n'attend pas la fin des écritures OPFS : on attend qu'elles aboutissent.
async function waitForCache(voiceId, timeoutMs = 60_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    let sizes;
    try {
      sizes = await cachedSizes(voiceId);
    } catch {
      return; // OPFS indisponible : rien à attendre
    }
    if (Object.values(sizes).every((s) => s > 0)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("le modèle téléchargé n'a pas pu être écrit dans le cache");
}

// --- erreurs perdues par vits-web ----------------------------------------------------------
// L'init de piper est faite dans `new Promise(async …)` : une erreur là ne rejette jamais
// predict(). On la récupère via unhandledrejection / error et on fait échouer la tâche.
let failCurrent = null;
self.addEventListener("unhandledrejection", (e) => {
  if (failCurrent) {
    e.preventDefault();
    failCurrent(e.reason);
  }
});
self.addEventListener("error", (e) => {
  if (failCurrent) {
    e.preventDefault();
    failCurrent(e.error ?? new Error(e.message));
  }
});

// --- tâches --------------------------------------------------------------------------------
const toPct = (p) => (p?.total > 0 ? Math.min(100, Math.round((p.loaded * 100) / p.total)) : null);

async function run(msg) {
  const { id, type, voiceId } = msg;
  if (!(voiceId in PATH_MAP)) throw new Error(`voix inconnue : ${voiceId}`);
  let last = -1;
  const onProgress = (p) => {
    const pct = toPct(p);
    if (pct !== null && pct !== last) {
      last = pct;
      self.postMessage({ id, type: "progress", pct });
    }
  };
  await dropEmptyCache(voiceId);
  if (type === "download") {
    await download(voiceId, onProgress);
    await waitForCache(voiceId);
    self.postMessage({ id, type: "done" });
    return;
  }
  if (type === "synthesize") {
    const blob = await predict({ text: msg.text, voiceId, lengthScale: msg.lengthScale }, onProgress);
    const wav = await blob.arrayBuffer();
    self.postMessage({ id, type: "done", wav }, [wav]);
    return;
  }
  throw new Error(`message inconnu : ${type}`);
}

let queue = Promise.resolve();

self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    netFailure = null;
    try {
      await new Promise((resolve, reject) => {
        failCurrent = reject;
        run(data).then(resolve, reject);
      });
    } catch (err) {
      const kind = netFailure || looksLikeNetwork(err) ? "network" : "other";
      self.postMessage({
        id: data?.id,
        type: "error",
        kind,
        message: String(netFailure?.message ?? err?.message ?? err),
      });
    } finally {
      failCurrent = null;
    }
  });
};
