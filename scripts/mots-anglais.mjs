// Quels mots anglais reviennent vraiment dans les cours de Jonas ?
// Même périmètre et même extraction que scripts/corpus.mjs : les 40 PDF/PPTX
// les plus récents de ~/casquettes/etudiant et ~/Downloads (racine), lus dans
// la page de test par extractPdfDocument / extractPptxDocument. Seuls les
// documents détectés en français sont comptés.
//
// Un mot candidat : au moins 3 lettres, sans accent, présent dans la liste
// ci-dessous (gestion, informatique, marketing, données) et absent du LEXICON
// de src/spoken.js (vérifié via spokenText, qui rend le mot inchangé).
//
// Le rapport ne contient que des mots et des chiffres : aucun extrait de cours.
//
// Usage :
//   node scripts/mots-anglais.mjs [--limit=40] [--report=~/inbox/….md]

import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "../tests/e2e/harness.mjs";
import { spokenText } from "../src/spoken.js";

const ROOTS = [
  { dir: path.join(os.homedir(), "casquettes/etudiant"), depth: Infinity },
  { dir: path.join(os.homedir(), "Downloads"), depth: 1 },
];
const MAX_FILES = 40;

// Vocabulaire de gestion, d'informatique, de marketing et de données.
const ENGLISH_WORDS = [
  // Gestion, stratégie, supply chain, finance
  "management", "manager", "managers", "managing", "director", "executive", "leadership",
  "strategy", "strategic", "plan", "planning", "forecast", "forecasting", "budget", "budgeting",
  "cost", "costs", "pricing", "price", "profit", "profitability", "revenue", "sales", "sale",
  "customer", "customers", "supplier", "suppliers", "vendor", "vendors", "procurement",
  "purchasing", "purchase", "logistics", "inventory", "warehouse", "stock", "stockout", "flow",
  "supply", "chain", "value", "quality", "process", "operation", "operations", "operational",
  "project", "portfolio", "program", "milestone", "deadline", "deliverable", "delivery",
  "performance", "productivity", "efficiency", "effectiveness", "capacity", "demand",
  "sourcing", "outsourcing", "offshoring", "nearshore", "nearshoring", "wholesale", "retail",
  "margin", "markup", "discount", "turnover", "cashflow", "cash", "funding", "finance",
  "financial", "accounting", "audit", "compliance", "governance", "risk", "insurance",
  "liability", "equity", "asset", "assets", "shareholder", "stakeholder", "board", "merger",
  "acquisition", "venture", "investor", "investment", "startup", "entrepreneur", "unicorn",
  "kpi", "roi", "okr", "benchmark", "target", "objective", "goal", "business", "company",
  "enterprise", "industry", "market", "markets", "competitor", "competition", "advantage",
  // Informatique, développement, sécurité
  "software", "hardware", "server", "servers", "cloud", "database", "dataset", "analytics",
  "algorithm", "application", "app", "interface", "platform", "network", "internet", "intranet",
  "website", "web", "email", "login", "logout", "password", "username", "account", "user",
  "users", "admin", "administrator", "access", "security", "firewall", "virus", "malware",
  "ransomware", "phishing", "backup", "restore", "update", "upgrade", "install", "installation",
  "configuration", "config", "deploy", "deployment", "release", "version", "repository",
  "branch", "merge", "commit", "push", "pull", "fork", "clone", "bug", "debug", "feature",
  "test", "testing", "script", "code", "coding", "developer", "development", "frontend",
  "backend", "fullstack", "stack", "framework", "library", "api", "endpoint", "request",
  "response", "cache", "cookie", "session", "token", "encryption", "serverless", "container",
  "docker", "kubernetes", "pipeline", "devops", "agile", "scrum", "sprint", "kanban",
  "runtime", "thread", "queue", "storage", "bandwidth", "latency", "uptime", "outage",
  "monitoring", "logging", "dashboard", "metrics", "report", "reporting",
  // Marketing, communication, vente
  "marketing", "brand", "branding", "campaign", "campaigns", "advertising", "advert", "ad",
  "ads", "copywriting", "copy", "content", "social", "media", "digital", "online", "offline",
  "funnel", "conversion", "traffic", "click", "clicks", "impression", "impressions",
  "engagement", "reach", "retention", "loyalty", "churn", "persona", "segment", "segmentation",
  "targeting", "positioning", "messaging", "storytelling", "launch", "promotion", "promo",
  "offer", "coupon", "newsletter", "subscriber", "subscription", "lead", "leads", "prospect",
  "prospecting", "pitch", "presentation", "webinar", "event", "sponsorship", "partnership",
  "influencer", "community", "referral", "review", "rating", "feedback", "survey", "poll",
  "quiz", "landing", "page", "seo", "sem", "ppc", "cpc", "cpm", "audience", "research",
  "insight", "insights", "trend", "trends", "growth", "scaling", "scale", "viral", "meme",
  "reel", "reels", "story", "stories", "highlight", "hashtag", "caption", "post", "posts",
  "feed", "profile", "follower", "followers", "like", "likes", "share", "shares", "comment",
  "comments", "organic", "paid", "boost", "retargeting", "remarketing", "affiliate",
  "audience", "awareness", "consideration", "preference", "purchase", "advocacy",
  // Données, analyse, statistiques
  "data", "analysis", "analyze", "analyze", "metric", "visualization", "visualisation",
  "chart", "graph", "table", "spreadsheet", "excel", "csv", "json", "xml", "sql", "query",
  "queries", "schema", "model", "modeling", "prediction", "regression", "classification",
  "clustering", "correlation", "causation", "sample", "sampling", "population", "variable",
  "variables", "label", "labels", "training", "validation", "accuracy", "precision", "recall",
  "score", "scoring", "baseline", "outlier", "outliers", "missing", "duplicate", "clean",
  "cleaning", "wrangle", "wrangling", "etl", "lake", "structured", "unstructured",
  "quantitative", "qualitative", "statistics", "statistical", "average", "median", "mode",
  "mean", "distribution", "variance", "deviation", "percentile", "cohort", "seasonality",
  "anomaly", "forecast", "insight", "dashboard", "kpi", "metric", "metrics",
  // Termes anglais effectivement repérés dans les documents français du relevé
  // du 2026-10-27 (réseaux sociaux, marketing, informatique, vie étudiante).
  "instagram", "fomo", "influencers", "tips", "study", "youtube", "hacker",
  "tablet", "brief", "alert", "computer", "phone", "job", "moodle", "bachelor",
  "best", "collect", "podcast", "tiktok", "smartphone", "weekend",
];

// Minuscules ASCII, 3 lettres au moins, et que spokenText ne réécrit pas :
// le mot est alors absent du LEXICON.
const CANDIDATES = [...new Set(ENGLISH_WORDS)].filter((word) => /^[a-z]{3,}$/.test(word)
  && spokenText(word, "fr") === word);

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));
const limit = Number(args.get("limit") ?? MAX_FILES);
const today = new Date().toLocaleDateString("fr-CA");
const reportPath = String(args.get("report") ?? path.join(os.homedir(), "inbox", `mots-anglais-speechsynthe-${today}.md`));

async function* walk(dir, depth = Infinity) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (depth > 1) yield* walk(full, depth - 1);
    } else if (entry.isFile() && /\.(pdf|pptx)$/i.test(entry.name) && !/^screencapture-/i.test(entry.name)) {
      yield full;
    }
  }
}

async function listFiles() {
  const found = [];
  for (const root of ROOTS) {
    for await (const file of walk(root.dir, root.depth)) {
      try {
        const info = await stat(file);
        found.push({ path: file, size: info.size, mtime: info.mtimeMs });
      } catch {
        // fichier disparu entre-temps : on l'ignore
      }
    }
  }
  found.sort((a, b) => b.mtime - a.mtime || a.path.localeCompare(b.path));
  const seen = new Map();
  const unique = [];
  for (const item of found) {
    const key = `${path.basename(item.path).toLowerCase()}|${item.size}`;
    if (seen.has(key)) continue;
    seen.set(key, item);
    unique.push(item);
  }
  return unique.slice(0, limit);
}

async function countInPage(page, file) {
  const bytes = await readFile(file.path);
  const base64 = bytes.toString("base64");
  return page.evaluate(async ({ name, type, base64, candidates }) => {
    const binary = atob(base64);
    const raw = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) raw[i] = binary.charCodeAt(i);
    const file = new File([raw], name, { type });
    try {
      const { extractPdfDocument } = await import("/src/pdf.js");
      const { extractPptxDocument } = await import("/src/pptx.js");
      const { detectLanguage } = await import("/src/text.js");
      const extract = type === "PPTX" ? extractPptxDocument : extractPdfDocument;
      const result = await extract(file);
      const text = result.text ?? "";
      const language = detectLanguage(text);
      if (language !== "fr") return { ok: true, language, counted: false, chars: text.length };
      const allowed = new Set(candidates);
      const counts = new Map();
      for (const word of text.toLowerCase().match(/\p{L}+/gu) ?? []) {
        if (word.length < 3 || !allowed.has(word)) continue;
        counts.set(word, (counts.get(word) ?? 0) + 1);
      }
      return {
        ok: true,
        language,
        counted: true,
        chars: text.length,
        counts: [...counts],
      };
    } catch (error) {
      return { ok: false, language: null, counted: false, chars: 0,
        error: { name: error?.name ?? "Error", message: String(error?.message ?? error) } };
    }
  }, { name: path.basename(file.path), type: /\.pptx$/i.test(file.path) ? "PPTX" : "PDF", base64, candidates: CANDIDATES });
}

function buildReport(rows, top) {
  const lines = [];
  lines.push(`# Mots anglais dans les cours — ${today}`, "");
  lines.push(`Généré par \`scripts/mots-anglais.mjs\`. ${rows.length} documents lus, `
    + `${rows.filter((row) => row.counted).length} détectés en français, `
    + `${rows.filter((row) => row.ok && !row.counted && row.language === "en").length} en anglais, `
    + `${rows.filter((row) => !row.ok).length} en erreur.`, "");
  lines.push(`Liste de ${CANDIDATES.length} mots anglais candidats (3 lettres au moins, sans accent, absents du \`LEXICON\`).`, "");
  lines.push("| # | Mot | Occurrences | Documents |");
  lines.push("|---:|---|---:|---:|");
  top.forEach((row, index) => {
    lines.push(`| ${index + 1} | ${row.word} | ${row.occurrences} | ${row.documents} |`);
  });
  lines.push("");
  return lines.join("\n");
}

const files = await listFiles();
const server = await startServer();
const { browser, page } = await launch();
const rows = [];
try {
  await page.goto(server.url);
  await page.waitForSelector("#key-speak", { timeout: 30_000 });
  await page.evaluate(async () => { await import("/src/pdf.js"); await import("/src/pptx.js"); });
  for (const [index, file] of files.entries()) {
    const result = await countInPage(page, file);
    rows.push(result);
    process.stderr.write(`[${index + 1}/${files.length}] ${result.ok
      ? (result.counted ? `${result.chars} car., compté` : `ignoré (${result.language})`)
      : `ERREUR ${result.error.name}`}\n`);
  }
} finally {
  await browser.close();
  await server.close();
}

const totals = new Map();
const documents = new Map();
for (const row of rows) {
  if (!row.ok || !row.counted) continue;
  for (const [word, count] of row.counts) {
    totals.set(word, (totals.get(word) ?? 0) + count);
    documents.set(word, (documents.get(word) ?? 0) + 1);
  }
}
const top = [...totals]
  .map(([word, occurrences]) => ({ word, occurrences, documents: documents.get(word) }))
  .sort((a, b) => b.occurrences - a.occurrences || b.documents - a.documents || a.word.localeCompare(b.word))
  .slice(0, 100);

const report = buildReport(rows, top);
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, report);
console.log(reportPath);
