// Les visiteurs arrivent-ils à utiliser le produit ? Visites (Cloudflare Web Analytics)
// face aux imports, premières écoutes et exports comptés par le worker, jour par jour.
// Jetons lus dans logs/.cloudflare-private (ignoré par Git), jamais affichés.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const PRIVATE = path.resolve(import.meta.dirname, "../logs/.cloudflare-private");
const ACCOUNT = "8bc552f4eb6dda732b9be6a02b6e567e";
const API = "https://speechsynthesi-sharing.speech-synthesis.workers.dev";
const days = Number(process.argv[2] ?? 14);
const since = new Date(Date.now() - (days - 1) * 86400_000).toISOString().slice(0, 10);

const statsToken = readFileSync(path.join(PRIVATE, "stats-token"), "utf8").trim();
const usage = await (await fetch(API + "/stats", { headers: { Authorization: "Bearer " + statsToken } })).json();

// wrangler rafraîchit le jeton OAuth s'il a expiré.
execFileSync("npx", ["--yes", "wrangler@4.154.0", "whoami"], { env: { ...process.env, HOME: PRIVATE }, stdio: "ignore" });
const oauth = readFileSync(path.join(PRIVATE, ".wrangler/config/default.toml"), "utf8").match(/^oauth_token\s*=\s*"(.+)"/m)[1];
const query = `{viewer{accounts(filter:{accountTag:"${ACCOUNT}"}){rumPageloadEventsAdaptiveGroups(limit:100,filter:{date_geq:"${since}"}){sum{visits} avg{sampleInterval} dimensions{date}}}}}`;
const analytics = await (await fetch("https://api.cloudflare.com/client/v4/graphql", {
  method: "POST", headers: { Authorization: "Bearer " + oauth, "Content-Type": "application/json" }, body: JSON.stringify({ query }),
})).json();
if (analytics.errors?.length) throw new Error(analytics.errors[0].message);

const rows = new Map();
const row = day => rows.get(day) ?? rows.set(day, { visites: 0, imports: 0, "échecs import": 0, écoutes: 0, exports: 0, "échecs export": 0 }).get(day);
// Cloudflare échantillonne parfois la réponse : une visite comptée en vaut alors sampleInterval.
let sampled = 1;
for (const group of analytics.data.viewer.accounts[0].rumPageloadEventsAdaptiveGroups) {
  row(group.dimensions.date).visites += group.sum.visits;
  sampled = Math.max(sampled, group.avg.sampleInterval);
}
const detail = new Map();
for (const { day, event, n } of usage.filter(u => u.day >= since)) {
  const r = row(day);
  if (event.startsWith("import-error")) r["échecs import"] += n;
  else if (event.startsWith("import-")) r.imports += n;
  else if (event.startsWith("listen-")) r.écoutes += n;
  else if (event === "export-error") r["échecs export"] += n;
  else r.exports += n;
  detail.set(event, (detail.get(event) ?? 0) + n);
}
const table = Object.fromEntries([...rows].sort(([a], [b]) => a.localeCompare(b)));
console.table(table);
const total = Object.values(table).reduce((t, r) => { for (const k in r) t[k] = (t[k] ?? 0) + r[k]; return t; }, {});
const pct = n => total.visites ? `${Math.round((100 * n) / total.visites)} %` : "-";
console.log(`${days} jours : ${total.visites} visites → ${total.écoutes} visites avec écoute (${pct(total.écoutes)}), ${total.imports} imports, ${total.exports} exports MP3.`);
if (sampled > 1) console.log(`Visites estimées : Cloudflare a échantillonné (1 sur ${Math.round(sampled)}). Relancer plus tard pour des chiffres exacts.`);
console.log("Écoutes et exports ne sont comptés que depuis la mise en ligne du compteur (2026-10-28).");
if (detail.size) console.log("Détail :", Object.fromEntries([...detail].sort(([, a], [, b]) => b - a)));
