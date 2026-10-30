import { test } from "node:test";
import assert from "node:assert/strict";

// Un navigateur minimal : adresse, stockage local, historique et réseau observés.
let loads = 0;
function browserAt(url) {
  const address = new URL(url), store = new Map(), posts = [];
  globalThis.location = { hostname: address.hostname, pathname: address.pathname, search: address.search, hash: address.hash };
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.history = { replaceState: (_, __, next) => { const n = new URL(next, address); Object.assign(location, { pathname: n.pathname, search: n.search, hash: n.hash }); } };
  globalThis.fetch = async (_, init) => { posts.push(init.body); return new Response(null, { status: 204 }); };
  return { store, posts, load: () => import(`../../src/usage.js?load=${++loads}`) };
}

test("compteur : une visite normale envoie l'événement", async () => {
  const b = browserAt("https://speechsynthe.si/");
  const usage = await b.load();
  assert.equal(usage.ownerChange, null);
  usage.countUsage("listen-text-fr");
  assert.deepEqual(b.posts, ["listen-text-fr"]);
});

test("compteur : /?moi coupe les envois sur cet appareil et disparaît de l'adresse", async () => {
  const b = browserAt("https://speechsynthe.si/?moi#chapitre");
  const usage = await b.load();
  assert.equal(usage.ownerChange, "on");
  assert.equal(location.search, "");
  assert.equal(location.hash, "#chapitre");
  usage.countUsage("listen-text-fr");
  assert.deepEqual(b.posts, []);
  assert.equal(usage.isOwner(), true);
});

test("compteur : le drapeau reste sur l'appareil aux visites suivantes, /?moi=0 le retire", async () => {
  const b = browserAt("https://speechsynthe.si/?moi");
  await b.load();
  Object.assign(location, { search: "?moi=0&s=1" });
  const back = await b.load();
  assert.equal(back.ownerChange, "off");
  assert.equal(location.search, "?s=1");
  back.countUsage("export-mp3-fr");
  assert.deepEqual(b.posts, ["export-mp3-fr"]);
  assert.equal(b.store.size, 0);
});
