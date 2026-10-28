# Bibliothèque, PDF difficiles et partage

Demande de Jonas du 2026-10-28 : réaliser les trois chantiers en autonomie.

## Fonctionnement

- Bibliothèque locale IndexedDB : enregistrer/ouvrir/supprimer un cours, conserver texte, chapitres, réglages et position. Audio par passages, reprise après interruption, plafond de stockage, rendu et encodage sans copie PCM du cours entier. Application installable et cache hors connexion, sans promettre une synthèse en arrière-plan lorsque le téléphone suspend l'onglet.
- Import PDF : OCR local facultatif pour les scans, ordre à deux colonnes proposé manuellement dans l’aperçu, tableaux conservés, proposition de nettoyage des en-têtes variables, aperçu éditable avant validation. Annulation et budgets de mémoire/pages.
- Partage : instantané du texte retenu, chapitres, réglages et position, chiffré dans le navigateur. Lien court, expiration de sept jours et suppression par le créateur. Le PDF original et l'audio ne sont pas envoyés. Clé de lecture dans le fragment du lien, jamais dans une requête au stockage. Limites et contrôles d'abus côté service.

## Validation

Tests de fermeture/reprise, mode hors connexion, quota et annulation ; PDF synthétiques scannés/à colonnes/tableaux et conservation des positions ; aller-retour chiffré, entrées hostiles, expiration, suppression et limitations d'abus. Vérification navigateur mobile et contrôles publics après déploiement.

## Contexte

GitHub Pages héberge le site statique. Cloudflare est le compte existant pour les statistiques ; le service de partage est publié sur `https://speechsynthesi-sharing.speech-synthesis.workers.dev`. La connexion Wrangler a été autorisée pour cette livraison.

Le fichier `tests/e2e/harness.mjs` contient un changement préexistant d'un autre outil : ne pas l'inclure dans ce travail. Les profils de test utilisés ici restent sous `tests/e2e/.chrome-profile/` pour préserver les fichiers temporaires selon les consignes du poste.


## Bibliothèque et téléphone

`MES COURS` enregistre explicitement le cours courant. Après cet enregistrement, le texte, les réglages et la position sont sauvegardés pendant la lecture ; les passages vocaux terminés sont conservés séparément. Une reprise n’a pas à recalculer ces passages. Les modifications réutilisent uniquement les passages dont le texte prononcé, la voix et la vitesse correspondent.

Limites : 20 cours, 200 Mio d’audio par origine/navigateur. Les modèles des voix et le cache de l’application occupent de la place en plus. Les échecs de stockage ne bloquent pas l’écoute. Supprimer un cours libère ses passages ; une sauvegarde tardive ne recrée pas un cours supprimé dans un autre onglet. `EFFACE` détache le cours et conserve la copie déjà enregistrée dans la bibliothèque.

Le service worker conserve l’application et les ressources déjà téléchargées. Hors connexion, un cours dont les passages audio ont été préparés reste lisible. Il faut une première visite en ligne et enregistrer le cours. Changer de voix ou ajouter du texte peut nécessiter de télécharger une voix ou une ressource absente. L’OS peut suspendre l’onglet et le navigateur peut évincer ses données : aucune promesse de synthèse continue écran éteint ou de sauvegarde permanente. Le MP3 reste la copie portable.

L’audio complet est assemblé en Blob, le lecteur ne transforme en Float32 qu’une fenêtre de lecture et l’export MP3 lit le PCM par blocs. Le texte surligné ne crée pas des centaines de milliers d’éléments DOM : la fenêtre de lecture est bornée. Aucun changement de débit ou de qualité MP3.

## PDF et OCR

Un PDF contenant peu de texte et des images propose l’aperçu. `RELIRE LE TEXTE` permet aussi de rouvrir l’aperçu après import. Le mode natif reste celui par défaut ; deux colonnes ou lignes de tableau sont des choix explicites. Les tableaux PDF balisés gardent leur interprétation sémantique. Aucun résumé, suppression ou réécriture par une IA.

La reconnaissance des scans utilise Tesseract.js 6.0.1 et son moteur 6.0.0, en français ou en anglais. Les langues et le moteur sont téléchargés depuis des URL jsDelivr figées ; les pixels restent dans le worker local. Une page à la fois, au plus 2 millions de pixels par rendu et 50 pages reconnues. Fermer l’aperçu annule le travail. Les budgets de taille de fichier, de pages et de texte existants restent appliqués.

Les erreurs de reconnaissance, l’ordre des colonnes irrégulières et les tableaux sans structure demandent une relecture. Appliquer l’aperçu remplace le texte courant et réinitialise ses sélections/nettoyages ; le PDF original n’est pas modifié. Les noms de chapitres explicites restent détectables par l’index de lecture.

## Partage et exploitation

- Snapshot compressé puis AES-256-GCM (clé aléatoire de 32 octets, IV de 12 octets). La clé de lecture reste dans le fragment `#session=id.clé`, retiré de l’adresse avant les statistiques ; elle n’est pas transmise au stockage.
- Texte courant, chapitres, position, voix et vitesse ; pas de PDF/PPTX original ni d’audio. Pas de synchronisation entre destinataires : chacun importe une copie volontairement.
- Identifiant aléatoire de 128 bits, capacité de suppression distincte de 256 bits ; seul son SHA-256 est stocké côté serveur. Le créateur conserve son moyen de suppression dans ce navigateur.
- Expiration stricte à sept jours lors de toute lecture, purge physique horaire. Une copie importée par le destinataire ne peut pas être révoquée.
- Corps chiffré limité à 512 Kio, décompression limitée à 8 Mio et texte validé à 2 millions de caractères. Liste blanche des champs, texte rendu via `textContent`/textarea.
- SQLite avec paramètres liés ; transactions pour quotas/écriture ; aucune clé dans l’API, aucun journal de requête applicatif activé. CORS limité aux deux origines du site ; le développement accepte une origine supplémentaire explicite via `DEV_ORIGIN` (absente en production).
- 5 créations par IP/heure, 100 globales/jour, 100 requêtes par IP/minute, 2 000 globales/minute, 200 Mio maximum côté stockage. Empreinte IP renouvelée chaque jour, compteurs purgés. Réponses `no-store`, `nosniff`, politique CSP restrictive.
- Worker et stockage SQLite Durable Objects compatibles avec le plan gratuit. Aucun abonnement payant activé.

Configuration : `services/sharing/wrangler.jsonc`, API publique dans `src/share-config.js`, origine autorisée par `scripts/stamp-version.mjs`. Pour republier : `npx wrangler@4.154.0 deploy --config services/sharing/wrangler.jsonc` avec le compte Cloudflare autorisé, puis build/tests/publication du site. Les fichiers locaux de connexion restent dans `logs/.cloudflare-private` ignoré par Git ; ne pas les publier ni les afficher.

Le test réel de partage est volontairement séparé pour ne pas consommer les quotas à chaque test local : `SHARING_LIVE_TEST=1 node --test tests/e2e/sharing.test.mjs`. Il n’envoie qu’un texte technique et supprime le lien après vérification. Les tests d’expiration, de quotas, de tailles et de CORS utilisent SQLite en mémoire, sans service public.

## Reste à mesurer

Validation sur le téléphone physique de Jonas (modèle/navigateur inconnus) et mesure d’un long cours réel, particulièrement sur Safari iOS et en stockage presque plein. Les tests de tailles d’écran Chrome ne remplacent pas cette vérification.

## Vérifications de livraison (2026-10-28)

- 140 tests unitaires passent, dont chiffrement/intégrité, limites de décompression, SQLite/expiration/CORS/quotas, conservation du PCM et équivalence MP3.
- 33 tests navigateur de régression passent (lecture/navigation, PDF, nettoyage, MP3, bibliothèque/OCR, clavier/mobile, CSP, version et SEO).
- Un test supplémentaire de fermeture/réouverture pendant un travail passe ; les cinq tests des nouvelles fonctions ont été relancés après la correction des dialogues.
- Le parcours complet utilise le service Cloudflare public : création chiffrée, import volontaire avec réglages, suppression et refus après suppression. Les liens techniques créés pendant les essais ont été supprimés.

Les cinq tests des nouvelles fonctions passent également sur `https://speechsynthe.si` après publication. Le cache d’installation comprend explicitement les bibliothèques de démarrage (shaders et lamejs), en plus du site ; leur présence dans Cache Storage est vérifiée avant le test hors connexion.
