# speech-synthesis

- **Statut** : actif — V1 de l'outil « La Machine »
- **But** : outil de synthèse vocale française dans le navigateur — voix Jessica ou Tom, vitesse réglable, écoute en direct, téléchargement MP3 et extraction de PDF.
- **Site** : https://speechsynthe.si (GitHub Pages, branche `main`)
- **Publication** : V1 en ligne le 2026-10-25 ; lecture et premier écran vérifiés sur le domaine public.
- **Dépendances** : ES modules JavaScript, Web Audio, vits-web, onnxruntime-web, Paper shaders, lamejs, PDF.js, tests Node et Puppeteer.
- **Données** : texte, PDF et audio sont traités dans le navigateur ; seuls les modèles et bibliothèques sont téléchargés.
- **Code vocal** : [`src/vendor/vits-web/PATCHES.md`](src/vendor/vits-web/PATCHES.md). Jessica (UPMC) est sous CC BY-SA 4.0 ; Tom est sous AGPLv3. Le dépôt reste public.
- **Tests** : `npm test` ; `npm run test:e2e` (Google Chrome installé et connexion Internet pour les bibliothèques et modèles).
- **V2 (navigation + glisser-déposer)** : codée sur `feat/la-machine`, tests verts, pas encore publiée — barre de lecture (±30 s, position, chapitres), panneau COMMANDES (sauts par phrases/secondes/chapitres, commande écrite, micro local facultatif), PARLE = pause/reprise, import PDF par glisser-déposer. Commandes : `docs/voice-commands.md`. Spec : `docs/superpowers/specs/2026-10-24-la-machine-design.md`.
- **Symboles dits à voix haute** : `src/spoken.js` réécrit le texte envoyé à la voix (« entre parenthèses », « entre guillemets », « flèche vers la droite », & → et, 2025/2026, 1er/1ère) ; l'écran garde le texte d'origine. Tableaux PDF aplatis : à traiter plus tard.
- **Dernière touche** : 2026-10-25
