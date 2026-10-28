// Données privées, uniquement dans le navigateur. Aucune synchronisation réseau.
const NAME = "speechsynthesi-library", VERSION = 1;
export const AUDIO_BUDGET = 200 * 1024 * 1024;
let database;
const request = req => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
});
async function db() {
  if (!globalThis.indexedDB) throw new Error("Stockage local indisponible dans ce navigateur.");
  database ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(NAME, VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("courses", { keyPath: "id" });
      const audio = req.result.createObjectStore("audio", { keyPath: "id" });
      audio.createIndex("course", "course");
      req.result.createObjectStore("meta");
    };
    req.onsuccess = () => { req.result.onversionchange = () => { req.result.close(); database = null; }; resolve(req.result); };
    req.onerror = () => { database = null; reject(req.error); };
    req.onblocked = () => { database = null; reject(new Error("Ferme les autres onglets de la radio puis réessaie.")); };
  });
  return database;
}
function done(tx) {
  const finished = new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onabort = () => reject(tx.error ?? new Error("Stockage interrompu")); tx.onerror = () => {}; });
  finished.catch(() => {}); // Une requête peut déjà avoir rejeté avant la fin de la transaction.
  return finished;
}
export async function saveCourse(course, { existingOnly = false } = {}) {
  const tx = (await db()).transaction("courses", "readwrite"), finished = done(tx);
  const existing = await request(tx.objectStore("courses").get(course.id));
  if (existingOnly && !existing) { await finished; return; }
  if (!existing && await request(tx.objectStore("courses").count()) >= 20) { await finished; throw new Error("La bibliothèque contient déjà 20 cours. Supprime un cours pour en ajouter un autre."); }
  tx.objectStore("courses").put({ ...course, updatedAt: Date.now() }); await finished;
}
export async function listCourses() {
  const tx = (await db()).transaction("courses");
  return (await request(tx.objectStore("courses").getAll())).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function getCourse(id) { return request((await db()).transaction("courses").objectStore("courses").get(id)); }
export async function removeCourse(id) {
  const tx = (await db()).transaction(["courses", "audio", "meta"], "readwrite"), finished = done(tx);
  tx.objectStore("courses").delete(id);
  const meta = tx.objectStore("meta"), store = tx.objectStore("audio");
  let bytes = (await request(meta.get("bytes"))) ?? 0;
  const rows = await request(store.index("course").getAll(IDBKeyRange.only(id)));
  for (const row of rows) { store.delete(row.id); bytes -= row.bytes; }
  meta.put(Math.max(0, bytes), "bytes"); await finished;
}
export async function audioUsage() { return (await request((await db()).transaction("meta").objectStore("meta").get("bytes"))) ?? 0; }
export function courseAudioStore(course, onError = () => {}) {
  let disabled = false;
  const key = async value => {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
    return course + ":" + Array.from(digest, b => b.toString(16).padStart(2, "0")).join("");
  };
  return {
    async get(value) {
      if (disabled) return;
      try { const id = await key(value); return await (await request((await db()).transaction("audio").objectStore("audio").get(id)))?.wav.arrayBuffer(); }
      catch (error) { disabled = true; onError(error); }
    },
    async put(value, wav) {
      if (disabled) return;
      try {
        const id = await key(value), connection = await db();
        const tx = connection.transaction(["courses", "audio", "meta"], "readwrite"), finished = done(tx);
        // Une suppression dans un autre onglet ne doit pas ressusciter ses audios.
        if (!await request(tx.objectStore("courses").get(course))) { await finished; return; }
        const store = tx.objectStore("audio"), meta = tx.objectStore("meta");
        const previous = await request(store.get(id));
        if (previous) { await finished; return; }
        const bytes = ((await request(meta.get("bytes"))) ?? 0) - (previous?.bytes ?? 0) + wav.byteLength;
        if (bytes > AUDIO_BUDGET) { await finished; throw new Error("La bibliothèque audio atteint 200 Mo. Supprime un cours pour libérer de la place. La lecture peut continuer."); }
        store.put({ id, course, wav: new Blob([wav], { type: "audio/wav" }), bytes: wav.byteLength });
        meta.put(bytes, "bytes"); await finished;
      } catch (error) { disabled = true; onError(error); }
    },
  };
}
