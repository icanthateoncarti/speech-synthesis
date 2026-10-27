import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeText } from "../../src/text.js";
import { normalizeWithMap } from "../../src/text-map.js";

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

// Un caractère est visible s'il n'est ni un espace ni un caractère de contrôle :
// normalizeText les supprime ou les remplace, donc ils n'ont pas à s'aligner.
const VISIBLE = /[^\s\p{Cc}]/u;

function check(raw, label) {
  const { text, map } = normalizeWithMap(raw);
  assert.equal(text, normalizeText(raw), label);
  assert.equal(map.length, raw.length + 1, label);
  assert.equal(map[raw.length], text.length, label);
  let previous = 0;
  for (let i = 0; i < raw.length; i++) {
    assert.ok(map[i] >= previous && map[i] <= text.length, `table croissante en ${i} (${label})`);
    previous = map[i];
    if (VISIBLE.test(raw[i])) assert.equal(text[map[i]], raw[i], `caractère visible ${i} aligné (${label})`);
  }
}

test("normalizeWithMap : espaces insécables, tabulations, CRLF, contrôles et emojis", () => {
  const raw = "a\u00A0b\tc\r\nd\u0000e\u0007f\u007Fg😀";
  assert.equal(normalizeText(raw), "a b c\ndefg😀");
  check(raw, "cas explicite");
  check("👩‍💻 et 🏳️‍🌈", "emoji composés");
  check("e\u0301", "accent combinant");
  check("a\u202Fb", "espace fine insécable");
  check("a\u200Bb", "espace de largeur nulle");
});

test("normalizeWithMap : 2 000 textes aléatoires gardent le même texte et une table croissante", () => {
  const alphabet = [
    "a", "Z", "é", "ç", "0", " ", "  ", "\t", "\n", "\r\n", "\r",
    "\u00A0", "\u202F", "\u200B", "\u0000", "\u0001", "\u0007", "\u007F",
    "😀", "🚀", "👩‍💻", "🏳️‍🌈", "→", "—", ".", "'", "\u0301",
  ];
  const random = seeded(20261027);
  for (let n = 0; n < 2000; n++) {
    let raw = "";
    const parts = Math.floor(random() * 25);
    for (let k = 0; k < parts; k++) raw += alphabet[Math.floor(random() * alphabet.length)];
    check(raw, `texte ${n}`);
  }
});
