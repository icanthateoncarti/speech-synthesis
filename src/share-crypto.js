import { sessionData } from "./session-data.js";
const MAX_CIPHER = 512 * 1024, MAX_PLAIN = 8 * 1024 * 1024;
export const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
function unbase64(value, length) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Clé de partage invalide.");
  const bytes = Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  if (bytes.length !== length) throw new Error("Clé de partage invalide.");
  return bytes;
}
export async function bounded(stream, limit) {
  const reader = stream.getReader(), parts = []; let count = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      count += value.length; if (count > limit) { await reader.cancel(); throw new Error("Session trop volumineuse."); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Uint8Array(await new Blob(parts).arrayBuffer());
}
export async function sealSession(value) {
  const data = new TextEncoder().encode(JSON.stringify(sessionData(value)));
  if (data.length > MAX_PLAIN) throw new Error("Session trop volumineuse.");
  const compressed = await bounded(new Blob([data]).stream().pipeThrough(new CompressionStream("gzip")), MAX_CIPHER - 28);
  const secret = crypto.getRandomValues(new Uint8Array(32)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", secret, "AES-GCM", false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, compressed);
  return { key: base64url(secret), body: new Blob([iv, encrypted], { type: "application/octet-stream" }) };
}
export async function unsealSession(body, secret) {
  if (body.byteLength < 29 || body.byteLength > MAX_CIPHER) throw new Error("Session invalide.");
  const bytes = new Uint8Array(body), key = await crypto.subtle.importKey("raw", unbase64(secret, 32), "AES-GCM", false, ["decrypt"]);
  let compressed;
  try { compressed = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12)); }
  catch { throw new Error("Lien incomplet ou clé de partage incorrecte."); }
  const raw = await bounded(new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip")), MAX_PLAIN);
  return sessionData(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)));
}
export function parseSharedFragment(fragment) {
  const match = /^#session=([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/.exec(fragment);
  if (!match) throw new Error("Lien de session incomplet ou invalide.");
  return { id: match[1], key: match[2] };
}
