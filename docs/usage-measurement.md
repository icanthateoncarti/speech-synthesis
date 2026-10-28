# Mesure d'usage

But : savoir si les visiteurs arrivent à utiliser la machine, sans rien collecter de leurs cours.

- **Visites** : Cloudflare Web Analytics (sans cookie), déjà en place.
- **Usage** : `src/usage.js` envoie au worker de partage (`POST /events`) un seul nom d'événement, en production uniquement. Le worker n'accepte que la liste fermée `EVENT` (`services/sharing/worker.js`) et incrémente un compteur par jour et par nom, gardé 400 jours. Ni texte, ni nom ou taille de fichier, ni identifiant ; l'empreinte IP du jour sert seulement aux quotas (60 événements/heure par visiteur, 20 000/jour au total).

| Événement | Quand |
| --- | --- |
| `import-pdf`, `import-pdf-scan`, `import-pptx` | un document importé avec du texte lisible |
| `import-error-pdf`, `import-error-pptx` | import raté (vide, protégé, trop lourd, illisible) |
| `listen-text-fr/en`, `listen-document-fr/en` | la première lecture d'une visite (une fois par chargement de page) |
| `export-mp3-fr/en`, `export-error` | MP3 téléchargé, ou export raté |

Lire les chiffres : `npm run stats` (14 jours) ou `npm run stats -- 30`, depuis le dépôt principal. Le script lit `logs/.cloudflare-private/stats-token` et la connexion Wrangler du même dossier, tous deux ignorés par Git. `GET /stats` exige ce jeton (secret `STATS_TOKEN` du worker).

Search Console n'a pas d'accès automatique : capture d'écran de Jonas.
