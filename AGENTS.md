# Règles pour les agents (Claude, Codex, OpenCode)

Site statique speechsynthe.si, publié par GitHub Pages depuis la branche `main`.

## Publier

1. `npm run build` (empreinte de version, pages générées, sitemap, fichiers pour les IA). Ne jamais éditer à la main les `*/index.html` ni les `*.md` générés.
2. `npm test`, puis les tests navigateur concernés (`npm run test:e2e`, un fichier à la fois si besoin).
3. Commit, puis `git push origin feat/la-machine:main`.
4. Renvoyer les URL modifiées à IndexNow (voir README).

## Annoncer une mise à jour majeure (obligatoire)

Jonas poste un tweet pour chaque mise à jour **majeure** : une nouveauté qui change la façon dont les gens utilisent l'outil (nouvelle fonction, nouveau format importé, nouvelle commande, comportement visible modifié). Pas pour un correctif, une optimisation, un changement de texte, de SEO, de sécurité ou d'outillage.

Dans le **même commit** que la mise à jour, ajoute `annonces/AAAA-MM-JJ-sujet.md` (date du jour, sujet en kebab-case) contenant **uniquement le tweet exact**, en anglais :
- 280 caractères au plus, comptés comme X (un lien = 23) ; `npm test` le vérifie ;
- il nomme speechsynthe.si, dit ce qui change pour l'utilisateur, en phrases simples ;
- seulement des faits vrais et vérifiés, sans superlatif ni promesse ;
- une annonce par mise à jour majeure : trois mises à jour dans la journée = trois fichiers.

Exemple : `annonces/2026-10-27-surlignage-pdf.md`.

Une fois le site en ligne, `scripts/annonces-telegram.sh` (cron, toutes les 5 minutes sur le Mac de Jonas) lui envoie le tweet sur Telegram. Ne modifie jamais une annonce déjà publiée : elle a déjà été envoyée.

## Toujours

- Aucun secret dans le dépôt (il est public) ; `docs/security/` reste hors du dépôt.
- La CSP est générée par `scripts/stamp-version.mjs` : un nouveau domaine de script doit y être autorisé.
- Ne pas toucher aux fichiers de vérification à la racine (`904e353b….txt` pour IndexNow, `google47078ed0a8b5dade.html`).
