// Pages par usage, une par recherche qui a du volume (Google Trends France,
// 12 mois au 2026-10-25, base 100 = « synthèse vocale ») :
// texte en audio ≈ 1650 (accueil), text to speech ≈ 1940, message répondeur ≈ 320,
// pdf en audio ≈ 270 (+ pdf en mp3 ≈ 50), voix off ia ≈ 97.
// « powerpoint en audio » et « écouter ses cours » ≈ 0 : pas de page dédiée.
// Chaque page reprend la machine de index.html ; seuls les textes changent.

export const PAGES = [
  {
    slug: "pdf-en-audio",
    title: "PDF en audio gratuit — écoute tes documents ou garde le MP3",
    guide: {
      title: "Tes cours à écouter, même loin de ton écran",
      steps: [
        "Appuie sur IMPORTER pour ouvrir ton PDF ou ton PowerPoint. Tu peux aussi le déposer sur la radio.",
        "Pour un PDF, ouvre PAGES et sélectionne les passages à lire ou à sauter. Choisis ensuite la voix et la vitesse.",
        "Appuie sur PARLE pour écouter, ou sur MP3 pour emporter ton cours en audio.",
      ],
      whyTitle: "Garde les passages dont tu as besoin",
      why: "Un chapitre à réviser ? Sélectionne-le dans PAGES, puis écoute-le à ton rythme. Ton PDF est traité sur ton appareil, sans être envoyé à un serveur.",
    },
    description: "Écoute tes cours en PDF ou PowerPoint, choisis les passages à lire et garde le MP3. Gratuit, sans compte. Tes documents restent sur ton appareil.",
    h1: "PDF en audio",
    faq: [
      ["Comment écouter mon PDF ?", "Appuie sur IMPORTER, choisis ton PDF, puis appuie sur PARLE. Tu peux aussi déposer le fichier sur la radio."],
      ["Comment garder mon PDF en MP3 ?", "Importe ton PDF, règle la voix et la vitesse, puis appuie sur MP3. Le fichier audio reprend les passages sélectionnés dans PAGES."],
      ["Comment retrouver un passage pendant la lecture ?", "Utilise les boutons ±30 s, la barre de lecture ou le menu des chapitres. Dans COMMANDES, tu peux aussi écrire « reviens 3 phrases en arrière »."],
      ["Mon PDF reste-t-il privé ?", "Oui : son texte est extrait et lu sur ton appareil. Le fichier et son contenu ne sont pas envoyés à un serveur."],
      ["Et pour un PowerPoint ?", "Importe une présentation au format .pptx : chaque diapositive devient un chapitre. Pour un ancien fichier .ppt, enregistre-le d’abord en .pptx."],
      ["Quelles voix sont disponibles ?", "Deux voix par langue, en français et en anglais."],
      ["Pourquoi mon PDF ne se lit-il pas ?", "La radio a besoin de texte sélectionnable : un PDF composé uniquement de scans ou de photos ne suffit pas. Les tableaux et les mises en page complexes peuvent aussi perturber l’ordre de lecture."],
      ["Quelle taille de fichier puis-je importer ?", "Jusqu’à 100 Mo par fichier, avec un maximum de 5 000 pages et de 2 millions de caractères extraits. Sur téléphone, commence par un document court : le temps de préparation dépend de ton appareil."],
    ],
  },
  {
    slug: "text-to-speech",
    title: "Text to speech gratuit — texte en voix, français et anglais",
    guide: {
      title: "Colle ton texte. Écoute la suite.",
      steps: [
        "Colle ou écris ton texte dans l’écran de la radio.",
        "Choisis une voix avec le bouton rotatif et règle la vitesse.",
        "Appuie sur PARLE pour écouter, ou sur MP3 pour garder l’audio.",
      ],
      whyTitle: "Écouter, corriger, recommencer",
      why: "Un cours à réviser, un article à écouter ou un texte à relire à voix haute : tu choisis. Modifie une phrase, ajuste le rythme et relance la lecture, sans crédits à acheter.",
    },
    description: "Transforme ton texte en voix : colle-le, choisis une voix et écoute ou télécharge le MP3. Synthèse vocale gratuite en français et en anglais, sans compte.",
    h1: "Text to speech",
    faq: [
      ["Le text to speech, c’est quoi ?", "C’est un outil qui lit un texte à voix haute. Colle le tien dans l’écran, puis appuie sur PARLE."],
      ["Faut-il payer ou créer un compte ?", "Non : l’écoute et le téléchargement MP3 sont gratuits, sans inscription. Ton appareil prépare la voix directement dans le navigateur."],
      ["Quelles voix sont disponibles ?", "Deux voix par langue, en français et en anglais."],
      ["Comment télécharger le MP3 ?", "Choisis la voix et la vitesse, puis appuie sur MP3. Garde l’onglet ouvert pendant la préparation du fichier."],
      ["Pourquoi ce temps de chargement ?", "La radio télécharge la voix choisie avant de pouvoir lire ton texte. Le navigateur la conserve ensuite en cache, si l’espace disponible le permet, pour éviter de la télécharger à nouveau."],
    ],
  },
  {
    slug: "voix-off",
    title: "Voix off gratuite — crée le MP3 de ta vidéo",
    guide: {
      title: "Ton script devient une voix off",
      steps: [
        "Écris ton script dans l’écran ou charge un exemple ci-dessous.",
        "Choisis une voix et une vitesse, puis appuie sur PARLE pour écouter le résultat.",
        "Ajuste ton texte si besoin, télécharge le MP3 et ajoute-le à ton montage.",
      ],
      whyTitle: "Trouve le rythme de ta vidéo",
      why: "Une phrase sonne trop longue ? Raccourcis-la et écoute à nouveau. Chaque essai est gratuit, et ton script reste sur ton appareil.",
    },
    description: "Donne une voix à tes vidéos : écris ton script, écoute le résultat et télécharge le MP3. Deux voix par langue, en français et en anglais. Gratuit, sans compte.",
    h1: "Voix off",
    examples: [
      ["Introduction de tuto", "Aujourd’hui, on transforme un document en audio. Je te montre comment choisir les passages à écouter, puis télécharger le résultat."],
      ["Présentation de recette", "Une poêle, quelques légumes et vingt minutes devant toi. Voici une recette simple pour ce soir."],
      ["Présentation de produit", "Voici notre nouvelle collection. On te présente les coupes, les couleurs et les détails pour t’aider à choisir."],
    ],
    faq: [
      ["Comment créer la voix off de ma vidéo ?", "Colle ton script dans l’écran, choisis la voix et la vitesse, puis écoute avec PARLE. Quand le résultat te convient, télécharge le MP3."],
      ["Comment ajouter la voix à mon montage ?", "Importe le MP3 comme une piste audio dans ton logiciel de montage. Ajuste ensuite sa position et son volume pour l’accorder aux images."],
      ["Comment rendre mon script agréable à écouter ?", "Écris comme tu parles, avec des phrases courtes et une idée à la fois. Écoute un premier essai pour repérer les passages à raccourcir ou à ponctuer."],
      ["Quelles voix sont disponibles ?", "Deux voix par langue, en français et en anglais."],
    ],
  },
  {
    slug: "message-repondeur",
    title: "Message de répondeur — crée ton MP3 sans t’enregistrer",
    guide: {
      title: "Un message clair, sans passer au micro",
      steps: [
        "Choisis un exemple ci-dessous et remplace les noms, dates et horaires par les tiens.",
        "Écoute avec PARLE. Ajuste la vitesse pour que chaque numéro soit facile à comprendre.",
        "Télécharge le MP3, puis ajoute-le à ta messagerie si elle accepte les fichiers audio.",
      ],
      whyTitle: "Change ton annonce quand tes horaires changent",
      why: "Congés, nouveaux horaires ou indisponibilité : adapte simplement ton texte. Tu peux réécouter le message et télécharger une nouvelle version gratuitement.",
    },
    description: "Prépare ton message de répondeur sans t’enregistrer : adapte un exemple, choisis une voix et télécharge le MP3. Gratuit et sans compte.",
    h1: "Message de répondeur",
    examples: [
      ["Pro, simple", "Bonjour, vous êtes bien sur la messagerie de [ton nom]. Je ne peux pas vous répondre pour le moment. Laissez-moi votre nom, votre numéro et l'objet de votre appel, je vous rappelle dès que possible. Merci et bonne journée."],
      ["Entreprise, avec horaires", "Bonjour et merci de votre appel. Nos bureaux sont ouverts du lundi au vendredi, de 9 heures à 18 heures. Laissez-nous un message avec vos coordonnées, nous vous rappellerons rapidement."],
      ["Absence ou vacances", "Bonjour, je suis absent jusqu'au [date]. Pour toute urgence, contactez [nom] au [numéro]. Sinon, laissez-moi un message, je vous rappelle à mon retour."],
      ["Perso", "Salut, c'est [ton prénom] ! Je ne suis pas dispo pour l'instant. Laisse-moi un message et je te rappelle vite."],
      ["Avec une pointe d'humour", "Bonjour, vous êtes bien chez [ton prénom]. Je suis en train de chercher mon téléphone, qui sonne quelque part sous un coussin. Laissez un message, je le retrouverai avant ce soir."],
    ],
    faq: [
      ["Comment préparer mon message ?", "Charge un exemple ou écris ton annonce dans l’écran. Remplace les passages entre crochets, écoute le résultat, puis télécharge le MP3."],
      ["Ma messagerie accepte-t-elle les MP3 ?", "Cela dépend de ton opérateur ou de ton standard : vérifie si ses réglages proposent l’import d’un fichier audio. Si elle impose un enregistrement au micro, le MP3 ne pourra pas être ajouté directement."],
      ["Quelles voix sont disponibles ?", "Deux voix par langue, en français et en anglais."],
      ["Comment faire comprendre un numéro ou des horaires ?", "Sépare les groupes de chiffres par des espaces et ajoute de la ponctuation pour les pauses. Écoute ton annonce avant de la télécharger et ralentis la voix si nécessaire."],
      ["Est-ce gratuit aussi pour une entreprise ?", "L’outil est gratuit et sans inscription. Les crédits et les licences des voix sont indiqués en bas de page."],
    ],
  },
];
