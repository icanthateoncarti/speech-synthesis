# Import et export — 2026-10-27

## Nettoyage avant écoute

Après l’import d’un PDF ou PPTX, le bouton **NETTOYER** n’apparaît que si des lignes courtes se répètent au bord d’au moins la moitié des pages/diapositives (au minimum deux). Les numéros de page sont regroupés ; la liste s’affiche au survol du bouton. Aucune suppression sans clic : un clic retire toutes ces répétitions (le bouton devient **NETTOYÉ**), un second les remet.

Les marqueurs numérotés « Chapitre », « Partie », « Section », etc. restent protégés, ainsi que les cellules des tableaux PDF reconnus. Les passages choisis dans PAGES se combinent au nettoyage. La lecture et le MP3 utilisent le texte obtenu ; le fichier original n’est jamais modifié ni envoyé à un serveur.

Limites : ce détecteur repère les répétitions, pas tous les passages inutiles. Un titre isolé ou un en-tête qui change à chaque page peut ne pas être proposé. Dans les PPTX, les premières et dernières lignes extraites servent de candidates. Les PDF scannés restent sans OCR.

## Tableaux PDF

Les tableaux avec une structure PDF fiable (Table/TR/TH/TD) sont lus ligne par ligne. Quand les en-têtes et les colonnes sont non ambigus, leurs libellés sont rappelés avant chaque cellule. Les tableaux non balisés ou ambigus gardent l’extraction habituelle. Les positions du texte original restent associées à la vue PAGES.

## Préparation et export MP3

L’écran distingue le chargement initial de la voix, la préparation audio (part du texte synthétisée, pas une estimation du temps restant), puis l’encodage MP3. L’encodage fonctionne dans un worker annulable ; le WAV et le MP3 restent réutilisables sans nouvelle synthèse.

Mesure locale Chrome, signal synthétique de 10 minutes, 22 050 Hz, MP3 mono 96 kb/s : 4 815 ms avec l’ancien découpage sur le fil principal, 2 728 ms dans le worker ; octets identiques. Cette mesure concerne uniquement l’encodage, pas la synthèse vocale ni les performances d’un téléphone. La génération d’un long cours reste dépendante de l’appareil.

Tests dédiés : `tests/unit/document-cleanup.test.js`, `tests/unit/pdf-tables.test.js`, `tests/e2e/cleanup.test.mjs`, `tests/e2e/pptx.test.mjs`, `tests/e2e/pdf-tables.test.mjs`, `tests/e2e/mp3-export.test.mjs`.

## Préparation vocale et réutilisation des passages — 2026-10-27

Le préchargement prépare maintenant aussi la session ONNX et le phonémiseur, en parallèle. Le clic PARLE/MP3 n'attend plus leur initialisation si cette préparation est terminée. Les modèles restent vérifiés par SHA-256 et les voix/qualité inchangées.

Les passages déjà calculés sont réutilisés lors d'une correction, d'un nettoyage ou d'une nouvelle sélection PAGES. La clé comprend le texte prononcé, la voix réelle (française/anglaise) et la vitesse. Les silences des titres sont ajoutés après récupération, donc leur mise en forme peut changer sans recalculer la voix.

Ce cache est limité à **8 Mio et 128 passages**, uniquement en RAM. Il est vidé par EFFACE ou l'import d'un nouveau document ; aucun texte ni audio supplémentaire n'est enregistré sur disque ou envoyé à un service. Les passages les moins récemment utilisés sont évincés. Le fil de l'interface reprend régulièrement la main pendant les résultats en cache pour permettre l'annulation.

### Mesure reproductible

`node scripts/benchmark-tts.mjs` mesure vingt phrases originales, la correction d'une phrase, puis une répétition. `BASELINE=2dd407f node scripts/benchmark-tts.mjs` sert le moteur précédent uniquement au navigateur de mesure, sans modifier le checkout. Profil Chrome réservé dans `/tmp/speechsynthesi-tts-benchmark` ; aucun vrai document personnel.

Un essai local sur ce Mac, environ 90 secondes d'audio :

| Scénario | Avant | Après | Inférences après |
|---|---:|---:|---:|
| Préparation du document après préchargement | 12,53 s | 11,02 s | 20 |
| Une phrase corrigée | 10,68 s | 0,40 s | 1 |
| Même texte redemandé au moteur | 10,46 s | 0,001 s | 0 |

Le préchargement complet passe de 4,89 à 5,61 s dans cet essai ; une partie du travail est anticipée. **Le gain principal concerne les passages réutilisés**, pas la première synthèse d'un long cours. L'application réutilisait déjà un document entier inchangé : la nouveauté couvre aussi les modifications partielles. Les durées de la voix sont légèrement aléatoires ; ce sont des mesures locales, pas un engagement de vitesse ni une validation sur iPhone/Android physique.

Le profilage attribue environ 0,5 s par phrase au calcul ONNX et 2–5 ms à la phonémisation après initialisation. Regrouper des phrases n'apporte pas de gain suffisant par seconde d'audio pour justifier un premier passage plus lent et une synchronisation moins précise. Les tests du moteur conservent 140 **phrases différentes** afin que le cache ne masque pas les problèmes de mémoire du WASM.
