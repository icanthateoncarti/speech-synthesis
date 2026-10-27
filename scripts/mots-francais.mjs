// Repère les mots français dans les cours détectés en anglais : noms de villes
// et d'écoles, termes belges d'enseignement et d'administration, mots courants.
// Lecture seule : réutilise la liste et l'extraction de `scripts/corpus.mjs`,
// n'écrit qu'un rapport de mots et de chiffres dans ~/inbox.
//
// Usage :
//   node scripts/mots-francais.mjs [--limit=40] [--report=~/inbox/mots-francais-….md]

import { readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "../tests/e2e/harness.mjs";
import { listFiles } from "./corpus.mjs";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));
const limit = Number(args.get("limit") ?? 40);
const topCount = Number(args.get("top") ?? 80);
const today = new Date().toLocaleDateString("fr-CA");
const reportPath = String(args.get("report") ?? path.join(os.homedir(), "inbox", `mots-francais-speechsynthe-${today}.md`));

// Villes, communes et lieux belges (formes françaises).
const PLACES = [
  "Bruxelles", "Bruxelles-Capitale", "Bruges", "Gand", "Anvers", "Malines", "Alost", "Termonde",
  "Courtrai", "Roulers", "Ypres", "Furnes", "Ostende", "Louvain", "Vilvorde", "Tirlemont",
  "Saint-Trond", "Tongres", "Waremme", "Huy", "Verviers", "Spa", "Malmedy", "Saint-Vith", "Eupen",
  "Arlon", "Bastogne", "Marche-en-Famenne", "Rochefort", "Dinant", "Ciney", "Bouillon", "Virton",
  "Aubange", "Ath", "Mouscron", "Comines-Warneton", "Péruwelz", "Soignies", "Enghien", "Tubize",
  "Nivelles", "Wavre", "Waterloo", "Braine-l'Alleud", "Braine-le-Comte", "La Louvière", "Mons",
  "Charleroi", "Namur", "Liège", "Tournai", "Luxembourg", "Jodoigne", "Gembloux", "Ottignies",
  "Louvain-la-Neuve", "Rixensart", "Genval", "Lasne", "Beauvechain", "Grez-Doiceau", "Chaumont-Gistoux",
  "Villers-la-Ville", "Fleurus", "Sambreville", "Tamines", "Auvelais", "Jemeppe-sur-Sambre", "Perwez",
  "Éghezée", "Andenne", "Seilles", "Wanze", "Amay", "Engis", "Flémalle", "Seraing", "Saint-Nicolas",
  "Ans", "Awans", "Grâce-Hollogne", "Herstal", "Oupeye", "Visé", "Bassenge", "Fourons", "Dison",
  "Pepinster", "Theux", "Stavelot", "Trois-Ponts", "Vielsalm", "Houffalize", "La Roche-en-Ardenne",
  "Durbuy", "Hotton", "Neufchâteau", "Bertrix", "Libramont", "Saint-Hubert", "Nassogne", "Tellin",
  "Wellin", "Daverdisse", "Redu", "Transinne", "Laeken", "Neder-Over-Heembeek", "Haren", "Anderlecht",
  "Auderghem", "Berchem-Sainte-Agathe", "Etterbeek", "Evere", "Forest", "Ganshoren", "Ixelles",
  "Jette", "Koekelberg", "Molenbeek-Saint-Jean", "Saint-Gilles", "Saint-Josse-ten-Noode", "Schaerbeek",
  "Uccle", "Watermael-Boitsfort", "Woluwe-Saint-Lambert", "Woluwe-Saint-Pierre", "Dilbeek", "Zaventem",
];

// Enseignement, formation et vie étudiante.
const EDUCATION = [
  "enseignement", "enseignant", "enseignante", "étudiant", "étudiante", "école", "université",
  "faculté", "institut", "collège", "lycée", "athénée", "académie", "campus", "département",
  "section", "filière", "orientation", "bachelier", "master", "licence", "agrégation", "jury",
  "mémoire", "stage", "cours", "séminaire", "examen", "session", "quadrimestre", "semestre",
  "crédit", "crédits", "horaire", "programme", "syllabus", "polycopié", "inscription", "réinscription",
  "frais", "bourse", "allocation", "attestation", "certificat", "diplôme", "relevé", "bulletin",
  "note", "cote", "mention", "distinction", "réussite", "échec", "ajournement", "recours", "appel",
  "doyen", "recteur", "professeur", "chargé", "assistant", "promoteur", "secrétariat", "scolarité",
  "administration", "direction", "conseil", "commission", "comité", "réunion", "procès-verbal",
  "ordre", "travail", "travaux", "projet", "projets", "équipe", "équipes", "groupe", "groupes",
  "entreprise", "entreprises", "gestion", "économie", "comptabilité", "finance", "droit", "médecine",
  "ingénieur", "informatique", "données", "numérique", "recherche", "développement", "innovation",
  "stratégie", "objectif", "objectifs", "résultat", "résultats", "analyse", "synthèse", "introduction",
  "conclusion", "chapitre", "partie", "module", "unité", "leçon", "exercice", "exercices", "question",
  "questions", "réponse", "réponses", "exemple", "exemples", "définition", "définitions", "document",
  "documents", "texte", "textes", "page", "pages", "tableau", "tableaux", "figure", "figures",
  "annexe", "annexes", "source", "sources", "référence", "références", "bibliographie",
];

// Administration, vie publique et formalités belges.
const ADMINISTRATION = [
  "commune", "communal", "échevin", "bourgmestre", "CPAS", "région", "communauté", "fédéral",
  "Wallonie", "Flandre", "parlement", "gouvernement", "ministère", "cabinet", "arrêté", "décret",
  "loi", "règlement", "circulaire", "formulaire", "dossier", "demande", "annexe", "pièce",
  "signature", "adresse", "rue", "avenue", "boulevard", "place", "code", "postal", "numéro",
  "téléphone", "courriel", "site", "service", "guichet", "agent", "fonctionnaire", "document",
  "attestation", "certificat", "carte", "identité", "passeport", "permis", "séjour", "résidence",
  "revenu", "impôt", "taxe", "facture", "paiement", "virement", "compte", "banque", "assurance",
  "mutuelle", "santé", "médecin", "pharmacie", "hôpital", "clinique", "famille", "enfant", "enfants",
  "parent", "parents", "domicile", "logement", "loyer", "bail", "propriétaire", "locataire",
];

// Mots français courants, utiles pour repérer les passages cités.
const COMMON = [
  "le", "la", "les", "de", "des", "du", "un", "une", "et", "en", "dans", "pour", "avec", "sur",
  "par", "au", "aux", "ce", "cette", "ces", "est", "sont", "être", "avoir", "fait", "faire", "plus",
  "moins", "tout", "tous", "toute", "toutes", "comme", "mais", "ou", "où", "donc", "or", "ni",
  "car", "qui", "que", "quoi", "dont", "son", "sa", "ses", "leur", "leurs", "notre", "nos",
  "votre", "vos", "mon", "ma", "mes", "ton", "ta", "tes", "je", "tu", "il", "elle", "nous",
  "vous", "ils", "elles", "on", "se", "me", "te", "lui", "y", "ne", "pas", "jamais", "rien",
  "très", "bien", "aussi", "autre", "autres", "même", "mêmes", "premier", "première", "deuxième",
  "troisième", "dernier", "dernière", "nouveau", "nouvelle", "grand", "grande", "petit", "petite",
  "bon", "bonne", "mauvais", "mauvaise", "haut", "bas", "avant", "après", "pendant", "depuis",
  "chez", "sans", "sous", "entre", "vers", "contre", "devant", "derrière", "près", "loin", "ici",
  "là", "aujourd'hui", "demain", "hier", "maintenant", "alors", "ainsi", "encore", "toujours",
  "souvent", "parfois", "déjà", "enfin", "ensuite", "puis", "quand", "comment", "pourquoi",
  "combien", "quel", "quelle", "quels", "quelles", "chaque", "quelque", "quelques", "plusieurs",
  "aucun", "aucune", "certain", "certaine", "personne", "chose", "choses", "temps", "jour", "jours",
  "année", "années", "mois", "semaine", "semaines", "heure", "heures", "minute", "matin", "soir",
  "nuit", "merci", "bonjour", "bienvenue", "monsieur", "madame", "mademoiselle", "docteur",
];

const LEXICON = [...new Set([...PLACES, ...EDUCATION, ...ADMINISTRATION, ...COMMON].map((word) => word.toLocaleLowerCase("fr")))];
if (LEXICON.length < 200) throw new Error(`liste française trop courte : ${LEXICON.length} mots`);

// Mots sans accent qui sont aussi des mots anglais courants : la voix anglaise
// les dit déjà à l'anglaise, ils ne sont pas des cibles de réécriture.
const ENGLISH_HOMOGRAPHS = new Set([
  "or", "on", "site", "service", "master", "question", "questions", "analyse", "page", "pages",
  "code", "session", "note", "place", "agent", "document", "documents", "certain", "car", "comment",
  "stage", "figure", "figures", "source", "sources", "module", "section", "introduction", "conclusion",
  "direction", "commission", "administration", "campus", "jury", "licence", "finance", "innovation",
  "parent", "parents", "bail", "assurance", "domicile", "ton", "son", "me", "minute",
]);

// Articles, pronoms, prépositions, conjonctions et adverbes : trop courts ou trop
// grammaticaux pour être les cibles d'une correction de prononciation.
const GRAMMAR = new Set([
  "le", "la", "les", "de", "des", "du", "un", "une", "et", "en", "dans", "pour", "avec", "sur",
  "par", "au", "aux", "ce", "cette", "ces", "est", "sont", "être", "avoir", "fait", "faire", "plus",
  "moins", "tout", "tous", "toute", "toutes", "comme", "mais", "ou", "où", "donc", "ni", "qui",
  "que", "quoi", "dont", "sa", "ses", "leur", "leurs", "notre", "nos", "votre", "vos", "mon", "ma",
  "mes", "ta", "tes", "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "se", "te", "lui",
  "y", "ne", "pas", "jamais", "rien", "très", "bien", "aussi", "autre", "autres", "même", "mêmes",
  "premier", "première", "deuxième", "troisième", "dernier", "dernière", "nouveau", "nouvelle",
  "grand", "grande", "petit", "petite", "bon", "bonne", "mauvais", "mauvaise", "haut", "bas",
  "avant", "après", "pendant", "depuis", "chez", "sans", "sous", "entre", "vers", "contre",
  "devant", "derrière", "près", "loin", "ici", "là", "demain", "maintenant", "alors", "ainsi",
  "encore", "toujours", "souvent", "parfois", "enfin", "ensuite", "puis", "quand", "pourquoi",
  "combien", "quel", "quelle", "quels", "quelles", "chaque", "quelque", "quelques", "plusieurs",
  "aucun", "aucune", "certaine",
]);
const SKIP = new Set([...ENGLISH_HOMOGRAPHS, ...GRAMMAR]);

const ACCENT = /[éèêëàâäçîïôöùûüÿœæ]/u;

async function countInPage(page, file) {
  const bytes = await readFile(file.path);
  const base64 = bytes.toString("base64");
  return page.evaluate(async ({ name, type, base64, lexicon, skip }) => {
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
      if (language !== "en") return { ok: true, language, chars: text.length, counts: [] };
      const known = new Set(lexicon), ignored = new Set(skip);
      const accent = /[éèêëàâäçîïôöùûüÿœæ]/u;
      const counts = new Map();
      for (const token of text.match(/\p{L}+(?:[-'’]\p{L}+)*/gu) ?? []) {
        const word = token.toLocaleLowerCase("fr");
        const listed = known.has(word), accented = accent.test(word);
        if (!listed && !accented) continue;
        // Un mot sans accent identique à un mot anglais n'est pas une cible.
        if (!accented && ignored.has(word)) continue;
        const entry = counts.get(word) ?? { count: 0, source: listed ? (accented ? "liste + accent" : "liste") : "accent" };
        entry.count++;
        if (listed && accented) entry.source = "liste + accent";
        counts.set(word, entry);
      }
      return {
        ok: true,
        language,
        chars: text.length,
        counts: [...counts].map(([word, { count, source }]) => [word, count, source]),
      };
    } catch (error) {
      return { ok: false, language: "", chars: 0, counts: [], error: { name: error?.name ?? "Error", message: String(error?.message ?? error) } };
    }
  }, { name: path.basename(file.path), type: /\.pptx$/i.test(file.path) ? "PPTX" : "PDF", base64, lexicon: LEXICON, skip: [...SKIP] });
}

function formatReport(rows, startedAt) {
  const english = rows.filter((row) => row.ok && row.language === "en");
  const totals = new Map();
  for (const row of english) {
    for (const [word, count, source] of row.counts) {
      const item = totals.get(word) ?? { word, count: 0, documents: 0, source };
      item.count += count;
      item.documents++;
      if (source === "liste + accent") item.source = source;
      totals.set(word, item);
    }
  }
  const top = [...totals.values()].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, "fr")).slice(0, topCount);
  const lines = [];
  lines.push(`# Mots français dans les cours en anglais — ${today}`, "");
  lines.push(`Généré le ${startedAt.toLocaleString("fr-FR")} par \`scripts/mots-francais.mjs\`.`, "");
  lines.push(`${rows.length} fichiers analysés, ${english.length} détectés en anglais, ${totals.size} mots candidats distincts.`, "");
  lines.push(`Un mot est candidat s'il contient un accent français ou figure dans la liste du script (villes et communes belges, enseignement, administration, mots courants). Les articles, pronoms, prépositions, conjonctions et mots identiques en anglais sont écartés : la voix anglaise les dit déjà ou ils ne sont pas des cibles. Les ${topCount} plus fréquents :`, "");
  lines.push("| # | Mot | Occurrences | Documents | Repéré par |");
  lines.push("|---:|---|---:|---:|---|");
  top.forEach((item, index) => lines.push(`| ${index + 1} | ${item.word} | ${item.count} | ${item.documents} | ${item.source} |`));
  lines.push("");
  lines.push("Les erreurs d'extraction ne sont pas comptées ici ; voir le rapport `corpus-speechsynthe-*.md`.");
  lines.push("");
  return lines.join("\n");
}

const files = await listFiles({ limit, includeScreenshots: false });
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
    const result = await countInPage(page, file);
    rows.push({ file, ...result });
    process.stderr.write(result.ok
      ? `${result.language}, ${result.counts.length} mot(s) candidat(s), ${result.chars} car.\n`
      : `ERREUR ${result.error.name} : ${result.error.message}\n`);
  }
} finally {
  await browser.close();
  await server.close();
}

const report = formatReport(rows, startedAt);
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, report);
console.log(reportPath);
