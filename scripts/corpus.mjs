// Banc d'essai de l'import PDF/PPTX sur de vrais documents.
// Lecture seule : ne modifie aucun fichier du corpus, écrit seulement un rapport
// dans ~/inbox (jamais dans le dépôt, le texte des cours est public).
//
// Usage :
//   node scripts/corpus.mjs [--limit=40] [--report=~/inbox/corpus-….md]
//
// Le script liste les .pdf/.pptx de ~/casquettes/etudiant et ~/Downloads, les
// plus récents d'abord, puis appelle extractPdfDocument / extractPptxDocument
// dans la page de test, comme le fait l'application.

import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { startServer, launch } from "../tests/e2e/harness.mjs";

// ~/Downloads est fouillé à la racine seulement : les sous-dossiers contiennent
// des archives personnelles (guides de dessin animé, scans) sans rapport avec les cours.
const ROOTS = [
  { dir: path.join(os.homedir(), "casquettes/etudiant"), depth: Infinity },
  { dir: path.join(os.homedir(), "Downloads"), depth: 1 },
];
const MAX_FILES = 40;
const MAX_ANOMALY_EXCERPT = 200;

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));
const limit = Number(args.get("limit") ?? MAX_FILES);
// Les captures d'écran de navigateur (screencapture-*.pdf) sont des images sans
// couche de texte : elles ne disent rien de l'import de vrais cours. On les
// écarte par défaut ; --all les remet dans la liste.
const includeScreenshots = Boolean(args.get("all"));
const today = new Date().toLocaleDateString("fr-CA"); // AAAA-MM-JJ
const reportPath = String(args.get("report") ?? path.join(os.homedir(), "inbox", `corpus-speechsynthe-${today}.md`));

async function* walk(dir, depth = Infinity, includeScreenshots = false) {
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
      if (depth > 1) yield* walk(full, depth - 1, includeScreenshots);
    } else if (entry.isFile() && /\.(pdf|pptx)$/i.test(entry.name) && (includeScreenshots || !/^screencapture-/i.test(entry.name))) {
      yield full;
    }
  }
}

// Exporté pour `scripts/mots-francais.mjs` : la liste et l'extraction restent
// identiques au banc d'essai, seul le comptage change.
export async function listFiles({ limit = MAX_FILES, includeScreenshots = false } = {}) {
  const found = [];
  for (const root of ROOTS) {
    for await (const file of walk(root.dir, root.depth, includeScreenshots)) {
      try {
        const info = await stat(file);
        found.push({ path: file, size: info.size, mtime: info.mtimeMs });
      } catch {
        // fichier disparu entre-temps : on l'ignore
      }
    }
  }
  found.sort((a, b) => b.mtime - a.mtime || a.path.localeCompare(b.path));
  // Un même document peut être présent dans les deux dossiers (téléchargé puis rangé) :
  // on garde la copie la plus récente, et on signale l'autre.
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

function excerpt(text, index, radius = MAX_ANOMALY_EXCERPT / 2) {
  const start = Math.max(0, index - radius);
  return text.slice(start, start + MAX_ANOMALY_EXCERPT).replace(/\s+/g, " ").trim();
}

async function extractInPage(page, file) {
  const bytes = await readFile(file.path);
  const base64 = bytes.toString("base64");
  return page.evaluate(async ({ name, type, base64 }) => {
    const binary = atob(base64);
    const raw = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) raw[i] = binary.charCodeAt(i);
    const file = new File([raw], name, { type });
    const started = performance.now();
    try {
      const { extractPdfDocument } = await import("/src/pdf.js");
      const { extractPptxDocument } = await import("/src/pptx.js");
      const { detectLanguage } = await import("/src/text.js");
      const extract = type === "PPTX" ? extractPptxDocument : extractPdfDocument;
      const result = await extract(file);
      const durationMs = Math.round(performance.now() - started);
      const text = result.text ?? "";
      const titles = result.titles ?? [];
      const chapters = result.chapters ?? [];
      const language = detectLanguage(text);
      const longTitles = titles
        .map((title, index) => ({ index, title }))
        .filter(({ title }) => title.length > 120)
        .slice(0, 5);
      const around = (index) => text.slice(Math.max(0, index - 60), index + 140).replace(/\s+/g, " ").trim();
      const strange = [], symbols = [];
      const seen = new Set();
      for (const match of text.matchAll(/[\uFFFD\u00AD\u200B-\u200F\u202A-\u202E\u2060\uFEFF\uE000-\uF8FF]|[\uFB00-\uFB06]|[ÃÂ][\u0080-\u00BF]/gu)) {
        if (seen.has(match[0])) continue;
        seen.add(match[0]);
        strange.push({ char: match[0], index: match.index, excerpt: around(match.index) });
        if (strange.length >= 5) break;
      }
      const seenSymbols = new Set();
      for (const match of text.matchAll(/[^\p{L}\p{N}\s]{4,}/gu)) {
        const value = match[0];
        if (seenSymbols.has(value)) continue;
        // Les points de suite, guillemets, parenthèses et ponctuation de prose
        // ne sont pas des suites de symboles : on ne garde que ce qui reste
        // visible une fois cette ponctuation retirée (_____, ----->, ###…).
        const rest = value.replace(/[.\u2026·•'"“”«»‘’(),;:!?\[\]{}%]/gu, "");
        if (rest.length < 4) continue;
        seenSymbols.add(value);
        symbols.push({ char: value, index: match.index, excerpt: around(match.index) });
        if (symbols.length >= 5) break;
      }
      let frWords = 0, enWords = 0;
      for (const word of text.slice(0, 20_000).toLowerCase().match(/\p{L}+/gu) ?? []) {
        if (["le", "la", "les", "de", "des", "du", "et", "est", "une", "un", "en", "que", "qui", "dans", "pour", "pas", "sur", "au", "aux", "avec", "ce", "cette", "il", "elle", "ne", "se", "par", "plus", "sont", "nous", "vous", "leur", "ou"].includes(word)) frWords++;
        if (["the", "and", "of", "to", "is", "in", "that", "for", "it", "with", "on", "are", "be", "this", "by", "or", "from", "at", "we", "will", "not", "you", "your", "can", "which", "have", "has", "was", "were"].includes(word)) enWords++;
      }
      return {
        ok: true,
        durationMs,
        chars: text.length,
        chapterCount: chapters.length,
        chapterTitles: chapters.slice(0, 5).map((chapter) => chapter.title),
        titleCount: titles.length,
        firstTitles: titles.slice(0, 5),
        language,
        truncated: Boolean(result.truncated),
        longTitles,
        strange,
        symbols,
        frWords,
        enWords,
        head: text.slice(0, 200).replace(/\s+/g, " ").trim(),
      };
    } catch (error) {
      return {
        ok: false,
        durationMs: Math.round(performance.now() - started),
        error: { name: error?.name ?? "Error", message: String(error?.message ?? error) },
      };
    }
  }, { name: path.basename(file.path), type: /\.pptx$/i.test(file.path) ? "PPTX" : "PDF", base64 });
}

export function relative(file) {
  const home = os.homedir() + path.sep;
  return file.path.startsWith(home) ? file.path.slice(home.length) : file.path;
}

function tableCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function formatDuration(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
}

function buildReport(rows, startedAt) {
  const lines = [];
  lines.push(`# Banc d'essai import PDF / PPTX — ${today}`, "");
  lines.push(`Généré le ${startedAt.toLocaleString("fr-FR")} par \`scripts/corpus.mjs\`.`, "");
  lines.push(`${rows.length} fichiers, les plus récents de \`~/casquettes/etudiant\` et \`~/Downloads\` (40 au plus).`, "");
  lines.push("Les captures d'écran `screencapture-*.pdf` sont écartées par défaut (images sans texte) ; `--all` les inclut.", "");
  lines.push("| # | Fichier | Type | Durée | Caractères | Chapitres | Titres | 5 premiers titres | Langue | Coupé | Erreur |");
  lines.push("|---|---|---|---:|---:|---:|---:|---|---|---|---|");
  rows.forEach((row, index) => {
    const error = row.ok ? "" : `${row.error.name} : ${row.error.message}`;
    const firstTitles = row.ok && row.firstTitles.length ? row.firstTitles.map(tableCell).join(" · ") : "—";
    lines.push(`| ${index + 1} | ${tableCell(relative(row.file))} | ${row.type} | ${row.ok ? formatDuration(row.durationMs) : `échec en ${formatDuration(row.durationMs)}`} | ${row.ok ? row.chars : "—"} | ${row.ok ? row.chapterCount : "—"} | ${row.ok ? row.titleCount : "—"} | ${firstTitles} | ${row.ok ? row.language : "—"} | ${row.ok ? (row.truncated ? "oui" : "non") : "—"} | ${tableCell(error)} |`);
  });
  lines.push("");

  const anomalies = [];
  for (const row of rows) {
    const name = path.basename(row.file.path);
    if (!row.ok) {
      anomalies.push({ kind: "Erreur d'extraction", file: name, detail: `${row.error.name} : ${row.error.message}`, excerpt: "" });
      continue;
    }
    const visibleChapters = row.type === "PPTX" ? row.chars > 0 : row.chars > 5000;
    if (row.chapterCount === 0 && visibleChapters) {
      anomalies.push({
        kind: "0 chapitre",
        file: name,
        detail: `${row.chars} caractères, ${row.titleCount} titre(s) repéré(s)${row.titleCount ? ` : ${row.firstTitles.join(" · ")}` : ""}`,
        excerpt: row.head,
      });
    }
    for (const item of row.longTitles) {
      anomalies.push({ kind: "Titre > 120 caractères", file: name, detail: `${item.title.length} caractères (titre ${item.index + 1})`, excerpt: item.title.slice(0, MAX_ANOMALY_EXCERPT) });
    }
    for (const item of row.strange) {
      const points = [...item.char].map((char) => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`).join(" ");
      anomalies.push({ kind: "Caractère étrange", file: name, detail: `${points} (${JSON.stringify(item.char)}) en position ${item.index}`, excerpt: item.excerpt });
    }
    for (const item of row.symbols) {
      anomalies.push({ kind: "Suite de symboles", file: name, detail: `« ${item.char} » en position ${item.index}`, excerpt: item.excerpt });
    }
    if (row.durationMs > 10_000) {
      anomalies.push({ kind: "Extraction > 10 s", file: name, detail: formatDuration(row.durationMs), excerpt: "" });
    }
  }
  // Signal fort seulement : la page a dit « en » alors que les petits mots
  // français dominent nettement, ou l'inverse.
  for (const row of rows) {
    if (!row.ok) continue;
    const name = path.basename(row.file.path);
    const { frWords: fr, enWords: en } = row;
    if (row.language === "en" && fr >= 20 && fr > en * 1.5) {
      anomalies.push({ kind: "Langue mal détectée ?", file: name, detail: `détecté « en » alors que le texte contient ${fr} mots français contre ${en} anglais`, excerpt: row.head });
    } else if (row.language === "fr" && en >= 20 && en > (fr + 1) * 2) {
      anomalies.push({ kind: "Langue mal détectée ?", file: name, detail: `détecté « fr » alors que le texte contient ${en} mots anglais contre ${fr} français`, excerpt: row.head });
    }
  }

  lines.push("## Anomalies", "");
  if (!anomalies.length) {
    lines.push("Aucune anomalie repérée.", "");
  } else {
    const order = ["Erreur d'extraction", "0 chapitre", "Titre > 120 caractères", "Caractère étrange", "Suite de symboles", "Langue mal détectée ?", "Extraction > 10 s"];
    anomalies.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
    const counts = new Map();
    for (const anomaly of anomalies) counts.set(anomaly.kind, (counts.get(anomaly.kind) ?? 0) + 1);
    lines.push([...counts].map(([kind, count]) => `${count} × ${kind.toLowerCase()}`).join(" · "), "");
    // Une section par fichier et par type, pour ne pas répéter dix fois le même titre.
    const groups = new Map();
    for (const anomaly of anomalies) {
      const key = `${anomaly.kind}\u0000${anomaly.file}`;
      if (!groups.has(key)) groups.set(key, { kind: anomaly.kind, file: anomaly.file, items: [] });
      groups.get(key).items.push(anomaly);
    }
    for (const group of groups.values()) {
      lines.push(`### ${group.kind} — ${group.file}`, "");
      for (const anomaly of group.items) {
        lines.push(`- ${anomaly.detail}`);
        if (anomaly.excerpt) lines.push(`  - Extrait : « ${anomaly.excerpt.slice(0, MAX_ANOMALY_EXCERPT)} »`);
      }
      lines.push("");
    }
  }
  lines.push("## Note de lecture", "");
  lines.push("« 0 chapitre » est signalé pour un PDF de plus de 5 000 caractères ou un PPTX non vide : un document long sans titre détecté mérite un coup d'œil, même s'il peut légitimement n'avoir aucun chapitre.", "");
  return lines.join("\n");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const files = await listFiles({ limit, includeScreenshots });
  const server = await startServer();
  const { browser, page } = await launch();
  const rows = [];
  const startedAt = new Date();
  try {
    await page.goto(server.url);
    await page.waitForSelector("#key-speak", { timeout: 30_000 });
    // Prépare les modules (et le worker PDF.js) hors mesure du premier fichier.
    await page.evaluate(async () => { await import("/src/pdf.js"); await import("/src/pptx.js"); });
    for (const [index, file] of files.entries()) {
      process.stderr.write(`[${index + 1}/${files.length}] ${relative(file)}… `);
      const result = await extractInPage(page, file);
      rows.push({ file, type: /\.pptx$/i.test(file.path) ? "PPTX" : "PDF", ...result });
      process.stderr.write(result.ok
        ? `${result.chars} car., ${result.chapterCount} chap., ${formatDuration(result.durationMs)}\n`
        : `ERREUR ${result.error.name} : ${result.error.message}\n`);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const report = buildReport(rows, startedAt);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report);
  console.log(reportPath);
}
