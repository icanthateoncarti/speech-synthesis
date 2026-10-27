# Import et export — 2026-10-27

## Nettoyage avant écoute

Après l’import d’un PDF ou PPTX, **NETTOYER** propose les lignes courtes répétées au bord d’au moins la moitié des pages/diapositives (au minimum deux). Les numéros de page sont regroupés. Aucune suppression avant validation : les cases permettent de choisir, et **Tout rétablir** annule le nettoyage.

Les marqueurs numérotés « Chapitre », « Partie », « Section », etc. restent protégés, ainsi que les cellules des tableaux PDF reconnus. Les passages choisis dans PAGES se combinent au nettoyage. La lecture et le MP3 utilisent le texte obtenu ; le fichier original n’est jamais modifié ni envoyé à un serveur.

Limites : ce détecteur repère les répétitions, pas tous les passages inutiles. Un titre isolé ou un en-tête qui change à chaque page peut ne pas être proposé. Dans les PPTX, les premières et dernières lignes extraites servent de candidates. Les PDF scannés restent sans OCR.

## Tableaux PDF

Les tableaux avec une structure PDF fiable (Table/TR/TH/TD) sont lus ligne par ligne. Quand les en-têtes et les colonnes sont non ambigus, leurs libellés sont rappelés avant chaque cellule. Les tableaux non balisés ou ambigus gardent l’extraction habituelle. Les positions du texte original restent associées à la vue PAGES.

## Préparation et export MP3

L’écran distingue le chargement initial de la voix, la préparation audio (part du texte synthétisée, pas une estimation du temps restant), puis l’encodage MP3. L’encodage fonctionne dans un worker annulable ; le WAV et le MP3 restent réutilisables sans nouvelle synthèse.

Mesure locale Chrome, signal synthétique de 10 minutes, 22 050 Hz, MP3 mono 96 kb/s : 4 815 ms avec l’ancien découpage sur le fil principal, 2 728 ms dans le worker ; octets identiques. Cette mesure concerne uniquement l’encodage, pas la synthèse vocale ni les performances d’un téléphone. La génération d’un long cours reste dépendante de l’appareil.

Tests dédiés : `tests/unit/document-cleanup.test.js`, `tests/unit/pdf-tables.test.js`, `tests/e2e/cleanup.test.mjs`, `tests/e2e/pptx.test.mjs`, `tests/e2e/pdf-tables.test.mjs`, `tests/e2e/mp3-export.test.mjs`.
