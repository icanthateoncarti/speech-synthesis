const MAX_BODY = 512 * 1024, WEEK = 7 * 86400_000;
const ID = /^[A-Za-z0-9_-]{22}$/, HASH = /^[a-f0-9]{64}$/;
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
export const digest = async value => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
export async function limitedBody(request) {
  if (+request.headers.get("content-length") > MAX_BODY) throw new Error("size");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("size");
  const parts = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new Error("size"); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  if (size < 29) throw new Error("size");
  const data = new Uint8Array(size); let offset = 0;
  for (const part of parts) { data.set(part, offset); offset += part.length; }
  return data;
}
const response = (body, status = 200, headers = {}) => new Response(body, { status, headers });
export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin");
    const allowed = ["https://speechsynthe.si", "https://www.speechsynthe.si"];
    if (env.DEV_ORIGIN) allowed.push(env.DEV_ORIGIN);
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Vary": "Origin", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'" };
    if (!allowed.includes(origin)) return response("Origin refused", 403, headers);
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Expose-Headers"] = "X-Expires-At, Retry-After";
    if (request.method === "OPTIONS") return response(null, 204, { ...headers, "Access-Control-Allow-Methods": "GET, POST, DELETE", "Access-Control-Allow-Headers": "Content-Type, X-Delete-Hash, Authorization", "Access-Control-Max-Age": "600" });
    const path = new URL(request.url).pathname;
    if (path !== "/sessions" && !/^\/sessions\/[A-Za-z0-9_-]{22}$/.test(path)) return response("Not found", 404, headers);
    if (!["GET", "POST", "DELETE"].includes(request.method)) return response("Method refused", 405, headers);
    try {
      const forwarded = new Request(request);
      forwarded.headers.set("X-Client-Hash", await digest((request.headers.get("cf-connecting-ip") || "local") + ":" + Math.floor(Date.now() / 86400_000)));
      const result = await env.SESSIONS.get(env.SESSIONS.idFromName("sessions-v1")).fetch(forwarded);
      const output = new Response(result.body, result);
      for (const [key, value] of Object.entries(headers)) output.headers.set(key, value);
      return output;
    } catch { return response("Service unavailable", 503, headers); }
  },
};
export class SessionStore {
  constructor(ctx) {
    this.ctx = ctx; this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, body BLOB NOT NULL, deletion TEXT NOT NULL, expires INTEGER NOT NULL)");
    this.sql.exec("CREATE INDEX IF NOT EXISTS expiry ON sessions(expires)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS limits (id TEXT PRIMARY KEY, n INTEGER NOT NULL, expires INTEGER NOT NULL)");
  }
  take(key, max, window, now) {
    const id = key + ":" + Math.floor(now / window);
    const row = [...this.sql.exec("SELECT n FROM limits WHERE id = ?", id)][0];
    if ((row?.n ?? 0) >= max) return false;
    this.sql.exec("INSERT INTO limits(id,n,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET n=n+1", id, now + window * 2);
    return true;
  }
  async fetch(request) {
    const now = Date.now(), ip = request.headers.get("X-Client-Hash");
    if (!await this.ctx.storage.getAlarm()) await this.ctx.storage.setAlarm(now + 3600_000);
    if (!ip) return response("Refused", 403);
    const allowed = this.ctx.storage.transactionSync(() => this.take("read:" + ip, 100, 60_000, now) && this.take("all", 2000, 60_000, now));
    if (!allowed) return response("Too many requests", 429, { "Retry-After": "60" });
    const id = new URL(request.url).pathname.split("/")[2];
    if (request.method === "POST" && !id) {
      const deletion = request.headers.get("X-Delete-Hash");
      if (!HASH.test(deletion ?? "") || request.headers.get("content-type") !== "application/octet-stream") return response("Invalid request", 400);
      if (!this.ctx.storage.transactionSync(() => this.take("create:" + ip, 5, 3600_000, now) && this.take("create-global", 100, 86400_000, now))) return response("Upload limit reached", 429, { "Retry-After": "3600" });
      let body; try { body = await limitedBody(request); } catch { return response("Session too large", 413); }
      const token = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      const expires = now + WEEK;
      const stored = this.ctx.storage.transactionSync(() => {
        this.sql.exec("DELETE FROM sessions WHERE expires <= ?", now);
        const usage = [...this.sql.exec("SELECT COALESCE(SUM(length(body)),0) AS bytes FROM sessions")][0].bytes;
        if (usage + body.length > 200 * 1024 * 1024) return false;
        this.sql.exec("INSERT INTO sessions VALUES(?,?,?,?)", token, body, deletion, expires); return true;
      });
      if (!stored) return response("Storage full", 503);
      return response(JSON.stringify({ id: token, expires }), 201, { "Content-Type": "application/json" });
    }
    if (!ID.test(id ?? "")) return response("Not found", 404);
    const row = [...this.sql.exec("SELECT * FROM sessions WHERE id = ?", id)][0];
    if (!row || row.expires <= now) { if (row) this.sql.exec("DELETE FROM sessions WHERE id = ?", id); return response("Expired or removed", 404); }
    if (request.method === "GET") return response(row.body, 200, { "Content-Type": "application/octet-stream", "X-Expires-At": String(row.expires) });
    if (request.method === "DELETE") {
      const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
      if (!token || token.length !== 43 || await digest(token) !== row.deletion) return response("Refused", 403);
      this.sql.exec("DELETE FROM sessions WHERE id = ?", id); return response(null, 204);
    }
    return response("Method refused", 405);
  }
  async alarm() {
    const now = Date.now();
    this.sql.exec("DELETE FROM sessions WHERE expires <= ?", now);
    this.sql.exec("DELETE FROM limits WHERE expires <= ?", now);
    if ([...this.sql.exec("SELECT (SELECT COUNT(*) FROM sessions) + (SELECT COUNT(*) FROM limits) AS n")][0].n) await this.ctx.storage.setAlarm(now + 3600_000);
  }
}
