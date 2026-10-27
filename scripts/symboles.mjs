// Compte les symboles et les abréviations des cours, séparément pour les
// documents français et anglais. Lecture seule : aucun fichier du corpus n'est
// modifié, et le rapport ne contient que des mots et des chiffres (jamais le
// texte des cours).
//
// Usage :
//   node scripts/symboles.mjs [--limit=40] [--report=~/inbox/symboles-….md]
//
// La sélection des fichiers et l'extraction sont celles de scripts/corpus.mjs :
// mêmes dossiers, mêmes 40 documents les plus récents, mêmes fonctions
// extractPdfDocument / extractPptxDocument appelées dans la page de test.

import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "../tests/e2e/harness.mjs";

const ROOTS = [
  { dir: path.join(os.homedir(), "casquettes/etudiant"), depth: Infinity },
  { dir: path.join(os.homedir(), "Downloads"), depth: 1 },
];
const MAX_FILES = 40;

// Jetons demandés par la tâche B.
const SYMBOLS = ["€", "$", "£", "%", "‰", "°", "§", "≥", "≤", "≠", "≈", "×", "÷", "±", "∞", "→", "⇒", "©", "®", "™", "#", "@", "&", "~", "^", "|"];
const ABBREVIATIONS = ["p.", "pp.", "cf.", "ex.", "etc.", "n°", "nº", "vs.", "e.g.", "i.e.", "approx.", "env.", "min.", "max.", "h.", "km", "kg", "m²", "m³"];

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));
const limit = Number(args.get("limit") ?? MAX_FILES);
const today = new Date().toLocaleDateString("fr-CA"); // AAAA-MM-JJ
const reportPath = String(args.get("report") ?? path.join(os.homedir(), "inbox", `symboles-speechsynthe-${today}.md`));

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

async function extractInPage(page, file) {
  const bytes = await readFile(file.path);
  const base64 = bytes.toString("base64");
  return page.evaluate(async ({ name, type, base64, symbols, abbreviations }) => {
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

      // Un jeton d'abréviation est repéré avec ses bornes ; les symboles qui
      // tombent à l'intérieur (le « ° » de « n° ») ne sont pas comptés deux fois.
      const covered = new Uint8Array(text.length);
      const counts = new Map();
      const bump = (token, amount = 1) => {
        counts.set(token, (counts.get(token) ?? 0) + amount);
      };
      for (const abbreviation of abbreviations) {
        const pattern = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const before = "(?<![\\p{L}\\p{N}])";
        // « p. 12 » et « n°5 » peuvent être suivis d'un chiffre ; « km » et « m² » non.
        const numberAfter = /\.$/.test(abbreviation) || /^n[°º]$/.test(abbreviation);
        const after = numberAfter ? "(?![\\p{L}])" : "(?![\\p{L}\\p{N}])";
        const regex = new RegExp(before + pattern + after, "giu");
        for (const match of text.matchAll(regex)) {
          bump(abbreviation);
          covered.fill(1, match.index, match.index + match[0].length);
        }
      }
      for (const symbol of symbols) {
        let index = text.indexOf(symbol);
        while (index >= 0) {
          if (!covered[index]) bump(symbol);
          index = text.indexOf(symbol, index + symbol.length);
        }
      }
      return {
        ok: true,
        chars: text.length,
        language: detectLanguage(text),
        counts: [...counts],
      };
    } catch (error) {
      return {
        ok: false,
        chars: 0,
        language: null,
        counts: [],
        error: { name: error?.name ?? "Error", message: String(error?.message ?? error) },
      };
    }
  }, {
    name: path.basename(file.path),
    type: /\.pptx$/i.test(file.path) ? "PPTX" : "PDF",
    base64, symbols: SYMBOLS, abbreviations: ABBREVIATIONS,
  });
}

function buildReport(rows, startedAt) {
  const totals = {
    fr: { docs: 0, chars: 0, counts: new Map() },
    en: { docs: 0, chars: 0, counts: new Map() },
  };
  let errors = 0;
  for (const row of rows) {
    if (!row.ok) { errors++; continue; }
    const side = totals[row.language === "en" ? "en" : "fr"];
    side.docs++;
    side.chars += row.chars;
    for (const [token, count] of row.counts) side.counts.set(token, (side.counts.get(token) ?? 0) + count);
  }
  const kinds = new Map([
    ...SYMBOLS.map((token) => [token, "symbole"]),
    ...ABBREVIATIONS.map((token) => [token, "abréviation"]),
  ]);
  const table = [...kinds.keys()].map((token) => ({
    token,
    kind: kinds.get(token),
    fr: totals.fr.counts.get(token) ?? 0,
    en: totals.en.counts.get(token) ?? 0,
  })).filter((row) => row.fr + row.en > 0)
    .sort((a, b) => (b.fr + b.en) - (a.fr + a.en) || a.token.localeCompare(b.token, "fr"));

  const lines = [];
  lines.push(`# Symboles et abréviations des cours — ${today}`, "");
  lines.push(`Généré le ${startedAt.toLocaleString("fr-FR")} par \`scripts/symboles.mjs\`.`, "");
  lines.push(`${rows.length} documents (${totals.fr.docs} français, ${totals.en.docs} anglais, ${errors} erreur(s) d'extraction), ${totals.fr.chars + totals.en.chars} caractères.`, "");
  const cell = (value) => String(value).replaceAll("|", "\\|");
  lines.push("| Jeton | Type | Français | Anglais | Total |");
  lines.push("|---|---|---:|---:|---:|");
  for (const row of table) {
    lines.push(`| ${cell(row.token)} | ${row.kind} | ${row.fr} | ${row.en} | ${row.fr + row.en} |`);
  }
  if (!table.length) lines.push("| — | — | 0 | 0 | 0 |");
  lines.push("");

  const atLeastThree = table.filter((row) => row.fr + row.en >= 3);
  lines.push(`## Jetons présents au moins 3 fois (${atLeastThree.length})`, "");
  if (atLeastThree.length) {
    lines.push(atLeastThree.map((row) => `${row.token} (${row.fr + row.en})`).join(" · "), "");
  } else {
    lines.push("Aucun.", "");
  }
  const absent = [...kinds.keys()].filter((token) => !table.some((row) => row.token === token));
  lines.push("## Jetons absents", "");
  lines.push(absent.length ? absent.join(" · ") : "Aucun.", "");
  return lines.join("\n") + "\n";
}

const files = await listFiles();
const server = await startServer();
const { browser, page } = await launch();
const rows = [];
const startedAt = new Date();
try {
  await page.goto(server.url);
  await page.waitForSelector("#key-speak", { timeout: 30_000 });
  await page.evaluate(async () => { await import("/src/pdf.js"); await import("/src/pptx.js"); });
  for (const [index, file] of files.entries()) {
    process.stderr.write(`[${index + 1}/${files.length}] ${path.basename(file.path)}… `);
    const result = await extractInPage(page, file);
    rows.push({ file, type: /\.pptx$/i.test(file.path) ? "PPTX" : "PDF", ...result });
    process.stderr.write(result.ok
      ? `${result.chars} car., ${result.language}, ${result.counts.length} jeton(s)\n`
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
