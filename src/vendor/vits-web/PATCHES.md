# vits-web — copie embarquée

Source : `npm pack @diffusionstudio/vits-web@1.0.3`, dossier `dist/`.
Licence : MIT (champ `license` du `package.json` ; le dépôt amont n'a pas de fichier LICENSE, le texte MIT standard est dans `LICENSE`).

| Fichier | SHA-256 de l'original |
|---|---|
| `vits-web.js` | `da2851c370ad6606f627c26db26490ebb0a455612866cd3b9a707778f65273cb` |
| `piper-DeOu3H9E.js` | `e2701cb8c73580ab395a67ad036ea1a4a9e50500c33c8b8499d159c3638451f3` (non modifié) |

## Modifications de `vits-web.js`

1. **Vitesse.** Dans `predict` (`async function N(e, m)`, `e` = la config) :

   ```diff
   - g = i.inference.length_scale
   + g = e.lengthScale ?? i.inference.length_scale
   ```

   `predict({ text, voiceId, lengthScale })` règle la vitesse (`length_scale = 1 / vitesse`). Sans `lengthScale`, la valeur du modèle reste utilisée.

2. **onnxruntime-web par URL complète.**

   ```diff
   - import("onnxruntime-web")
   + import("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/wasm/+esm")
   ```

   Le moteur tourne dans un worker module (`src/tts-worker.js`), et les workers ne lisent pas les import maps. La version 1.18.0 est celle déclarée en dépendance par vits-web 1.0.3, et `wasmPaths` pointe déjà vers cdnjs 1.18.0.
   Depuis le 2026-10-26, le bundle **WASM seul** (`/wasm/+esm`, 164 Ko au lieu de 564 Ko) : le moteur n'utilise que le backend WASM, et le bundle complet embarquait protobufjs 7.2.5, visé par deux avis de sécurité (audit S06).

3. **Une session ONNX pour la voix active, libérée au changement de voix.**

   L'amont créait une `InferenceSession` par morceau sans appeler `release()`.
   Le 2026-10-25, la synthèse EPHEC de 9 pages (363 morceaux extraits par PDF.js)
   a reproduit un arrêt du moteur au 59e morceau, avec `Aborted(). Build with
   -sASSERTIONS for more info.` ; le renderer dépassait déjà 960 Mo après 40
   morceaux. `voiceSession()` garde désormais un seul modèle et sa configuration
   pour la voix active. La session précédente est libérée avant de charger une
   autre voix ; une session en échec est également libérée. Les tenseurs d'entrée
   et de sortie sont disposés après chaque inférence.

   Référence API : https://onnxruntime.ai/docs/api/js/interfaces/InferenceSession.html#release

4. **Réutilisation bornée du phonémiseur Piper.**

   Le module WASM de phonémisation est réutilisé dans la file sérialisée du worker,
   avec un collecteur de sortie courant, puis renouvelé après 128 appels pour
   borner ses allocations internes. Un probe navigateur a vérifié 100 appels
   successifs sur une seule instance : codes de sortie 0, 100 résultats et mêmes
   phonèmes pour les mêmes textes. Cela évite de réinitialiser le module pour
   chacune des 363 lignes de la synthèse PDF. Les erreurs de `callMain` sont
   propagées directement ; le module est recréé après un échec.

## Défauts connus de l'amont, contournés dans `src/tts-worker.js` (pas ici)

- `fetch` n'est jamais vérifié (`res.ok`) : une page d'erreur HTTP serait mise en cache OPFS comme modèle. Le worker enveloppe `fetch` et lève une erreur réseau sur toute réponse non OK.
- `download` n'attend pas la fin de l'écriture OPFS. Un fichier vide existe dès `getFileHandle({ create: true })` et `predict` le prendrait pour un modèle en cache. Le worker attend que les fichiers soient écrits, et supprime ceux de taille 0 avant chaque tâche (écriture interrompue par `cancel()`, onglet fermé…).
- L'amont initialisait piper dans `new Promise(async …)` : la copie adaptée utilise désormais un appel async direct et le collecteur décrit ci-dessus. Le worker conserve ses gardes `unhandledrejection` et `error` pour une erreur issue du runtime WASM.
- `download` retélécharge le modèle même s'il est déjà dans OPFS (et HF répond `no-store`). Le worker saute `download` quand les deux fichiers sont déjà en cache et non vides.
- `import(onnxruntime-web)` raté (hors ligne) reste en échec dans la table des modules du worker. `src/tts.js` remplace le worker après toute erreur, réseau ou runtime ; une erreur runtime autorise une seule reprise du morceau courant dans un worker neuf.

4. **Voix figées et vérifiées (audit S07, 2026-10-26).**

   - `u` pointe sur la révision `840e38a7e26d813bd6221b78cfbaefa3585b3f71` du dépôt `diffusionstudio/piper-voices` au lieu de la branche mutable `resolve/main`.
   - `VOICE_SHA256` contient l'empreinte SHA-256 des 8 fichiers des 4 voix du site (modèles : empreintes LFS publiées par HuggingFace ; configurations : calculées, empreinte git recoupée avec l'API). `S` refuse un téléchargement dont l'empreinte diffère, avant toute mise en cache ; `f` vérifie aussi un fichier déjà en cache et le remplace s'il est abîmé. Une voix absente de la liste est refusée.
   - Pour ajouter ou mettre à jour une voix : nouvelle révision, nouvelles empreintes, puis `tests/e2e/tts.test.mjs` (« intégrité des voix »).
