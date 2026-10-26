# Découverte IA de speechsynthe.si

Les fichiers sont produits par `npm run build`, sans dépendance supplémentaire.
Le contenu visible et le fonctionnement de la radio restent identiques.

## Couverture

| Page HTML | Source éditoriale | Markdown | Dans llms-full.txt |
| --- | --- | --- | --- |
| `/` | `HOME`, scripts/pages.mjs | `/index.md` | Oui |
| `/pdf-en-audio/` | `PAGES`, scripts/pages.mjs | `/pdf-en-audio.md` | Oui |
| `/text-to-speech/` | `PAGES`, scripts/pages.mjs | `/text-to-speech.md` | Oui |
| `/voix-off/` | `PAGES`, scripts/pages.mjs | `/voix-off.md` | Oui |
| `/message-repondeur/` | `PAGES`, scripts/pages.mjs | `/message-repondeur.md` | Oui |

Chaque version contient le titre, la description, les exemples éventuels, le guide,
la FAQ et des liens HTML absolus vers les autres usages. Le pied de page et les
contrôles interactifs ne sont pas recopiés. Les dates correspondent à la génération.
Les textes saisis, PDF/PPTX importés, sélections et audios des utilisateurs ne sont
jamais une entrée du build.

## Sources et génération

- `scripts/site.mjs` : identité publique, coordonnées de contact et politique des robots.
- `scripts/pages.mjs` : accueil et pages par usage. `index.html` reste le gabarit de
  la radio, mais ses textes éditoriaux sont désormais générés depuis `HOME`.
- `scripts/ai-pages.mjs` : registre des routes et rendu Markdown ; génère aussi
  `llms.txt`, `llms-full.txt`, `ai.txt`, `robots.txt` et `markdown-catalog.json`.
- `scripts/build-pages.mjs` : génère les pages HTML, leurs métadonnées IA et tous
  les fichiers précédents. Le sitemap contient uniquement les URL HTML.

Pour ajouter une page du même format, ajouter une entrée dans `PAGES`, puis lancer
le build : HTML, navigation, Markdown, catalogue, sitemap et recueils sont générés.
Ne pas modifier les `.md` générés ni les pages HTML par usage à la main.

## Robots

Décision de Jonas du 2026-10-26 : GPTBot, ClaudeBot, Google-Extended,
Applebot-Extended et CCBot autorisés ; Bytespider bloqué. Les six robots de recherche
et de consultation cités dans TODO.md restent autorisés. Les exclusions techniques
sont répétées dans chaque groupe autorisé, car un groupe spécifique ne reprend pas
automatiquement les règles du groupe `*`.

Le registre ne contient que les cinq pages éditoriales. Le fichier de vérification
Google et les deux pages HTML de test sont exclus explicitement, avec leur raison
dans `tests/unit/ai-pages.test.js`. `robots.txt` exprime des préférences d’exploration,
pas une protection des fichiers : aucune donnée privée ne doit être publiée.

## Adaptations à GitHub Pages

- Pas de négociation `Accept: text/markdown`, de middleware ou de `/api/md/*` :
  utiliser les `.md` statiques et `/markdown-catalog.json`.
- Les signaux de découverte sont dans le `<head>` : `alternate`, `describedby`
  et `ai-summary`. Les en-têtes personnalisés `X-Markdown-Tokens`,
  `X-Robots-Tag`, `Content-Location`, `Link` et `Vary: Accept` ne sont pas ajoutés.
- Les types MIME, le cache, CORS et `Last-Modified` sont ceux de l’hébergeur.
  Le serveur de test sert les `.md` en `text/plain` ; GitHub Pages sert actuellement
  les `.md` en `text/markdown; charset=utf-8` (contrôlé sur README.md).
- L’absence de `X-Robots-Tag: noindex` signifie qu’on ne peut pas garantir la
  non-indexation des `.md`. Ils restent hors du sitemap et indiquent leur URL HTML
  canonique dans le contenu ; cette indication textuelle n’est pas un en-tête canonique.
- Une URL inconnue renvoie un 404 de l’hébergeur, pas une page Markdown personnalisée.
- Pas de pages dynamiques, d’API, de serveur MCP ni de fichier de découverte MCP.
- Les nœuds WebSite, WebApplication et FAQPage existants sont synchronisés,
  sans doublons. Aucun nœud Organization n’est inventé pour ce projet personnel.
- Les fichiers de vérification Google/IndexNow et la CSP sont conservés.

## Formats de référence

- [llmstxt.org](https://llmstxt.org/) : titre, description, listes de liens Markdown
  et découverte par `alternate` / `describedby`.
- [Spécification ai.txt](https://www.ai-visibility.org.uk/specifications/ai-txt/) :
  identité, permissions, restrictions, attribution, périmètre et contact. Les sections
  utilisent les titres Markdown du format publié, plutôt que les sections entre
  crochets de l’ancien prompt. Aucune promesse de classement ou de citation par les
  moteurs n’est liée à ces fichiers.

## Vérifications

`npm test` vérifie les sorties du build, la couverture de toutes les pages HTML,
la cohérence des sources, l’idempotence et les groupes de robots.

`node --test --test-concurrency=1 tests/e2e/ai-pages.test.mjs tests/e2e/seo.test.mjs tests/e2e/usages.test.mjs tests/e2e/page.test.mjs tests/e2e/csp.test.mjs`
vérifie les liens de découverte, les réponses HTTP GET/HEAD, la parité avec le HTML,
les URL inconnues, l’exclusion du texte saisi, le premier écran et une vraie lecture
avec la CSP. Au 2026-10-26 : 68 tests unitaires et 19 tests navigateur réussis.

Après publication, contrôler les URL sur le domaine public et soumettre les cinq
URL HTML à IndexNow selon README.md.
