# speechsynthe.si — « La Machine » : document de conception

- **Date** : 2026-10-24
- **Statut** : validé par Jonas le 2026-10-24
- **Dépôt** : `~/code/active/speech-synthesis/` → github.com/icanthateoncarti/speech-synthesis (public)
- **En ligne** : https://speechsynthe.si (GitHub Pages, HTTPS actif, DNS chez OVH)

## 1. Intention

speechsynthe.si devient un **outil gratuit de synthèse vocale en français** : on colle un texte, on choisit une voix, on écoute, on télécharge le MP3. Pas de compte, pas de limite, et **le texte ne quitte jamais l'ordinateur** : la voix est calculée dans le navigateur.

Pourquoi un outil et pas un site de contenu : le SEO « informatif » (résumés, explications) est mangé par les réponses IA et ChatGPT (68 % des recherches Google sans clic, d'après les notes Ideas.xyz du vault). Une recherche d'**action** (« synthèse vocale gratuite », « texte en audio mp3 », « lire un texte à voix haute en ligne ») amène encore un clic, parce qu'aucune IA ne te donne le fichier audio à la place.

C'est un **projet fun** d'abord. L'argent (publicité, affiliation ElevenLabs) viendra plus tard et n'est pas dans cette version.

## 2. Ce qu'on vise

### Objectifs (v1)
1. Une page d'accueil qui **est** l'outil : une machine parlante orange, utilisable dès l'arrivée, sans rien lire.
2. Synthèse vocale française **100 % dans le navigateur**, deux voix : **Jessica** (femme) et **Tom** (homme).
3. Écouter le texte, **télécharger un MP3**, importer le texte d'un **PDF**.
4. Une page qui peut se classer sur Google malgré l'absence de texte visible au premier écran (voir §6).
5. Fonctionne sur ordinateur **et** sur téléphone.

### Hors périmètre (v1)
- Pages par usage (« lire un PDF », « voix off TikTok », « message de répondeur », « réviser à l'oral ») : **v2**, une fois l'outil solide.
- Publicité, liens d'affiliation, newsletter, comptes utilisateurs.
- Réglage de hauteur, troisième voix (« Pierre », le 2ᵉ locuteur du modèle UPMC).
- Autres langues que le français.

### Anti-objectifs (ce qui ferait échouer le projet même si « ça marche »)
- **Du texte marketing ou explicatif visible au premier écran** : bannières, slogans, « gratuit · sans compte · … ». Jonas l'a refusé explicitement : on doit comprendre en voyant l'objet.
- **Un look de SaaS générique** (cartes blanches, dégradés bleus, gabarits). Rejeté comme « slop ».
- **Du quadrillage façon « cours »**, des frises décoratives, des éléments qui ne servent à rien.
- **Envoyer le texte de l'utilisateur sur un serveur**, sous quelque forme que ce soit.
- Une inscription, une limite, un mur payant.

## 3. Contraintes

- **Hébergement statique** : GitHub Pages, sans serveur, sans backend. Coût d'exploitation : 0 €, hors domaine (14,29 € HT/an chez OVH).
- **Domaine en .si** : Google l'associe à la Slovénie. C'est un handicap SEO accepté par Jonas.
- **Licences des voix** :
  - Jessica = modèle Piper `fr_FR-upmc-medium`, jeu de données **CC BY-SA 4.0** → **créditer la source** sur le site.
  - Tom = modèle Piper `fr_FR-tom-medium`, **AGPLv3** → **le code du site reste public** (c'est déjà le cas) et la licence est mentionnée.
- **Taille des modèles** : environ 60 Mo par voix au premier usage, puis gardés en cache par le navigateur.
- **Pas de SaaS payant** (règle de Jonas) : uniquement des bibliothèques open source.

## 4. Ce qui est décidé

### 4.1 Direction visuelle : « La Machine »
Inspirée du **Speak & Spell** (Texas Instruments, 1978, premier objet parlant grand public) et de l'esthétique **Teenage Engineering**. Maquette validée : `.superpowers/brainstorm/…/content/concepts-v2.html`, concept 1.

- **La page entière = l'objet.** Fond gris chaud uni, la machine centrée. En haut à gauche, seulement `speechsynthe.si`. Rien d'autre au premier écran.
- **Boîtier** : plastique orange avec du **grain**, rendu par le shader `grain-gradient` de **`@paper-design/shaders`** (Apache-2.0). Coins arrondis, ombre portée, épaisseur visible en bas.
- **Sérigraphie** en haut du boîtier : logotype `speech` + pastille bleue `synthe.si`, plus une **grille de haut-parleur** (trous ronds).
- **Écran fluorescent** (vert menthe sur noir, police DotGothic16, lueur, lignes de balayage) : **c'est le champ de saisie**. Vide, il n'affiche qu'un curseur qui clignote. On tape ou on colle directement dedans.
- **Pendant la lecture**, le mot prononcé est **surligné** sur l'écran.
- **Ligne d'état** au bas de l'écran (même police, couleur plus sombre) : état (`PRÊT`, `CHARGEMENT VOIX 42 %`, `▶ LECTURE`, `✓ MP3 PRÊT`) et voix active.
- **Touches** :
  - **▶ PARLE** : grande, bleue. Lance la lecture, puis devient PAUSE / REPRENDRE.
  - **⬇ MP3**, **PDF** : jaunes, avec un effet d'enfoncement au clic. **EFFACE** : touche secondaire encastrée.
- **Ordre des commandes (repris le 2026-10-26)** : import PDF/PPTX et effacement secondaire à gauche, bouton de voix et vitesse au centre avec le vumètre, PARLE et MP3 à droite. Les touches principales sont alignées, sans zones numérotées. EFFACE reste encastré. Le même ordre s’applique au clavier.
- **Vumètre** : barres qui réagissent au **vrai niveau audio** pendant la lecture.
- **Bouton rotatif** argenté : deux positions, **JESSICA** / **TOM**, rotation animée. Clic ou glisser à la souris/au doigt, avec validation de la voix au relâchement ; les libellés restent utilisables au clavier.
- **Curseur de vitesse** façon matériel (fader) sur le boîtier, de 0,7× à 1,5×, cran central à 1,0×. La valeur s'affiche sur la ligne d'état (`VITESSE 1.2×`).

### 4.2 Le texte pour Google sans casser le design
1. **Titre gravé sur l'objet.** Le `<h1>` de la page est un nom de modèle sérigraphié sur le boîtier, par exemple « Synthèse vocale », dans le style du marquage. C'est du design pour l'œil et le titre principal pour Google.
2. **Questions fréquentes sous la machine**, visibles seulement en faisant défiler. Questions types :
   - Est-ce vraiment gratuit ?
   - Mon texte est-il envoyé quelque part ?
   - Comment télécharger le MP3 ?
   - Comment lire un PDF à voix haute ?
   - Quelles voix sont disponibles ?
   - Pourquoi le premier chargement est-il long ?
   - Puis-je utiliser l'audio pour une vidéo TikTok ou YouTube ?
   - Fonctionne-t-il sur téléphone ?
   
   Elles sont rédigées pour répondre aux vraies recherches et balisées en données structurées `FAQPage`.
3. **Balises** :
   - `<title>` : « Synthèse vocale gratuite en français — texte en audio MP3 | speechsynthe.si »
   - Une meta description, une image de partage (aperçu de la machine) et `lang="fr"`.
4. **Crédits et licences** en bas de page, après les questions : Piper, UPMC (CC BY-SA 4.0), Tom (AGPLv3), lien vers le code source.

### 4.3 Moteur de voix
- Bibliothèque **`@diffusionstudio/vits-web`** (MIT), validée par le prototype du 2026-10-24 :
  - voix `fr_FR-upmc-medium` (= Jessica, locuteur 0) et `fr_FR-tom-medium` ;
  - environ 7 s pour générer 13 s d'audio, téléchargement du modèle compris ;
  - presque instantané ensuite.
- Voix **écartées** :
  - `siwis-medium` et `mls-medium` : jugées mauvaises à l'écoute ;
  - les voix `-low` : modèles incompatibles, erreur à l'exécution.
- Modèles téléchargés depuis Hugging Face et mis en cache dans le navigateur (OPFS) par la bibliothèque.

### 4.4 Comportement de l'outil
- **Coller ou taper du texte** dans l'écran. Pas de limite de longueur imposée.
- **PARLE** :
  - si la voix n'est pas encore téléchargée, la ligne d'état affiche la progression en pourcentage ;
  - sinon, la synthèse démarre ;
  - un deuxième appui met en pause ; le suivant reprend à la même position.
- **Bouton rotatif** : change de voix. Si un audio était déjà généré, il faut le regénérer avec la nouvelle voix.
- **Vitesse** : appliquée **à la synthèse** via le paramètre `length_scale` de Piper (vitesse = 1 / length_scale). La voix garde donc un débit naturel, et le MP3 téléchargé est à la même vitesse que l'écoute. `@diffusionstudio/vits-web` lit ce paramètre dans la config du modèle sans l'exposer : on intègre et adapte sa source (MIT) pour le rendre réglable.
- **⬇ MP3** : télécharge l'audio du texte actuel en **MP3**. Il est généré s'il ne l'est pas déjà.
- **PDF** : ouvre un sélecteur de fichier, extrait le texte du PDF dans le navigateur et le place dans l'écran.
- **EFFACE** : vide l'écran et l'audio.
- Le texte reste local. Aucun appel réseau sauf le téléchargement des modèles de voix et des bibliothèques.

### 4.5 Téléphone
La machine se réorganise en format portrait : écran en haut, puis trois rangées.
IMPORTER et EFFACE partagent la première ; le bouton de voix, la vitesse et le vumètre
occupent la deuxième ; PARLE et MP3 sont côte à côte sur la dernière. Le nom du document
importé apparaît dans l'écran. Les commandes avancées se déplient sous le pupitre,
avec focus dans le champ de commande et retour au bouton par Échap.

Le grain et les ombres restent. Les touches font au moins 44 px.

## 5. Laissé au développeur

- **Encodage MP3** dans le navigateur. Le moteur sort du WAV. Bibliothèque au choix (par exemple lamejs, LGPL, compatible avec un dépôt public), à valider sur un audio de quelques minutes.
- **Textes longs** : découpage par phrase pour commencer à lire avant la fin de la synthèse, et pour ne pas bloquer la page. La synthèse tourne dans un Web Worker.
- **Synchronisation du surlignage** : Piper ne donne pas de minutage par mot. Estimation proportionnelle (par caractères, par phrase) acceptable.
- **Extraction PDF** : pdf.js (Apache-2.0) ou équivalent, chargé seulement au clic sur PDF.
- **Structure du code** : HTML/CSS/JS sans framework ou avec un outil de build léger. Au choix, tant que le site reste statique sur GitHub Pages.
- **Libellé exact du titre gravé** (« Synthèse vocale », « Modèle SS-26 · Synthèse vocale », …) et rédaction des réponses de la FAQ.
- **Accessibilité** :
  - les personnes malvoyantes et dyslexiques font partie du public ;
  - tout doit marcher au clavier ;
  - libellés lisibles par les lecteurs d'écran (le bouton rotatif est un vrai contrôle) ;
  - respect de `prefers-reduced-motion` (pas de grain animé, pas de clignotement).
- **Navigateurs sans WebGL** : repli sur un orange uni avec une texture statique.
- **Remplacement** de la page v1 actuelle (`index.html`).

## 6. Risques connus

| Risque | Parade |
|---|---|
| Premier chargement lourd (~60 Mo par voix) : les gens partent | Progression claire sur l'écran ; téléchargement de la voix par défaut lancé dès la première frappe |
| Handicap SEO du .si + page pauvre en texte | Titre gravé, FAQ structurée, pages par usage en v2 |
| Qualité audio jugée « robot » par certains | Deux meilleures voix retenues à l'écoute ; ElevenLabs proposé plus tard pour la qualité supérieure |
| Mobiles anciens trop lents | Message d'état clair ; textes découpés en phrases |

## 7. Choix faits par Claude, pas par Jonas (à vérifier)
- **Voix par défaut** : Jessica (comme sur la maquette).
- **Import PDF dès la v1** : la touche est sur la maquette et « lire un PDF à voix haute » est une vraie recherche.
- **Formulation des questions de la FAQ calquée sur les recherches** (« Comment transformer un texte en audio MP3 ? », « Comment lire un PDF à voix haute ? ») ; réponses au **tutoiement**. Le tu/vous n'a pas d'effet SEO direct, c'est la correspondance avec la requête qui compte (validé par Jonas : « le plus optimisé pour le SEO »).
- **Statistiques** (décidé par Jonas le 2026-10-24) : **Google Search Console** (aucun code sur le site, vérification par TXT chez OVH) + **un compteur de visites sans cookies**, donc **sans bannière de consentement** : GoatCounter (open source) ou Cloudflare Web Analytics (gratuit). Choix final à la création du compte par Jonas ; vérifier les conditions d'usage commercial de GoatCounter avant d'ajouter de la pub. Le compteur ne reçoit que la page vue, jamais le texte tapé. Google Analytics est exclu, à cause de la bannière cookies.
- **Vitesse réglable dès la v1** (demandé par Jonas), de 0,7× à 1,5×.

## 8. Après la v1 (pour mémoire, non engagé)

### Navigation dans la lecture web — demande de Jonas du 2026-10-25 (V2)

Pendant que la machine lit le texte, permettre de se déplacer dans l'audio depuis
l'interface web, notamment par commande vocale. Cette fonctionnalité concerne le
lecteur du site ; elle ne modifie pas un MP3 déjà téléchargé.

- Par durée : « Reviens 30 secondes en arrière », « Avance de 5 minutes ».
- Par phrase : « Reviens 3 phrases en arrière », « Avance de 6 phrases ».
- Par chapitre : « Reviens au précédent chapitre », « Recommence le chapitre »,
  « Skip jusqu'aux 3 prochains chapitres » (avancer de trois chapitres).
- Garder la position de lecture, le texte surligné et le chapitre synchronisés.
- Prévoir des commandes visuelles/clavier équivalentes ; la reconnaissance vocale
  reste facultative et nécessite l'activation explicite du microphone.
- Définir comment repérer les chapitres du texte/PDF et comment avancer vers une
  partie dont l'audio n'a pas encore été généré. Préserver le traitement local.

À réaliser après la mise en ligne et la validation de la V1.

### Import PDF par glisser-déposer — demande de Jonas du 2026-10-25

- [x] Permettre de glisser-déposer un PDF sur la machine ou son écran pour importer son texte, en complément de la touche PDF.
- Réutiliser l'extraction locale et les messages existants pour les PDF sans texte, illisibles ou protégés.
- Signaler visuellement la zone de dépôt pendant le survol et empêcher le navigateur d'ouvrir le PDF à la place du site.

### Partage de session par lien — demande de Jonas du 2026-10-26

- [ ] Permettre de partager une session de l'application radio via un lien.

### Retravailler l'UI des commandes — demande de Jonas du 2026-10-26

- [x] Reprendre les proportions, l’alignement et la sensation de pression des touches ; adapter le pupitre à trois rangées sur téléphone.
- [x] Bouton rotatif (JESSICA / TOM) au glisser avec pointer events, sans sélection de texte ; geste annulé = voix conservée, choix au relâchement. Clic et clavier conservés.

### Autres pistes
- Pages par usage, une par recherche (PDF, TikTok, répondeur, révisions), avec la machine intégrée.
- (Search Console et compteur sans cookies : voir §7, à brancher dès la v1.)
- Publicité discrète et lien ElevenLabs « voix plus réaliste / usage commercial ».
