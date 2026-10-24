# vits-web — copie embarquée

Source : `npm pack @diffusionstudio/vits-web@1.0.3`, dossier `dist/`.
Licence : MIT (champ `license` du `package.json` ; le dépôt amont n'a pas de fichier LICENSE, le texte MIT standard est dans `LICENSE`).

| Fichier | SHA-256 de l'original |
|---|---|
| `vits-web.js` | `da2851c370ad6606f627c26db26490ebb0a455612866cd3b9a707778f65273cb` |
| `piper-DeOu3H9E.js` | `e2701cb8c73580ab395a67ad036ea1a4a9e50500c33c8b8499d159c3638451f3` (non modifié) |

## Modifications de `vits-web.js` (deux, rien d'autre)

1. **Vitesse.** Dans `predict` (`async function N(e, m)`, `e` = la config) :

   ```diff
   - g = i.inference.length_scale
   + g = e.lengthScale ?? i.inference.length_scale
   ```

   `predict({ text, voiceId, lengthScale })` règle la vitesse (`length_scale = 1 / vitesse`). Sans `lengthScale`, la valeur du modèle reste utilisée.

2. **onnxruntime-web par URL complète.**

   ```diff
   - import("onnxruntime-web")
   + import("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/+esm")
   ```

   Le moteur tourne dans un worker module (`src/tts-worker.js`), et les workers ne lisent pas les import maps. La version 1.18.0 est celle déclarée en dépendance par vits-web 1.0.3, et `wasmPaths` pointe déjà vers cdnjs 1.18.0.

## Défauts connus de l'amont, contournés dans `src/tts-worker.js` (pas ici)

- `fetch` n'est jamais vérifié (`res.ok`) : une page d'erreur HTTP serait mise en cache OPFS comme modèle. Le worker enveloppe `fetch` et lève une erreur réseau sur toute réponse non OK.
- `download` n'attend pas la fin de l'écriture OPFS. Un fichier vide existe dès `getFileHandle({ create: true })` et `predict` le prendrait pour un modèle en cache. Le worker attend que les fichiers soient écrits, et supprime ceux de taille 0 avant chaque tâche (écriture interrompue par `cancel()`, onglet fermé…).
- L'initialisation de piper se fait dans `new Promise(async …)` : une erreur à cet endroit ne rejette jamais `predict`. Le worker capte `unhandledrejection` et `error` pour faire échouer la tâche au lieu de la laisser bloquée.
