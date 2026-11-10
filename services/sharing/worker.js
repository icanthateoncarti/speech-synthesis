const MAX_BODY = 512 * 1024, WEEK = 7 * 86400_000;
const ID = /^[A-Za-z0-9_-]{22}$/, HASH = /^[a-f0-9]{64}$/;
// Compteur d'usage : seulement ces noms d'événements, jamais de texte, de fichier ni d'identifiant.
export const EVENT = /^(?:import-(?:pdf|pdf-scan|pptx|example)|import-error-(?:pdf|pptx)|listen-(?:text|document|example)-(?:fr|en)|export-mp3-(?:fr|en|example|fast)|export-error)$/;
// Relais Azure pour MP3 RAPIDE : le site découpe le cours en morceaux de 3 000 caractères
// au plus, la voix vient d'une liste fermée et la vitesse reste dans les bornes du site.
// Niveau gratuit F0 : au-delà du quota mensuel, Azure refuse sans rien facturer.
export const TTS = {
  maxChars: 3000,
  maxBody: 16384,
  monthlyChars: 450_000,
  dailyChars: 40_000,
  output: "audio-24khz-96kbitrate-mono-mp3",
  voices: new Set(["fr-FR-DeniseNeural", "fr-FR-HenriNeural", "en-US-JennyNeural", "en-US-GuyNeural", "nl-BE-DenaNeural", "nl-BE-ArnaudNeural"]),
};
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
// Empreinte de l'IP renouvelée chaque jour : sert aux quotas, jamais conservée au-delà.
export const clientHash = async (request, now = Date.now()) =>
  digest((request.headers.get("cf-connecting-ip") || "local") + ":" + Math.floor(now / 86400_000));
const response = (body, status = 200, headers = {}) => new Response(body, { status, headers });
const json = (body, status = 200, headers = {}) =>
  response(JSON.stringify(body), status, { ...headers, "Content-Type": "application/json" });
const escapeXml = (text) => text.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
}[char]));
const monthOf = (now) => new Date(now).toISOString().slice(0, 7);
const dayOf = (now) => new Date(now).toISOString().slice(0, 10);
const secondsUntilMonth = (now) => {
  const date = new Date(now), next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
  return Math.max(1, Math.ceil((next - now) / 1000));
};
const secondsUntilTomorrow = (now) => {
  const date = new Date(now), next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now) / 1000));
};
const ttsError = (message, status, reason, headers = {}) =>
  json({ reason }, status, { ...headers, "Cache-Control": "no-store" });
async function ttsInput(request) {
  if (+request.headers.get("content-length") > TTS.maxBody) throw new Error("size");
  const body = await request.text();
  if (body.length > TTS.maxBody) throw new Error("size");
  let input;
  try { input = JSON.parse(body); } catch { throw new Error("json"); }
  const text = typeof input.text === "string" ? input.text.trim() : "";
  const voice = typeof input.voice === "string" ? input.voice : "";
  const lang = ["fr", "en", "nl"].includes(input.lang) ? input.lang : "";
  const rate = Math.min(1.5, Math.max(0.7, Number(input.rate) || 1));
  if (!text || !lang || !TTS.voices.has(voice)) throw new Error("input");
  if (text.length > TTS.maxChars) throw new Error("long");
  return { text, voice, lang, rate };
}
function ssml({ text, voice, lang, rate }) {
  const percent = Math.round((rate - 1) * 100);
  const signed = `${percent >= 0 ? "+" : ""}${percent}%`;
  const locale = { fr: "fr-FR", en: "en-US", nl: "nl-BE" }[lang];
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}"><voice name="${voice}"><prosody rate="${signed}">${escapeXml(text)}</prosody></voice></speak>`;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin");
    const allowed = ["https://speechsynthe.si", "https://www.speechsynthe.si"];
    if (env.DEV_ORIGIN) allowed.push(env.DEV_ORIGIN);
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Vary": "Origin", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'" };
    const path = new URL(request.url).pathname;
    // Lecture des compteurs par Jonas uniquement (jeton gardé hors du dépôt).
    if (path === "/stats") {
      if (!env.STATS_TOKEN || request.headers.get("authorization") !== "Bearer " + env.STATS_TOKEN) return response("Refused", 403, headers);
      const result = await env.USAGE.get(env.USAGE.idFromName("usage-v1")).fetch(new Request(request.url));
      return new Response(result.body, { status: result.status, headers: { ...headers, "Content-Type": "application/json" } });
    }
    if (!allowed.includes(origin)) return response("Origin refused", 403, headers);
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Expose-Headers"] = "X-Expires-At, Retry-After";
    const quota = () => env.TTS_QUOTA.get(env.TTS_QUOTA.idFromName("tts-v1"));
    if (request.method === "OPTIONS") return response(null, 204, { ...headers, "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Delete-Hash, Authorization", "Access-Control-Max-Age": "600" });
    if (path === "/tts/status") {
      if (request.method !== "GET") return ttsError("Method refused", 405, "method", headers);
      if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) return json({ available: false, reason: "unconfigured" }, 200, headers);
      try {
        const result = await quota().fetch(new Request("https://quota/status"));
        const data = await result.json();
        return json({ available: Boolean(data.available), ...(data.reason ? { reason: data.reason } : {}) }, 200, headers);
      } catch { return json({ available: false, reason: "unavailable" }, 200, headers); }
    }
    if (path === "/tts") {
      if (request.method !== "POST") return ttsError("Method refused", 405, "method", headers);
      let input;
      try { input = await ttsInput(request); }
      catch (error) {
        if (error.message === "long") return ttsError("Text too long", 400, "long", headers);
        if (error.message === "size") return ttsError("Request too large", 413, "size", headers);
        return ttsError("Invalid request", 400, "input", headers);
      }
      const chars = input.text.length;
      const hash = await clientHash(request);
      let reserved;
      try {
        const result = await quota().fetch(new Request("https://quota/reserve", { method: "POST", body: JSON.stringify({ hash, chars }) }));
        reserved = await result.json();
      } catch { return ttsError("Service unavailable", 503, "unavailable", headers); }
      if (!reserved.ok) {
        const retry = reserved.reason === "daily" ? secondsUntilTomorrow(Date.now()) : secondsUntilMonth(Date.now());
        return ttsError("Quota reached", 429, reserved.reason, { ...headers, "Retry-After": String(retry) });
      }
      const release = () => quota().fetch(new Request("https://quota/release", { method: "POST", body: JSON.stringify({ hash, chars }) })).catch(() => {});
      let audio;
      try {
        const upstream = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": TTS.output,
            "User-Agent": "speechsynthe.si",
          },
          body: ssml(input),
        });
        if (!upstream.ok) {
          await release();
          return ttsError("Azure unavailable", upstream.status === 429 ? 503 : 502, "upstream", headers);
        }
        audio = await upstream.arrayBuffer();
      } catch {
        await release();
        return ttsError("Azure unavailable", 503, "upstream", headers);
      }
      return new Response(audio, {
        status: 200,
        headers: { ...headers, "Content-Type": "audio/mpeg", "Content-Length": String(audio.byteLength) },
      });
    }
    if (path === "/events") {
      if (request.method !== "POST") return response("Method refused", 405, headers);
      try {
        const event = (await request.text()).slice(0, 40);
        if (!EVENT.test(event)) return response("Invalid event", 400, headers);
        const result = await env.USAGE.get(env.USAGE.idFromName("usage-v1")).fetch(new Request(request.url, { method: "POST", body: event, headers: { "X-Client-Hash": await clientHash(request) } }));
        return response(null, result.status, headers);
      } catch { return response("Service unavailable", 503, headers); }
    }
    if (path !== "/sessions" && !/^\/sessions\/[A-Za-z0-9_-]{22}$/.test(path)) return response("Not found", 404, headers);
    if (!["GET", "POST", "DELETE"].includes(request.method)) return response("Method refused", 405, headers);
    try {
      const forwarded = new Request(request);
      forwarded.headers.set("X-Client-Hash", await clientHash(request));
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
// Compteurs d'usage par jour et par événement, gardés 400 jours. Aucune ligne ne relie deux événements entre eux.
export class UsageCounter {
  constructor(ctx) {
    this.ctx = ctx; this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS usage (day TEXT NOT NULL, event TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY(day, event))");
    this.sql.exec("CREATE TABLE IF NOT EXISTS limits (id TEXT PRIMARY KEY, n INTEGER NOT NULL, expires INTEGER NOT NULL)");
  }
  take(key, max, window, now) { return SessionStore.prototype.take.call(this, key, max, window, now); }
  async fetch(request) {
    const now = Date.now(), day = value => new Date(value).toISOString().slice(0, 10);
    if (request.method === "GET") return response(JSON.stringify([...this.sql.exec("SELECT day, event, n FROM usage WHERE day >= ? ORDER BY day, event", day(now - 90 * 86400_000))]));
    const ip = request.headers.get("X-Client-Hash"), event = await request.text();
    if (!ip || !EVENT.test(event)) return response("Refused", 400);
    if (!await this.ctx.storage.getAlarm()) await this.ctx.storage.setAlarm(now + 86400_000);
    const counted = this.ctx.storage.transactionSync(() => {
      if (!this.take("event:" + ip, 60, 3600_000, now) || !this.take("events", 20_000, 86400_000, now)) return false;
      this.sql.exec("INSERT INTO usage VALUES(?,?,1) ON CONFLICT(day, event) DO UPDATE SET n=n+1", day(now), event);
      return true;
    });
    return response(null, counted ? 204 : 429);
  }
  async alarm() {
    const now = Date.now();
    this.sql.exec("DELETE FROM limits WHERE expires <= ?", now);
    this.sql.exec("DELETE FROM usage WHERE day < ?", new Date(now - 400 * 86400_000).toISOString().slice(0, 10));
    await this.ctx.storage.setAlarm(now + 86400_000);
  }
}
// Quotas du relais Azure : 450 000 caractères par mois pour tout le site,
// 20 000 par jour et par empreinte d'IP. Seule l'empreinte (IP + jour) est
// gardée, jamais l'IP en clair. Une réservation est faite avant l'appel Azure
// et rendue si Azure échoue, pour ne pas facturer une phrase non lue.
export class TtsQuota {
  constructor(ctx) {
    this.ctx = ctx; this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS months (month TEXT PRIMARY KEY, chars INTEGER NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS days (day TEXT NOT NULL, hash TEXT NOT NULL, chars INTEGER NOT NULL, PRIMARY KEY(day, hash))");
  }
  read(table, key, value) {
    return [...this.sql.exec(`SELECT chars FROM ${table} WHERE ${key} = ?`, value)][0]?.chars ?? 0;
  }
  reserve(hash, chars, now) {
    const month = monthOf(now), day = dayOf(now);
    return this.ctx.storage.transactionSync(() => {
      if (this.read("months", "month", month) + chars > TTS.monthlyChars) return { ok: false, reason: "monthly" };
      const used = [...this.sql.exec("SELECT chars FROM days WHERE day = ? AND hash = ?", day, hash)][0]?.chars ?? 0;
      if (used + chars > TTS.dailyChars) return { ok: false, reason: "daily" };
      this.sql.exec("INSERT INTO months(month,chars) VALUES(?,?) ON CONFLICT(month) DO UPDATE SET chars = chars + excluded.chars", month, chars);
      this.sql.exec("INSERT INTO days(day,hash,chars) VALUES(?,?,?) ON CONFLICT(day,hash) DO UPDATE SET chars = chars + excluded.chars", day, hash, chars);
      return { ok: true };
    });
  }
  release(hash, chars, now) {
    const month = monthOf(now), day = dayOf(now);
    this.ctx.storage.transactionSync(() => {
      this.sql.exec("UPDATE months SET chars = MAX(0, chars - ?) WHERE month = ?", chars, month);
      this.sql.exec("UPDATE days SET chars = MAX(0, chars - ?) WHERE day = ? AND hash = ?", chars, day, hash);
      this.sql.exec("DELETE FROM months WHERE chars <= 0");
      this.sql.exec("DELETE FROM days WHERE chars <= 0");
    });
  }
  status(now) {
    const used = this.read("months", "month", monthOf(now));
    return { available: used < TTS.monthlyChars, used, limit: TTS.monthlyChars, ...(used >= TTS.monthlyChars ? { reason: "monthly" } : {}) };
  }
  async fetch(request) {
    const now = Date.now(), path = new URL(request.url).pathname;
    if (!await this.ctx.storage.getAlarm()) await this.ctx.storage.setAlarm(now + 86400_000);
    if (path === "/status") return json(this.status(now));
    if (!["/reserve", "/release"].includes(path) || request.method !== "POST") return response("Refused", 403);
    let data; try { data = await request.json(); } catch { return response("Invalid request", 400); }
    const chars = Math.floor(Number(data.chars));
    if (!Number.isFinite(chars) || chars < 0 || chars > TTS.maxChars || typeof data.hash !== "string" || !HASH.test(data.hash)) return response("Invalid request", 400);
    if (path === "/reserve") return json(this.reserve(data.hash, chars, now));
    this.release(data.hash, chars, now);
    return json({ ok: true });
  }
  async alarm() {
    const now = Date.now();
    this.sql.exec("DELETE FROM days WHERE day < ?", dayOf(now - 2 * 86400_000));
    this.sql.exec("DELETE FROM months WHERE month < ?", monthOf(now - 62 * 86400_000));
    await this.ctx.storage.setAlarm(now + 86400_000);
  }
}
