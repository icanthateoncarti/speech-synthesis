import { test } from "node:test";
import assert from "node:assert/strict";
import { createSpeechCache } from "../../src/speech-cache.js";

test("le cache respecte le budget mémoire et évince le passage le moins récemment utilisé", () => {
  const cache = createSpeechCache(10);
  const a = new ArrayBuffer(4), b = new ArrayBuffer(4), c = new ArrayBuffer(6);
  cache.put("a", a); cache.put("b", b);
  assert.equal(cache.get("a"), a);
  cache.put("c", c);
  assert.equal(cache.get("b"), undefined);
  assert.equal(cache.get("a"), a);
  cache.put("too-big", new ArrayBuffer(11));
  assert.equal(cache.get("too-big"), undefined);
  assert.equal(cache.get("c"), c);
  cache.clear(); assert.equal(cache.get("a"), undefined);
});

test("le nombre de clés est aussi borné, même avec de très petits buffers", () => {
  const cache = createSpeechCache();
  for (let i = 0; i < 130; i++) cache.put(String(i), new ArrayBuffer(1));
  assert.equal(cache.get("0"), undefined);
  assert.equal(cache.get("1"), undefined);
  assert.ok(cache.get("2")); assert.ok(cache.get("129"));
});
