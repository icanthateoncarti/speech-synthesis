import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { tweetLength, ANNOUNCEMENT_FILE } from "../../scripts/annonces.mjs";

test("décompte façon X : un lien vaut 23 caractères, un emoji 2", () => {
  assert.equal(tweetLength("abc"), 3);
  assert.equal(tweetLength("Go to speechsynthe.si now"), 6 + 23 + 4);
  assert.equal(tweetLength("https://github.com/icanthateoncarti/speech-synthesis"), 23);
  assert.equal(tweetLength("🔊 ok"), 5);
});

test("chaque annonce est un tweet prêt à poster : nom daté, non vide, 280 caractères au plus", async () => {
  const dir = new URL("../../annonces/", import.meta.url);
  const files = (await readdir(dir)).filter((name) => name.endsWith(".md"));
  assert.ok(files.length >= 1);
  for (const name of files) {
    assert.match(`annonces/${name}`, ANNOUNCEMENT_FILE, `${name} : nom attendu AAAA-MM-JJ-sujet.md`);
    const text = (await readFile(new URL(name, dir), "utf8")).trim();
    assert.ok(text.length > 20, `${name} : annonce vide`);
    assert.ok(tweetLength(text) <= 280, `${name} : ${tweetLength(text)} caractères comptés par X (280 max)`);
    assert.ok(/speechsynthe\.si/.test(text), `${name} : le tweet doit nommer speechsynthe.si`);
  }
});
