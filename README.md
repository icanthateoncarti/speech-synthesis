# speech-synthesis

- **Statut** : V1 implémentée localement, prête pour relecture et mise en ligne
- **But** : outil de synthèse vocale française dans le navigateur — voix Jessica ou Tom, vitesse réglable, écoute en direct, téléchargement MP3 et extraction de PDF.
- **Site** : https://speechsynthe.si (GitHub Pages ; publication de la V1 en attente)
- **Dépendances** : ES modules JavaScript, Web Audio, vits-web, onnxruntime-web, Paper shaders, lamejs, PDF.js, tests Node et Puppeteer.
- **Données** : texte, PDF et audio sont traités dans le navigateur ; seuls les modèles et bibliothèques sont téléchargés.
- **Code vocal** : [`src/vendor/vits-web/PATCHES.md`](src/vendor/vits-web/PATCHES.md). Jessica (UPMC) est sous CC BY-SA 4.0 ; Tom est sous AGPLv3. Le dépôt reste public.
- **Tests** : `npm test` ; `npm run test:e2e` (Google Chrome installé et connexion Internet pour les bibliothèques et modèles).
- **V2 consignée** : navigation dans la lecture web par durée, phrase et chapitre ; commandes vocales facultatives. Voir `docs/superpowers/specs/2026-10-24-la-machine-design.md`.
- **Dernière touche** : 2026-10-25
