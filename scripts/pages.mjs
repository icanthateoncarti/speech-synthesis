// Pages par usage, une par recherche qui a du volume (Google Trends France,
// 12 mois au 2026-10-25, base 100 = « synthèse vocale ») :
// texte en audio ≈ 1650 (accueil), text to speech ≈ 1940, message répondeur ≈ 320,
// pdf en audio ≈ 270 (+ pdf en mp3 ≈ 50), voix off ia ≈ 97.
// « powerpoint en audio » et « écouter ses cours » ≈ 0 : pas de page dédiée.
// Chaque page reprend la machine de index.html ; seuls les textes changent.

export const PAGES = [
  {
    slug: "pdf-en-audio",
    title: "PDF en audio gratuit et sans limite : écouter ou convertir en MP3",
    guide: {
      title: "Comment lire un PDF à voix haute",
      steps: [
        "Appuie sur la touche PDF/PPTX ou glisse ton fichier sur la machine : le texte s'affiche à l'écran.",
        "Choisis la voix et la vitesse. Les titres du document deviennent des chapitres que tu peux choisir pendant l'écoute.",
        "Appuie sur PARLE pour écouter, ou sur MP3 pour garder ton PDF en audio.",
      ],
      whyTitle: "Pourquoi ton PDF ne part nulle part",
      why: "Le texte est extrait et lu dans ton navigateur : aucun envoi, aucun serveur. C'est aussi pour ça que l'outil est gratuit sans limite de pages, là où beaucoup de convertisseurs s'arrêtent après quelques pages ou demandent un compte.",
    },
    description: "Transforme un PDF ou un PowerPoint en audio : la machine le lit à voix haute, chapitre par chapitre, et le convertit en MP3. Gratuit, sans compte, ton fichier reste sur ton ordinateur.",
    h1: "PDF en audio",
    faq: [
      ["Comment transformer un PDF en audio ?", "Appuie sur la touche PDF/PPTX ou glisse ton fichier sur la machine : son texte s'affiche sur l'écran. Appuie sur PARLE pour l'écouter, ou sur MP3 pour télécharger l'audio. Tout se passe dans ton navigateur."],
      ["Comment convertir un PDF en MP3 gratuitement ?", "Importe ton PDF, choisis une voix et une vitesse, puis appuie sur la touche MP3. Le fichier audio est créé sur ton ordinateur et se télécharge tout seul. Il n'y a ni compte ni limite de pages."],
      ["Comment lire un PDF à voix haute et s'y retrouver ?", "Pendant la lecture, le mot prononcé est surligné sur l'écran. Tu peux reculer ou avancer de 30 secondes, choisir un chapitre, ou écrire « reviens 3 phrases en arrière » dans les COMMANDES. Les titres sont lus avec une pause d'une seconde avant et après."],
      ["Mon PDF est-il envoyé sur un serveur ?", "Non. Le texte est extrait et lu dans ton navigateur : ton fichier ne quitte jamais ton ordinateur. C'est utile pour un cours, un contrat ou un document personnel."],
      ["Est-ce que ça marche avec un PowerPoint ?", "Oui, avec les présentations .pptx : chaque diapo devient un chapitre et son titre est lu avec une courte pause. Un ancien fichier .ppt doit d'abord être enregistré en .pptx depuis PowerPoint."],
      ["Mon PDF est en anglais, est-ce qu'il sera bien lu ?", "Oui. La machine reconnaît un texte anglais et le lit avec une voix anglaise, sans réglage à faire. Le bouton rotatif choisit toujours entre une voix de femme et une voix d'homme."],
      ["Pourquoi mon PDF scanné ne se lit pas ?", "Un PDF scanné est une image : il ne contient pas de texte que la machine peut lire. Si tu arrives à sélectionner le texte du PDF dans ton lecteur habituel, il fonctionnera ici."],
    ],
  },
  {
    slug: "text-to-speech",
    title: "Text to speech gratuit et sans limite — français, anglais, MP3",
    guide: {
      title: "Comment utiliser le text to speech",
      steps: [
        "Colle ton texte sur l'écran de la machine, en français ou en anglais.",
        "Choisis une voix de femme ou d'homme avec le bouton rotatif, puis la vitesse.",
        "Appuie sur PARLE pour écouter, ou sur MP3 pour télécharger l'audio.",
      ],
      whyTitle: "Pourquoi c'est gratuit et sans limite",
      why: "Les voix tournent directement dans ton navigateur, sans serveur à payer : pas de crédits, pas de quota de caractères, pas de compte. Ton texte n'est envoyé nulle part.",
    },
    description: "Text to speech gratuit : colle ton texte, choisis une voix, écoute-le ou télécharge le MP3. Français et anglais, sans compte, sans limite, directement dans ton navigateur.",
    h1: "Text to speech",
    faq: [
      ["C'est quoi le text to speech ?", "C'est la synthèse vocale : un texte écrit est transformé en voix. Ici, tu colles ton texte sur l'écran de la machine et tu appuies sur PARLE."],
      ["Le text to speech est-il vraiment gratuit ici ?", "Oui : pas de compte, pas d'abonnement et pas de limite de texte. Les voix sont calculées dans ton navigateur, et ton texte n'est envoyé nulle part."],
      ["Quelles langues sont disponibles ?", "Le français et l'anglais. La machine reconnaît la langue du texte et choisit une voix française ou anglaise. Le bouton rotatif choisit entre une voix de femme et une voix d'homme."],
      ["Comment télécharger l'audio en MP3 ?", "Appuie sur la touche MP3 : l'audio est généré à la vitesse choisie et se télécharge tout seul. Tu peux l'utiliser dans une vidéo, un podcast ou pour réviser."],
      ["Pourquoi la première lecture prend-elle du temps ?", "Chaque voix pèse environ 60 Mo et se télécharge la première fois que tu l'utilises. Ensuite, elle reste en cache dans ton navigateur et la lecture démarre presque tout de suite."],
    ],
  },
  {
    slug: "voix-off",
    title: "Voix off IA gratuite et sans limite pour TikTok et YouTube",
    guide: {
      title: "Comment créer une voix off",
      steps: [
        "Écris ton texte sur l'écran, ou mets un des exemples dans la machine.",
        "Choisis une voix de femme ou d'homme, en français ou en anglais selon ton texte, et règle la vitesse.",
        "Appuie sur MP3, puis importe le fichier dans CapCut, TikTok ou ton logiciel de montage.",
      ],
      whyTitle: "Pourquoi tu peux recommencer autant que tu veux",
      why: "Les voix sont calculées dans ton navigateur : chaque nouvel essai est gratuit, sans crédits ni filigrane. Tu peux retoucher ton texte et régénérer ta voix off jusqu'à ce que le rythme colle à ta vidéo.",
    },
    description: "Crée une voix off gratuite pour tes vidéos TikTok, Reels ou YouTube : écris ton texte, choisis une voix française ou anglaise, télécharge le MP3. Sans compte.",
    h1: "Voix off",
    examples: [
      ["Accroche TikTok", "Tu fais sûrement cette erreur tous les matins. Et elle te coûte une heure par jour. Voici comment l'éviter, en trois étapes."],
      ["Intro de tuto YouTube", "Dans cette vidéo, je te montre comment transformer n'importe quel PDF en audio, gratuitement. Ça prend moins d'une minute. On commence."],
      ["Présentation de produit", "Découvrez notre nouvelle collection, pensée pour durer. Des matières naturelles, des coupes simples, et un prix juste."],
    ],
    faq: [
      ["Comment faire une voix off pour TikTok ?", "Écris ton texte sur l'écran, choisis Jessica ou Tom et la vitesse, puis appuie sur MP3. Importe ensuite le fichier dans CapCut ou dans l'éditeur de TikTok, sous ta vidéo."],
      ["Puis-je monétiser une vidéo avec cette voix off ?", "Oui, même dans une vidéo monétisée. Avec Jessica, écris « Voix : Piper, jeu de données UPMC (CC BY-SA 4.0) » dans la description. Avec Tom, « Voix : Piper » suffit : sa licence AGPLv3 porte sur le modèle, pas sur l'audio que tu crées."],
      ["Comment rendre la voix off plus naturelle ?", "Écris des phrases courtes et mets un point là où tu veux une respiration. Une ligne seule, sans ponctuation finale, est lue comme un titre, avec une pause d'une seconde avant et après."],
      ["Je peux faire une voix off en anglais ?", "Oui : écris ton texte en anglais, la machine le reconnaît et choisit une voix anglaise. Le bouton rotatif choisit toujours entre une voix de femme et une voix d'homme."],
    ],
  },
  {
    slug: "message-repondeur",
    title: "Message de répondeur gratuit : crée ton MP3 sans t'enregistrer",
    guide: {
      title: "Comment créer ton message de répondeur",
      steps: [
        "Mets un des exemples dans la machine ou écris ton message, en remplaçant les passages entre crochets.",
        "Choisis la voix et garde une vitesse proche de 1,0× pour que les numéros restent clairs.",
        "Appuie sur MP3 et installe le fichier sur ta messagerie.",
      ],
      whyTitle: "Pourquoi tu n'as pas besoin de t'enregistrer",
      why: "La machine lit ton message d'une voix posée, sans bruit de fond ni hésitation. Tu peux le modifier et le régénérer en quelques secondes, gratuitement et sans compte.",
    },
    description: "Écris ton message de répondeur, choisis une voix et télécharge-le en MP3, sans t'enregistrer. Exemples de messages pro et perso prêts à l'emploi. Gratuit, sans compte.",
    h1: "Message de répondeur",
    examples: [
      ["Pro, simple", "Bonjour, vous êtes bien sur la messagerie de [ton nom]. Je ne peux pas vous répondre pour le moment. Laissez-moi votre nom, votre numéro et l'objet de votre appel, je vous rappelle dès que possible. Merci et bonne journée."],
      ["Entreprise, avec horaires", "Bonjour et merci de votre appel. Nos bureaux sont ouverts du lundi au vendredi, de 9 heures à 18 heures. Laissez-nous un message avec vos coordonnées, nous vous rappellerons rapidement."],
      ["Absence ou vacances", "Bonjour, je suis absent jusqu'au [date]. Pour toute urgence, contactez [nom] au [numéro]. Sinon, laissez-moi un message, je vous rappelle à mon retour."],
      ["Perso", "Salut, c'est [ton prénom] ! Je ne suis pas dispo pour l'instant. Laisse-moi un message et je te rappelle vite."],
      ["Avec une pointe d'humour", "Bonjour, vous êtes bien chez [ton prénom]. Je suis en train de chercher mon téléphone, qui sonne quelque part sous un coussin. Laissez un message, je le retrouverai avant ce soir."],
    ],
    faq: [
      ["Comment créer un message de répondeur en MP3 ?", "Choisis un exemple ou écris ton message sur l'écran, règle la voix et la vitesse, puis appuie sur MP3. Remplace d'abord les passages entre crochets par ton nom, tes horaires ou ton numéro."],
      ["Comment mettre le MP3 sur ma messagerie ?", "Sur un standard téléphonique ou une ligne VoIP, tu peux en général importer un fichier audio dans les réglages de la messagerie. Sur un portable, la messagerie de l'opérateur s'enregistre au micro : fais jouer le MP3 près du téléphone pendant l'enregistrement."],
      ["Quelle voix choisir pour un répondeur professionnel ?", "Jessica et Tom ont toutes les deux une voix posée et claire. Garde une vitesse entre 0,9× et 1,0× : les numéros et les horaires restent faciles à noter."],
      ["Est-ce gratuit pour une entreprise ?", "Oui, l'outil est gratuit et sans compte, quel que soit l'usage. Les voix sont sous licences libres, CC BY-SA 4.0 pour Jessica et AGPLv3 pour Tom, qui autorisent un usage commercial."],
    ],
  },
];
