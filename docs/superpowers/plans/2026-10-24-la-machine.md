# « La Machine » — plan de construction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** remplacer la page actuelle de speechsynthe.si par « La Machine » : un outil de synthèse vocale française qui tourne entièrement dans le navigateur. On y tape un texte, on choisit Jessica ou Tom, on règle la vitesse, on écoute, on télécharge le MP3 et on peut importer un PDF. Une FAQ sous la machine sert au SEO.

**Architecture :** site 100 % statique sur GitHub Pages, sans étape de build : ES modules natifs, avec une *import map* pour les bibliothèques chargées depuis un CDN. La synthèse tourne dans un Web Worker grâce à une copie adaptée de `@diffusionstudio/vits-web`, à laquelle on ajoute la vitesse. La logique pure (texte, WAV/MP3, états de la machine) est testée avec `node --test`. Le comportement dans le vrai navigateur est testé avec puppeteer-core et le Chrome du Mac.

**Tech Stack :**
- HTML/CSS/JS sans framework
- `@diffusionstudio/vits-web` 1.0.3 (MIT), copié dans le projet, avec onnxruntime-web 1.18.0
- `@paper-design/shaders` 0.0.82 (Apache-2.0)
- `@breezystack/lamejs` 1.2.7 (LGPL-3.0)
- `pdfjs-dist` 6.4.299 (Apache-2.0)
- Node 25 (`node --test`), puppeteer-core 23

**Spec :** `docs/superpowers/specs/2026-10-24-la-machine-design.md`. La maquette validée est le concept 1 de `.superpowers/brainstorm/34728-1792798307/content/concepts-v2.html` : la reprendre pour les couleurs, les polices et les proportions.

## Global Constraints

- Hébergement statique GitHub Pages, aucun backend. Le site s'ouvre depuis la racine du dépôt (`index.html`).
- Aucun appel réseau autre que : le téléchargement des modèles de voix (Hugging Face), les bibliothèques sur CDN et, en tâche 10 seulement, le compteur de pages vues. **Le texte de l'utilisateur ne quitte jamais le navigateur.**
- Premier écran : **aucun texte marketing ou explicatif**. Seuls sont autorisés :
  - `speechsynthe.si` en haut à gauche ;
  - la sérigraphie de la machine ;
  - les libellés des commandes ;
  - la ligne d'état de l'écran.
  - les repères d'usage validés le 2026-10-25 : `1 · TEXTE`, `2 · RÉGLAGES`, `3 · ÉCOUTE`, `4 · EXPORT`.
- Voix : **Jessica** = `fr_FR-upmc-medium` (locuteur 0, **voix par défaut**) ; **Tom** = `fr_FR-tom-medium`. Aucune autre voix.
- Vitesse : de **0,7× à 1,5×**, par pas de 0,1, cran central à **1,0×**. Elle est appliquée à la synthèse : `length_scale = 1 / vitesse`.
- Libellés de la ligne d'état (copie exacte) : `PRÊT`, `CHARGEMENT VOIX 42 %`, `SYNTHÈSE…`, `▶ LECTURE`, `✓ MP3 PRÊT`, `ÉCRAN VIDE`, `PDF SANS TEXTE`, `ERREUR RÉSEAU · RÉESSAIE`. À droite : `VOIX : JESSICA · VITESSE 1.0×`.
- `<title>` (copie exacte) : `Synthèse vocale gratuite en français — texte en audio MP3 | speechsynthe.si`.
- Le `<h1>` est gravé sur le boîtier : `Synthèse vocale`.
- Tutoiement partout. Les questions de la FAQ reprennent la formulation des recherches Google.
- Crédits obligatoires en bas de page :
  - Piper ;
  - jeu de données UPMC sous **CC BY-SA 4.0** (Jessica) ;
  - modèle Tom sous **AGPLv3** ;
  - lien vers le code source `https://github.com/icanthateoncarti/speech-synthesis`.
- Uniquement des bibliothèques open source, aucun SaaS payant.
- Sur téléphone, toutes les commandes font au moins 44 × 44 px.
- `prefers-reduced-motion` : pas de grain animé et pas de curseur qui clignote.
- Aucun cookie et aucune bannière de consentement.

## Review Focus

1. **Texte très long**, par exemple un PDF de 30 pages : la page reste réactive et la lecture démarre avant la fin de toute la synthèse. Testé en tâche 6.
2. **Texte, voix ou vitesse modifiés après une génération** : on ne doit jamais jouer ni télécharger l'ancien audio. Testé en tâches 3 et 6.
3. **Réseau coupé pendant le premier téléchargement d'une voix** : la ligne d'état affiche `ERREUR RÉSEAU · RÉESSAIE` et un nouvel appui sur PARLE relance le téléchargement. Testé en tâche 6.
4. **PDF scanné, sans couche texte** : `PDF SANS TEXTE` s'affiche et l'écran garde son contenu précédent. Testé en tâche 7.
5. **Écran vide, que des espaces, ou que des emojis et de la ponctuation** : PARLE et MP3 ne lancent rien et affichent `ÉCRAN VIDE`. Testé en tâches 1 et 3.

---

## Structure des fichiers

```
index.html                  page unique : machine + FAQ + crédits + import map + JSON-LD
styles/machine.css          machine, page, FAQ, responsive, reduced-motion
src/text.js                 logique texte pure (Node + navigateur)
src/audio.js                WAV ↔ MP3 pur (Node + navigateur)
src/machine.js              états de la machine + libellés de la ligne d'état (pur)
src/tts.js                  API de synthèse côté page (parle au worker)
src/tts-worker.js           Web Worker qui fait tourner vits-web
src/vendor/vits-web/        copie adaptée de @diffusionstudio/vits-web 1.0.3 (MIT)
src/player.js               lecture WebAudio + niveau du vumètre + temps
src/pdf.js                  extraction du texte d'un PDF (pdf.js chargé à la demande)
src/shader.js               grain du plastique (Paper shaders) + repli sans WebGL
src/main.js                 câblage DOM ↔ machine ↔ tts ↔ player
assets/og.png               image de partage 1200×630
robots.txt, sitemap.xml
tests/unit/*.test.js        node --test
tests/e2e/harness.mjs       serveur statique + Chrome (puppeteer-core)
tests/e2e/*.test.mjs        tests navigateur
tests/fixtures/             PDF de test
```

À supprimer : l'ancien contenu de `index.html` (la v1 « Vrai ou IA ? »). On garde `CNAME`, `favicon.svg` et `README.md`, qu'on met à jour.

---

### Task 1 : outillage de test et logique texte

**Files :**
- Create : `package.json`, `src/text.js`, `tests/unit/text.test.js`
- Modify : `.gitignore` (ajouter `node_modules/` et `tests/e2e/.chrome-profile/`)

**Interfaces :**
- Produces (`src/text.js`) :
  - `normalizeText(raw: string): string` : enlève les caractères de contrôle, réduit les espaces multiples à un seul, garde les retours à la ligne simples et fait un `trim`.
  - `hasSpeakableContent(text: string): boolean` : vrai si le texte contient au moins une lettre ou un chiffre (`/[\p{L}\p{N}]/u`).
  - `splitIntoChunks(text: string, maxChars = 400): string[]` : découpe aux fins de phrase (`. ! ? …`) et aux retours à la ligne. Une phrase trop longue est recoupée aux `, ; :`, puis aux espaces. Aucun morceau ne dépasse `maxChars`, aucun n'est vide, aucun ne manque de contenu prononçable.
  - `clampSpeed(x: number): number` : borne à [0.7, 1.5], arrondit à 0,1.
  - `speedToLengthScale(speed: number): number` : `Math.round(100 / clampSpeed(speed)) / 100`.
  - `wordTimeline(chunks: string[], durations: number[]): {word: string, start: number, end: number}[]` : pour chaque morceau, répartit sa durée entre ses mots au prorata de leur nombre de caractères. Les morceaux s'enchaînent bout à bout.

- [x] **Step 1 : `package.json`**

```json
{
  "name": "speech-synthesis",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/unit/",
    "test:e2e": "node --test --test-concurrency=1 tests/e2e/"
  },
  "devDependencies": {
    "@breezystack/lamejs": "1.2.7",
    "puppeteer-core": "^23.0.0"
  }
}
```

Run : `npm install`. Expected : `node_modules/` créé, aucune erreur.

- [x] **Step 2 : écrire les tests qui échouent** dans `tests/unit/text.test.js`

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeText, hasSpeakableContent, splitIntoChunks, clampSpeed, speedToLengthScale, wordTimeline } from "../../src/text.js";

test("normalizeText réduit les espaces et trim", () => {
  assert.equal(normalizeText("  Bonjour\t\t le   monde \u0007 "), "Bonjour le monde");
});
test("hasSpeakableContent refuse vide, espaces, emojis seuls", () => {
  for (const t of ["", "   ", "🙂🙂 !!", "… ?"]) assert.equal(hasSpeakableContent(t), false);
  assert.equal(hasSpeakableContent("1789"), true);
});
test("splitIntoChunks coupe aux phrases", () => {
  assert.deepEqual(splitIntoChunks("Bonjour le monde. Ça va ? Oui!"), ["Bonjour le monde.", "Ça va ?", "Oui!"]);
});
test("splitIntoChunks ne dépasse jamais maxChars et ignore le non-prononçable", () => {
  const long = ("mot ".repeat(300)).trim() + ".";
  const chunks = splitIntoChunks(long + " 🙂🙂. Fin.", 400);
  assert.ok(chunks.every(c => c.length > 0 && c.length <= 400));
  assert.ok(chunks.every(hasSpeakableContent));
  assert.equal(chunks.at(-1), "Fin.");
  assert.deepEqual(splitIntoChunks("🙂 !!"), []);
});
test("splitIntoChunks tient 50 000 caractères", () => {
  const big = "Le peuple de Paris prend la Bastille. ".repeat(1400);
  assert.ok(splitIntoChunks(big).length > 100);
});
test("vitesse bornée et convertie", () => {
  assert.equal(clampSpeed(2), 1.5); assert.equal(clampSpeed(0.2), 0.7); assert.equal(clampSpeed(1.04), 1.0);
  assert.equal(speedToLengthScale(1.0), 1); assert.equal(speedToLengthScale(1.5), 0.67); assert.equal(speedToLengthScale(0.7), 1.43);
});
test("wordTimeline enchaîne les morceaux", () => {
  const tl = wordTimeline(["Bonjour le monde.", "Salut."], [1.0, 0.5]);
  assert.equal(tl.length, 4);
  assert.equal(tl[0].start, 0);
  assert.equal(tl[3].word, "Salut.");
  assert.equal(tl[3].start, 1.0);
  assert.equal(tl[3].end, 1.5);
  for (let i = 1; i < tl.length; i++) assert.ok(tl[i].start >= tl[i - 1].end - 1e-9);
});
```

- [x] **Step 3 : vérifier l'échec.** Run : `npm test`. Expected : FAIL, `Cannot find module '../../src/text.js'`.
- [x] **Step 4 : implémenter `src/text.js`** avec les signatures ci-dessus.
- [x] **Step 5 : vérifier le succès.** Run : `npm test`. Expected : tous les tests `text` passent.
- [x] **Step 6 : commit.** `git add package.json package-lock.json .gitignore src/text.js tests/unit/text.test.js && git commit -m "Logique texte : découpage, vitesse, minutage des mots"`

---

### Task 2 : WAV et MP3

**Files :**
- Create : `src/audio.js`, `tests/unit/audio.test.js`

**Interfaces :**
- Produces (`src/audio.js`) :
  - `parseWav(buf: ArrayBuffer): {sampleRate: number, samples: Int16Array}` : WAV PCM 16 bits mono, celui que produit vits-web. Lève une erreur si l'en-tête n'est pas `RIFF`/`WAVE`.
  - `encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer`
  - `concatWavs(bufs: ArrayBuffer[]): ArrayBuffer` : les morceaux ont le même taux d'échantillonnage. On insère **150 ms de silence** entre deux morceaux.
  - `wavDuration(buf: ArrayBuffer): number` : en secondes.
  - `wavToMp3(buf: ArrayBuffer, kbps = 96): Promise<Uint8Array>` : utilise `Mp3Encoder` de `@breezystack/lamejs` par blocs de 1152 échantillons, et rend la main toutes les 50 trames (`await new Promise(r => setTimeout(r))`) pour ne pas figer la page.

- [x] **Step 1 : tests qui échouent** dans `tests/unit/audio.test.js`. Les fixtures sont fabriquées en mémoire : une sinusoïde de 1 s à 22 050 Hz, passée dans `encodeWav`.

```js
test("encodeWav puis parseWav est un aller-retour", ...);            // même sampleRate, mêmes échantillons
test("parseWav refuse un fichier qui n'est pas un WAV", ...);        // assert.throws
test("concatWavs ajoute 150 ms de silence entre morceaux", () => {
  // deux sinusoïdes de 1 s → durée 2.15 s (±0.001)
});
test("wavToMp3 produit un MP3 non vide", async () => {
  const mp3 = await wavToMp3(oneSecondWav);
  assert.ok(mp3.length > 1000);
  assert.ok((mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0) || (mp3[0] === 0x49 && mp3[1] === 0x44)); // trame MP3 ou ID3
});
```

- [x] **Step 2 : vérifier l'échec.** Run : `npm test`. Expected : FAIL sur l'import de `src/audio.js`.
- [x] **Step 3 : implémenter `src/audio.js`.** Importer `Mp3Encoder` depuis `"@breezystack/lamejs"`. Dans Node, il vient de `node_modules`. Dans le navigateur, l'import map de la tâche 5 le fait pointer vers jsDelivr.
- [x] **Step 4 : vérifier le succès.** Run : `npm test`. Expected : PASS.
- [x] **Step 5 : commit.** `git commit -m "Audio : WAV, concaténation, encodage MP3"`

---

### Task 3 : états de la machine

**Files :**
- Create : `src/machine.js`, `tests/unit/machine.test.js`

**Interfaces :**
- Consumes : `hasSpeakableContent`, `clampSpeed` de `src/text.js`.
- Produces (`src/machine.js`) :
  - `initialState(): State`. Valeur : `{ text: "", voice: "jessica", speed: 1.0, phase: "idle", downloadPct: null, error: null, notice: null, audio: null }`.
    - `phase` ∈ `"idle" | "downloading" | "synthesizing" | "playing"`.
    - `audio` vaut `{ key: string, wav: ArrayBuffer | null, mp3: Uint8Array | null } | null`.
  - `audioKey(state): string`, qui renvoie `${voice}|${speed.toFixed(1)}|${text}`.
  - `reduce(state, event): State`. Les événements `{type, ...}` :
    - `TEXT_CHANGED{text}`, `VOICE_CHANGED{voice}`, `SPEED_CHANGED{speed}` : met à jour et **vide `audio` si `audioKey` change**.
    - `SPEAK_PRESSED` : si `phase === "playing"`, passe à `"idle"`. Si le texte n'est pas prononçable, `notice = "empty"`. Sinon, ne change rien (c'est `main.js` qui lance la synthèse).
    - `DOWNLOAD_PROGRESS{pct}` → `downloading`.
    - `SYNTH_STARTED` → `synthesizing`.
    - `PLAYBACK_STARTED` → `playing`.
    - `PLAYBACK_ENDED` et `STOP` → `idle`.
    - `AUDIO_READY{key, wav}` : stocké **seulement si `key === audioKey(state)`**.
    - `MP3_READY{key, mp3}` : même règle.
    - `ERROR{kind: "network" | "other"}`.
    - `PDF_EMPTY` → `notice = "pdf-empty"`, le texte ne change pas.
    - `CLEAR` → texte vide, `audio = null`, `phase = "idle"`.
    - Tout événement d'action efface `notice` et `error`.
  - `statusLine(state): { left: string, right: string }`. Les libellés exacts sont dans Global Constraints.
    - Priorité de `left` : `error` > `notice` > `phase`. Puis `✓ MP3 PRÊT` si `audio?.mp3`, sinon `PRÊT`.
    - `right` vaut `VOIX : JESSICA · VITESSE 1.0×`, ou `TOM`, avec la vitesse à une décimale.

- [x] **Step 1 : tests qui échouent** dans `tests/unit/machine.test.js` :

```js
test("état initial : Jessica, 1.0×, PRÊT", () => {
  assert.deepEqual(statusLine(initialState()), { left: "PRÊT", right: "VOIX : JESSICA · VITESSE 1.0×" });
});
test("PARLE sur écran vide ou emojis → ÉCRAN VIDE", () => {
  for (const text of ["", "   ", "🙂 !!"]) {
    const s = reduce(reduce(initialState(), { type: "TEXT_CHANGED", text }), { type: "SPEAK_PRESSED" });
    assert.equal(statusLine(s).left, "ÉCRAN VIDE");
  }
});
test("progression du téléchargement", () => {
  assert.equal(statusLine(reduce(initialState(), { type: "DOWNLOAD_PROGRESS", pct: 42 })).left, "CHARGEMENT VOIX 42 %");
});
test("changer voix, vitesse ou texte invalide l'audio", () => {
  let s = reduce(initialState(), { type: "TEXT_CHANGED", text: "Bonjour." });
  s = reduce(s, { type: "AUDIO_READY", key: audioKey(s), wav: new ArrayBuffer(8) });
  assert.ok(s.audio);
  for (const ev of [{ type: "VOICE_CHANGED", voice: "tom" }, { type: "SPEED_CHANGED", speed: 1.2 }, { type: "TEXT_CHANGED", text: "Salut." }]) {
    assert.equal(reduce(s, ev).audio, null);
  }
});
test("un audio arrivé en retard pour une autre clé est ignoré", () => {
  let s = reduce(initialState(), { type: "TEXT_CHANGED", text: "Bonjour." });
  const oldKey = audioKey(s);
  s = reduce(s, { type: "VOICE_CHANGED", voice: "tom" });
  assert.equal(reduce(s, { type: "AUDIO_READY", key: oldKey, wav: new ArrayBuffer(8) }).audio, null);
});
test("PARLE pendant la lecture arrête", () => {
  const s = reduce({ ...initialState(), text: "Bonjour.", phase: "playing" }, { type: "SPEAK_PRESSED" });
  assert.equal(s.phase, "idle");
});
test("erreurs et avis", () => {
  assert.equal(statusLine(reduce(initialState(), { type: "ERROR", kind: "network" })).left, "ERREUR RÉSEAU · RÉESSAIE");
  const s = reduce({ ...initialState(), text: "Gardé." }, { type: "PDF_EMPTY" });
  assert.equal(statusLine(s).left, "PDF SANS TEXTE"); assert.equal(s.text, "Gardé.");
});
test("vitesse et voix dans la partie droite", () => {
  let s = reduce(initialState(), { type: "VOICE_CHANGED", voice: "tom" });
  s = reduce(s, { type: "SPEED_CHANGED", speed: 1.2 });
  assert.equal(statusLine(s).right, "VOIX : TOM · VITESSE 1.2×");
});
test("MP3 prêt", () => {
  let s = reduce(initialState(), { type: "TEXT_CHANGED", text: "Bonjour." });
  s = reduce(s, { type: "AUDIO_READY", key: audioKey(s), wav: new ArrayBuffer(8) });
  s = reduce(s, { type: "MP3_READY", key: audioKey(s), mp3: new Uint8Array(4) });
  assert.equal(statusLine(s).left, "✓ MP3 PRÊT");
});
```

- [x] **Step 2 : vérifier l'échec.** Run : `npm test`. Expected : FAIL.
- [x] **Step 3 : implémenter `src/machine.js`.**
- [x] **Step 4 : vérifier le succès.** Run : `npm test`. Expected : PASS (text, audio, machine).
- [x] **Step 5 : commit.** `git commit -m "Machine : états, invalidation de l'audio, ligne d'état"`

---

### Task 4 : moteur de voix dans un worker, avec la vitesse

**Files :**
- Create :
  - `src/vendor/vits-web/vits-web.js` et `src/vendor/vits-web/piper-DeOu3H9E.js` : copiés depuis `npm pack @diffusionstudio/vits-web@1.0.3`, dossier `dist/` ;
  - `src/vendor/vits-web/LICENSE` (MIT) et `src/vendor/vits-web/PATCHES.md` ;
  - `src/tts-worker.js`, `src/tts.js` ;
  - `tests/e2e/harness.mjs`, `tests/e2e/fixtures/tts.html`, `tests/e2e/tts.test.mjs`.

**Interfaces :**
- Consumes : `splitIntoChunks`, `speedToLengthScale` (tâche 1) ; `concatWavs`, `wavDuration` (tâche 2).
- Produces :
  - `src/tts.js` :
    - `VOICES = { jessica: "fr_FR-upmc-medium", tom: "fr_FR-tom-medium" }` ;
    - `createTts(): Tts`, avec `Tts.synthesize({ text: string, voice: "jessica" | "tom", speed: number }, { onProgress?(pct: number), onChunk?(wav: ArrayBuffer, index: number, total: number) }): Promise<{ wav: ArrayBuffer, chunks: string[], durations: number[] }>`.
      - Les morceaux sont synthétisés l'un après l'autre. `onChunk` est appelé dès que chaque morceau est prêt, pour la lecture en continu.
      - L'erreur est rejetée avec `err.kind = "network"` si le téléchargement du modèle échoue, `"other"` sinon.
    - `Tts.cancel(): void` : abandonne la synthèse en cours. La promesse est rejetée avec `err.kind = "cancelled"`.
    - `Tts.preload(voice: "jessica" | "tom", { onProgress?(pct: number) }): Promise<void>` : télécharge le modèle sans synthétiser (message worker `{ id, type: "download", voiceId }`, appelle `download` de vits-web). Mêmes erreurs que `synthesize`.
  - `tests/e2e/harness.mjs` :
    - `startServer(): Promise<{ url: string, close(): Promise<void> }>` : serveur statique `node:http` à la racine du dépôt, sur un port libre ;
    - `launch({ profile = "tests/e2e/.chrome-profile", viewport = {width: 1340, height: 900}, reducedMotion = false } = {}): Promise<{ browser, page }>` : puppeteer-core, `executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, headless, args `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. Le profil persistant garde les modèles de voix en cache (OPFS) d'un test à l'autre.

- [x] **Step 1 : copier et adapter vits-web.** Dans `vits-web.js`, seulement deux modifications, décrites dans `PATCHES.md` :
  1. `g = i.inference.length_scale` devient `g = e.lengthScale ?? i.inference.length_scale`. `e` est la config passée à `predict`.
  2. `import("onnxruntime-web")` devient `import("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/+esm")`. Les workers ne lisent pas les import maps.
- [x] **Step 2 : test navigateur qui échoue** dans `tests/e2e/tts.test.mjs`. La page `fixtures/tts.html` importe `/src/tts.js` et expose `window.tts = createTts()`.

```js
test("Jessica et Tom synthétisent, la vitesse change vraiment la durée", { timeout: 300_000 }, async () => {
  // page.evaluate : synthétise "Le 14 juillet 1789, le peuple de Paris prend la Bastille." en jessica à 1.0 puis à 1.5, et en tom à 1.0
  // attendu : chaque wav a une durée > 1 s ; durée(1.5) / durée(1.0) entre 0.55 et 0.80 ; tom ne lève pas d'erreur
});
test("onChunk arrive avant la fin pour un texte de 30 phrases", { timeout: 300_000 }, async () => {
  // le premier onChunk arrive alors que la promesse de synthesize n'est pas encore résolue
});
test("réseau coupé au premier téléchargement → err.kind === 'network'", { timeout: 120_000 }, async () => {
  // profil neuf dans un dossier temporaire + page.setRequestInterception : abort pour huggingface.co
});
```

Run : `npm run test:e2e`. Expected : FAIL, `createTts` n'existe pas.
- [x] **Step 3 : implémenter `src/tts-worker.js` et `src/tts.js`.**
  - Messages vers le worker : `{ id, type: "synthesize", text, voiceId, lengthScale }`.
  - Messages en retour : `{ id, type: "progress", pct }`, `{ id, type: "done", wav }` (le `wav` est transféré, pas copié) et `{ id, type: "error", kind, message }`.
  - Le worker appelle `predict({ text, voiceId, lengthScale }, p => post progress)`.
  - Une erreur de `fetch` vers Hugging Face donne `kind: "network"`.
- [x] **Step 4 : vérifier le succès.** Run : `npm run test:e2e`. Expected : PASS. Le premier passage télécharge environ 120 Mo de modèles dans `.chrome-profile`.
- [x] **Step 5 : commit.** `git commit -m "Moteur de voix en worker, vitesse via length_scale"`

---

### Task 5 : la machine (structure, style, grain)

**Files :**
- Modify : `index.html` (réécrit entièrement), `favicon.svg` (garder ou redessiner dans l'esprit de la machine)
- Create : `styles/machine.css`, `src/shader.js`, `tests/e2e/page.test.mjs`

**Interfaces :**
- Produces : la page `index.html`. Ces sélecteurs, utilisés par `main.js` et les tests, sont **figés** :
  - `#screen` : `<textarea>` stylé en écran fluorescent, `aria-label="Texte à lire"`, sans placeholder visible, avec un curseur qui clignote quand il est vide ;
  - `#reader` : `<div>` en lecture seule, superposé à `#screen` pendant la lecture, un `<span class="w">` par mot ;
  - `#status-left`, `#status-right` ;
  - `#key-speak`, `#key-mp3`, `#key-pdf`, `#key-clear` : des `<button>` ;
  - `#pdf-input` : `<input type="file" accept="application/pdf" hidden>` ;
  - `#voice` : `role="radiogroup"` contenant `#voice-jessica` et `#voice-tom` (`role="radio"`), rendu comme le bouton rotatif. Les flèches du clavier changent la voix ;
  - `#speed` : `<input type="range" min="0.7" max="1.5" step="0.1" value="1">`, rendu comme un fader matériel ;
  - `#meter` : 12 barres `<i>` ;
  - `#plastic` : le conteneur du shader.
  - L'import map inclut `"@paper-design/shaders"`, `"@breezystack/lamejs"` et `"pdfjs-dist"`, avec les URL jsDelivr épinglées aux versions du Tech Stack. Pour pdf.js : `build/pdf.min.mjs`.
- Produces (`src/shader.js`) : `mountPlastic(el: HTMLElement, { reducedMotion: boolean }): void`.
  - Il monte `grainGradientFragmentShader` avec les réglages de la maquette : couleur de fond `#e5531a`, couleurs `#ff8a45 #f45f20 #d9440c #ff9a5a`, `softness 0.75`, `intensity 0.3`, `noise 0.7`, `shape 6`, vitesse `0.15`, ou `0` si `reducedMotion`.
  - Il attend `noise.decode()` avant le montage.
  - Sans WebGL, il ajoute la classe `no-webgl` à `el`, et le CSS affiche alors un dégradé orange fixe.

- [x] **Step 1 : test navigateur qui échoue** dans `tests/e2e/page.test.mjs` :

```js
test("premier écran : seulement la machine", async () => {
  // titre exact (Global Constraints) ; h1 visible === "Synthèse vocale"
  // tous les textes visibles dont le rectangle est dans le premier écran (1340×900) appartiennent à :
  // ["speechsynthe.si","speech","synthe.si","Synthèse vocale","▶ PARLE","⬇ MP3","PDF","EFFACE","JESSICA","TOM","VITESSE", libellés de #status-left/#status-right]
});
test("la grille du haut-parleur et le grain sont présents", async () => {
  // #plastic contient un <canvas> ; #meter a 12 barres
});
test("sans WebGL : repli orange", async () => {
  // page.evaluateOnNewDocument : HTMLCanvasElement.prototype.getContext = () => null ; #plastic a la classe no-webgl
});
```

Run : `node --test --test-concurrency=1 --test-name-pattern="premier écran|grain|WebGL" tests/e2e/`. Expected : FAIL.
- [x] **Step 2 : écrire `index.html`, `styles/machine.css` et `src/shader.js`.** On reprend la maquette, avec ces différences :
  - plus de texte en haut à droite ;
  - le `<h1>` « Synthèse vocale » est gravé sur la sérigraphie, à côté du logotype ;
  - le fader de vitesse est placé entre le vumètre et le bouton rotatif.
- [x] **Step 3 : vérifier le succès** avec la même commande. Expected : PASS. Faire aussi une capture plein écran pour comparer à l'œil avec la maquette : `node tests/e2e/screenshot.mjs`, petit script inclus dans cette tâche, qui écrit `/tmp/machine.png`.
- [x] **Step 4 : commit.** `git commit -m "La Machine : structure, style, grain du plastique"`

---

### Task 6 : câbler la machine (parler, lire, MP3, effacer)

**Files :**
- Create : `src/player.js`, `src/main.js`, `tests/e2e/machine.test.mjs`
- Modify : `index.html` (charger `src/main.js`)

**Interfaces :**
- Consumes : toute l'API des tâches 1 à 5.
- Produces (`src/player.js`) : `createPlayer(): Player`.
  - `Player.enqueue(wav: ArrayBuffer): void` : joue à la suite, sans trou ;
  - `Player.stop(): void` ;
  - `Player.onLevel(cb: (level: number) => void)` : `level` entre 0 et 1, calculé par un AnalyserNode à chaque frame ;
  - `Player.onTime(cb: (seconds: number) => void)` : le temps depuis le début de la file ;
  - `Player.onEnded(cb)`.
- Comportement de `src/main.js` :
  - Il tient l'état avec `reduce` et peint la ligne d'état avec `statusLine` à chaque changement.
  - **PARLE :**
    - si le texte n'est pas prononçable, rien ne se lance ;
    - si un audio valide existe déjà, on le rejoue ;
    - sinon, on lance `tts.synthesize`. Chaque morceau reçu par `onChunk` part dans `player.enqueue`. `#reader` remplace `#screen` et le mot courant reçoit la classe `now`, calculée avec `wordTimeline` à partir des durées des morceaux reçus.
  - **Pendant la lecture**, un nouvel appui sur PARLE fait `tts.cancel()` et `player.stop()`.
  - **MP3 :**
    - si l'audio de la clé courante n'existe pas, on le synthétise sans le jouer ;
    - puis `wavToMp3`, puis le téléchargement de `speechsynthe-si-${voice}.mp3` ;
    - `MP3_READY` est dispatché.
  - **EFFACE** dispatche `CLEAR` et vide `#screen`.
  - **Bouton rotatif et fader** dispatchent `VOICE_CHANGED` et `SPEED_CHANGED`. Si une lecture est en cours, elle s'arrête.
  - **Première frappe dans `#screen` :** on appelle `tts.preload(voice)` pour gagner du temps. La progression dispatche `DOWNLOAD_PROGRESS`.
  - **Vumètre :** 12 barres pilotées par `onLevel`.

- [x] **Step 1 : tests navigateur qui échouent** dans `tests/e2e/machine.test.mjs`. Ils tournent avec le profil en cache de la tâche 4.

```js
test("taper, PARLE : lecture puis retour à PRÊT", { timeout: 120_000 }, async () => {
  // type "Bonjour le monde." dans #screen ; clic #key-speak
  // #status-left passe par "▶ LECTURE" ; un .w.now existe pendant la lecture ; puis "PRÊT"
});
test("PARLE pendant la lecture arrête", ...);                 // 2e clic → "PRÊT" en < 1 s
test("écran vide → ÉCRAN VIDE, aucun audio", ...);            // aucune requête vers le worker, aucun téléchargement
test("MP3 téléchargé et valide", { timeout: 120_000 }, ...);  // page._client().send("Browser.setDownloadBehavior") vers un dossier temporaire ; fichier .mp3 de plus de 1 ko, qui commence par une trame MP3 ou ID3 ; statut "✓ MP3 PRÊT"
test("changer de voix après génération → nouvel audio", ...); // MP3 en jessica, bouton rotatif sur tom, statut redevenu "PRÊT" ; le MP3 suivant diffère du premier
test("fader → VITESSE 1.2× dans la ligne d'état", ...);
test("EFFACE vide l'écran", ...);
test("texte de 30 pages : la lecture démarre en moins de 20 s, la page reste réactive", { timeout: 300_000 }, ...);
  // 30 × 40 phrases ; mesurer le délai jusqu'à "▶ LECTURE" ; pendant la synthèse, page.evaluate(() => 1) répond en < 200 ms
test("réseau coupé au premier usage → ERREUR RÉSEAU · RÉESSAIE, puis réessai OK", { timeout: 300_000 }, ...);
  // profil neuf ; requêtes huggingface.co bloquées → statut erreur ; interception retirée ; 2e clic → "▶ LECTURE"
```

Run : `node --test --test-concurrency=1 --test-name-pattern="PARLE|MP3|voix|fader|EFFACE|30 pages|réseau" tests/e2e/`. Expected : FAIL.
- [x] **Step 2 : implémenter `src/player.js` et `src/main.js`.**
- [x] **Step 3 : vérifier le succès.** Run : `npm run test:e2e`. Expected : tout passe, les tâches 4 et 5 comprises.
- [x] **Step 4 : commit.** `git commit -m "Machine câblée : lecture, surlignage, vumètre, MP3, effacement"`

---

### Task 7 : importer un PDF

**Files :**
- Create : `src/pdf.js`, `tests/fixtures/make-fixtures.mjs`, `tests/fixtures/texte.pdf`, `tests/fixtures/scan.pdf`, `tests/e2e/pdf.test.mjs`
- Modify : `src/main.js` (touche PDF)

**Interfaces :**
- Produces (`src/pdf.js`) : `extractPdfText(file: File): Promise<string>`.
  - Il importe `pdfjs-dist` à la demande, au premier clic seulement.
  - Le worker de pdf.js est lancé à travers un blob same-origin qui importe `https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.worker.min.mjs`. pdf.js n'accepte pas directement un worker d'une autre origine.
  - Il concatène le texte des pages, avec un saut de ligne entre deux pages, et renvoie le résultat de `normalizeText`.
- `src/main.js` : clic sur `#key-pdf` → `#pdf-input.click()`. Si le texte extrait n'est pas prononçable, dispatch `PDF_EMPTY` et l'écran ne change pas. Sinon, `TEXT_CHANGED`.

- [x] **Step 1 : fixtures.** `make-fixtures.mjs` utilise puppeteer-core et `page.pdf()` :
  - `texte.pdf` à partir de `<p>Bonjour le monde. Ceci est un PDF.</p>` ;
  - `scan.pdf` à partir d'une page qui ne contient qu'un `<canvas>` rempli de gris, donc sans couche texte.

  Run : `node tests/fixtures/make-fixtures.mjs`. Expected : les deux fichiers existent.
- [x] **Step 2 : tests qui échouent** dans `tests/e2e/pdf.test.mjs` :

```js
test("PDF texte → écran rempli", ...);           // uploadFile(texte.pdf) sur #pdf-input ; #screen contient "Bonjour le monde. Ceci est un PDF."
test("PDF scanné → PDF SANS TEXTE, écran inchangé", ...);  // #screen valait "Gardé." avant ; il vaut toujours "Gardé."
```

Run : `node --test --test-concurrency=1 --test-name-pattern=PDF tests/e2e/`. Expected : FAIL.
- [x] **Step 3 : implémenter `src/pdf.js` et câbler la touche.**
- [x] **Step 4 : vérifier le succès** avec la même commande. Expected : PASS.
- [x] **Step 5 : commit.** `git commit -m "Import PDF"`

---

### Task 8 : téléphone, clavier, mouvement réduit

**Files :**
- Modify : `styles/machine.css`, `index.html` si nécessaire
- Create : `tests/e2e/a11y.test.mjs`

- [x] **Step 1 : tests qui échouent** :

```js
test("390×844 : pas de défilement horizontal, commandes ≥ 44 px", ...);
  // document.documentElement.scrollWidth <= 390 ; chaque bouton, radio et le fader mesurent au moins 44×44
  // disposition : écran, puis touches en grille 2×2, puis vumètre + bouton rotatif + fader
test("tout au clavier", ...);
  // Tab dans l'ordre (ajusté le 2026-10-25) : #screen → #key-pdf → #key-clear → radiogroup → #speed → #key-speak → #key-mp3
  // Flèche droite sur le radiogroup → Tom sélectionné, ligne d'état "TOM"
  // Entrée sur #key-speak lance la lecture
test("prefers-reduced-motion : grain figé, curseur fixe", ...);
  // page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }])
  // l'animation-name du curseur vaut "none" ; deux captures de #plastic à 1 s d'écart sont identiques
```

Run : `node --test --test-concurrency=1 --test-name-pattern="390|clavier|reduced" tests/e2e/`. Expected : FAIL.
- [x] **Step 2 : implémenter.** Media queries pour la mise en page portrait, focus visible sur chaque commande, gestion des flèches dans le radiogroup, `reducedMotion` transmis à `mountPlastic`.
- [x] **Step 3 : vérifier le succès** avec la même commande. Expected : PASS.
- [x] **Step 4 : commit.** `git commit -m "Téléphone, clavier, mouvement réduit"`

---

### Task 9 : SEO (FAQ, données structurées, crédits, partage)

**Files :**
- Modify : `index.html`, `styles/machine.css`, `README.md`
- Create : `robots.txt`, `sitemap.xml`, `assets/og.png`, `tests/e2e/seo.test.mjs`

**Contenu figé :**
- **FAQ sous la machine, 8 questions**, dans cet ordre, rédigées comme les recherches Google :
  1. « La synthèse vocale est-elle vraiment gratuite ? »
  2. « Mon texte est-il envoyé sur Internet ? »
  3. « Comment transformer un texte en audio MP3 ? »
  4. « Comment lire un PDF à voix haute ? »
  5. « Quelles voix françaises sont disponibles ? »
  6. « Comment changer la vitesse de lecture ? »
  7. « Pourquoi le premier chargement prend-il du temps ? »
  8. « Puis-je utiliser l'audio dans une vidéo TikTok ou YouTube ? »

  Les réponses font 2 à 4 phrases, au tutoiement, et sont factuelles :
  - gratuit, sans compte ;
  - calcul local ;
  - Jessica et Tom ;
  - vitesse de 0,7× à 1,5× ;
  - environ 60 Mo par voix au premier usage, puis en cache ;
  - pour la question 8 : oui, et on demande de créditer « Voix : Piper » en rappelant les licences CC BY-SA 4.0 et AGPLv3.
- **JSON-LD `FAQPage`** reprenant les 8 questions et réponses.
- **Balises :** `<meta name="description">` (environ 150 caractères, avec « synthèse vocale gratuite », « français », « MP3 »), `<link rel="canonical" href="https://speechsynthe.si/">`, `og:title`, `og:description`, `og:image` = `https://speechsynthe.si/assets/og.png`, `og:url`, `twitter:card=summary_large_image`.
- **Crédits** en pied de page, voir Global Constraints.
- `robots.txt` autorise tout et pointe vers le sitemap. `sitemap.xml` ne contient qu'une seule URL.
- `assets/og.png` : capture 1200×630 de la machine avec un texte d'exemple, faite par un script puppeteer inclus dans la tâche (`tests/e2e/og-image.mjs`).

- [x] **Step 1 : tests qui échouent** dans `tests/e2e/seo.test.mjs` :

```js
test("FAQ hors du premier écran", ...);           // le haut de la section FAQ est sous 900 px dans une fenêtre 1340×900
test("JSON-LD FAQPage valide, 8 questions identiques au HTML", ...);
test("meta, canonical, og:image accessible", ...); // GET /assets/og.png → 200, image/png
test("crédits présents", ...);                    // le footer contient "CC BY-SA 4.0", "AGPLv3", "Piper" et le lien GitHub
```

Run : `node --test --test-concurrency=1 --test-name-pattern="FAQ|JSON-LD|meta|crédits" tests/e2e/`. Expected : FAIL.
- [x] **Step 2 : implémenter**, et mettre à jour `README.md` : statut, but, dépendances, dernière touche, commandes de test.
- [x] **Step 3 : vérifier le succès.** Run : `npm test && npm run test:e2e`. Expected : tout passe.
- [x] **Step 4 : commit.** `git commit -m "SEO : FAQ, données structurées, crédits, image de partage"`

---

### Task 10 : mise en ligne, puis statistiques (dépend de Jonas)

**Files :**
- Modify : `index.html` (compteur, une ligne)

- [ ] **Step 1 : publier.** `git push origin main`. Puis vérifier `curl -s https://speechsynthe.si/ | grep -c "Synthèse vocale gratuite en français"`. Expected : `1` après le déploiement de GitHub Pages, environ 1 à 2 minutes.
- [ ] **Step 2 : test de bout en bout en production.** `BASE_URL=https://speechsynthe.si node --test --test-concurrency=1 --test-name-pattern="premier écran|taper, PARLE" tests/e2e/`. Le harnais doit utiliser `BASE_URL` s'il est défini, à la place du serveur local. Expected : PASS.
- [ ] **Step 3 : Jonas écoute** la vraie page sur ordinateur et sur téléphone, et valide.
- [ ] **Step 4 : demander à Jonas** :
  - quel compteur il choisit : GoatCounter (vérifier ses conditions d'usage commercial) ou Cloudflare Web Analytics ;
  - l'identifiant de ce compteur ;
  - l'enregistrement TXT fourni par Google Search Console, à ajouter dans la zone DNS OVH, comme on l'a fait pour les enregistrements A.
- [ ] **Step 5 : ajouter le script du compteur** (une seule balise `<script>`, sans cookie). Test : `tests/e2e/page.test.mjs` gagne `test("aucun cookie, le compteur ne reçoit jamais le texte")`. On tape un texte reconnaissable, on clique sur PARLE, on vérifie `page.cookies()` vide, et aucune requête sortante (URL ou corps) ne contient ce texte. Run : `npm run test:e2e`. Expected : PASS. Commit et push.
