// Contenu éditorial original ; les HTML et Markdown sont générés au build.
export const ARTICLES = [{
  kind: "article",
  slug: "ecouter-ses-cours",
  title: "Écouter ses cours PDF ou PowerPoint pour réviser : le guide",
  h1: "Comment écouter ses cours PDF ou PowerPoint pour réviser",
  navLabel: "Guide étudiant",
  description: "Un cours à réviser dans le train ou en marchant ? Prépare ton PDF ou PowerPoint, retire les répétitions et emporte le MP3. Exemple et captures à l’appui.",
  published: "2026-10-29",
  updated: "2026-10-29",
  intro: "Tu as un cours de vingt pages à revoir et un trajet devant toi. Avec speechsynthe.si, tu peux transformer le texte de ton PDF ou PowerPoint en audio, puis télécharger le MP3 pour l’écouter sans connexion. C’est gratuit et sans compte.",
  premise: "La radio lit le texte extrait : elle ne le résume pas et ne le reformule pas. Une définition reste une définition, une longue liste reste une longue liste. C’est utile si tu veux retrouver le contenu du cours, mais l’audio peut durer longtemps. Les schémas, les tableaux et les formules demandent encore de regarder le document.",
  related: [
    { href: "/powerpoint-en-mp3/", label: "Convertir un PowerPoint en MP3", text: "ce que la radio lit dans un fichier .pptx, et ce qu’elle laisse de côté." },
    { href: "/pdf-en-audio/", label: "Lire un PDF à voix haute", text: "pour un cours en PDF, avec le choix des pages et la lecture des pages scannées." },
    { href: "/pdf-voix-haute-telephone/", label: "Lire un PDF à voix haute sur son téléphone", text: "choisir les pages du doigt et préparer le MP3 avant de partir." }
  ],
  sample: { href: "/assets/guides/cours-exemple-moyenne-mediane.pdf", label: "Télécharger le cours d’exemple (PDF, 2 pages)", description: "Un mini-cours original sur la moyenne et la médiane, créé pour ce guide. Aucun document d’étudiant n’est utilisé dans les captures." },
  sections: [
    {
      id: "preparer", title: "1. Pars d’un passage que tu veux vraiment revoir",
      paragraphs: [
        "Choisis un chapitre, quelques diapositives ou une synthèse. Pour un premier essai, un passage court te permet de vérifier le résultat avant de préparer tout un cours. Un PowerPoint très visuel, avec trois mots et un graphique par diapositive, ne devient pas une explication orale complète : la radio n’invente pas ce qui manque.",
        "Ouvre la radio, clique sur IMPORTER ou glisse ton fichier dessus. Elle accepte les PDF et les PowerPoint au format .pptx. Si ton fichier est un ancien .ppt, enregistre-le en .pptx ou en PDF depuis ton logiciel de présentation."
      ]
    },
    {
      id: "verifier", title: "2. Relis ce que la radio va prononcer",
      paragraphs: [
        "Après l’import, le texte apparaît dans la radio. Ouvre le menu ⋯, puis RELIRE LE TEXTE pour le vérifier dans un écran plus grand. Si le PDF contient des pages scannées, cet écran s’ouvre automatiquement. Vérifie quelques lignes : les phrases sont-elles dans le bon ordre ? Les nombres sont-ils corrects ? Tu peux corriger le texte directement, puis cliquer sur « Mettre dans la radio ».",
        "Si les colonnes se mélangent ou si du texte manque, ouvre « Texte en désordre ou incomplet ? ». Pour un PDF scanné, tu peux activer la reconnaissance du texte, en français ou en anglais, jusqu’à 50 pages par import. Elle s’exécute sur ton appareil, peut prendre plusieurs minutes et peut se tromper."
      ],
      figure: { src: "/assets/guides/relire-cours.jpg", width: 1100, height: 850, alt: "Le cours d’exemple dans l’écran sombre Relire avant d’écouter, avec le texte modifiable et le bouton Mettre dans la radio.", caption: "Le texte affiché ici est celui qui sera lu. Une vérification rapide évite d’écouter une colonne dans le mauvais ordre." }
    },
    {
      id: "nettoyer", title: "3. Enlève ce qui coupe le fil du cours",
      paragraphs: [
        "Un nom d’école ou une année scolaire répétés sur chaque page deviennent vite pénibles à entendre. Quand la radio repère ces répétitions, le bouton NETTOYER apparaît : un clic les retire, un second les remet. Les chapitres numérotés sont protégés.",
        "Avec un PDF au texte sélectionnable, PAGES permet aussi de choisir les passages à lire ou à sauter. Tu peux ainsi laisser de côté une page de garde ou un sommaire. L’objectif est de retirer le bruit autour du cours, sans perdre les titres qui t’aident à te repérer. Ton fichier d’origine reste intact."
      ]
    },
    {
      id: "ecouter", title: "4. Écoute un extrait avant de tout lancer",
      paragraphs: [
        "La langue est détectée à partir du texte : un cours en anglais peut être lu en anglais. Deux voix sont disponibles par langue. Choisis celle que tu préfères, commence à vitesse normale, puis appuie sur PARLE. Si un passage technique va trop vite, baisse la vitesse.",
        "Dans le cours d’exemple, écoute le calcul de la moyenne, puis fais une pause avant la réponse de l’exercice. Essaie de l’expliquer avec tes mots et vérifie ensuite dans le PDF. C’est une façon de te servir de l’audio pour réviser ; le laisser tourner ne permet pas, à lui seul, de vérifier que tu as compris.",
        "Tu peux revenir de 30 secondes, avancer dans la lecture ou reprendre après une pause. Pour retrouver le texte et ta position plus tard sur ce navigateur, ouvre le menu ⋯ puis MES COURS. Cette bibliothèque reste sur ton appareil : elle ne se synchronise pas avec ton téléphone."
      ],
      figure: { src: "/assets/guides/radio-cours.jpg", width: 1100, height: 850, alt: "La radio orange avec le cours Moyenne et médiane importé, les réglages de voix et de vitesse, le bouton PARLE et l’export MP3.", caption: "Une fois le texte prêt, choisis ta voix et ta vitesse. Le menu ⋯ regroupe les actions pour conserver ou partager le cours." }
    },
    {
      id: "emporter", title: "5. Prépare le MP3 avant de partir",
      paragraphs: [
        "Clique sur MP3 pour générer le fichier à emporter. La radio doit fabriquer l’audio : ce n’est pas seulement le téléchargement d’un fichier déjà prêt. Le premier chargement du moteur vocal et la préparation d’un long cours peuvent prendre du temps.",
        "Garde l’onglet ouvert jusqu’à la fin. Sur téléphone, évite de verrouiller l’écran pendant cette préparation. Pour un trajet, prépare le fichier à l’avance, puis ouvre-le dans ton lecteur audio habituel : le MP3 téléchargé fonctionne sans connexion.",
        "Les réglages de voix et de vitesse choisis sont utilisés pour l’export. Les outils de la radio, comme NETTOYER ou le choix des passages, servent à préparer le contenu avant l’export ; ils ne modifient pas un MP3 déjà téléchargé."
      ]
    },
    {
      id: "limites", title: "Quand garder le cours sous les yeux ?",
      paragraphs: [
        "Pour une liste de notions, un texte de droit ou une explication rédigée, essaie l’écoute et juge si elle te convient. Pour un schéma, une formule ou un tableau, garde le document à portée de main : entendre des nombres sans leur disposition peut faire perdre le sens.",
        "Les documents sont traités dans ton navigateur. Si tu choisis PARTAGER, une copie chiffrée du texte et des réglages est envoyée pour créer un lien valable sept jours. Toute personne qui possède ce lien peut ouvrir le cours : utilise-le uniquement pour du contenu que tu peux partager."
      ]
    }
  ]
}, {
  kind: "article",
  slug: "powerpoint-en-mp3",
  title: "Convertir un PowerPoint en MP3 pour réviser ses cours",
  h1: "Comment convertir un PowerPoint de cours en MP3",
  navLabel: "PowerPoint en MP3",
  description: "Transforme les diapos de ton cours PowerPoint (.pptx) en MP3 à écouter hors ligne, une diapo par chapitre. Ce que la voix lit, ce qu’elle laisse de côté.",
  published: "2026-10-31",
  updated: "2026-10-31",
  intro: "Ton prof a déposé son cours en PowerPoint et tu voudrais le réviser dans le bus ou en marchant. Avec speechsynthe.si, tu importes le fichier .pptx, la radio lit le texte de tes diapos et tu télécharges le MP3. C’est gratuit, sans compte, et ta présentation est lue sur ton appareil.",
  premise: "Un diaporama n’est pas un cours rédigé. La radio lit le texte écrit sur les diapos, mot pour mot : elle n’explique pas un schéma, ne lit pas les notes du présentateur et ne complète pas une puce de trois mots. Ce guide montre ce que tu vas vraiment entendre, pour que tu saches avant l’export si ton PowerPoint s’y prête.",
  related: [
    { href: "/ecouter-ses-cours/", label: "Écouter ses cours pour réviser", text: "la méthode pas à pas, avec un petit cours d’exemple en PDF à télécharger." },
    { href: "/pdf-en-audio/", label: "Lire un PDF à voix haute", text: "pour un cours en PDF, avec le choix des pages et la lecture des pages scannées." },
    { href: "/pdf-voix-haute-telephone/", label: "Lire un PDF à voix haute sur son téléphone", text: "choisir les pages du doigt et préparer le MP3 avant de partir." }
  ],
  sections: [
    {
      id: "ce-qui-est-lu", title: "Ce que la radio lit dans un fichier .pptx",
      paragraphs: [
        "La présentation est ouverte directement dans ton navigateur : elle est décompressée et lue sur ton appareil, sans être envoyée à un serveur. Chaque diapo qui contient du texte devient un chapitre, numéroté comme dans ta présentation. Tu passes ensuite d’une diapo à l’autre avec le sélecteur de chapitres, au lieu de chercher dans une longue piste audio.",
        "Le titre de la diapo est lu en premier, sur sa propre ligne, avec un court silence avant et après : tu entends où commence chaque partie. Viennent ensuite les zones de texte et les puces, puis les tableaux, lus ligne par ligne, les cellules d’une même ligne à la suite.",
        "Les zones réservées au numéro de diapo, à la date et au pied de page, celles que PowerPoint remplit avec « En-tête et pied de page », ne sont pas lues. Les diapos masquées non plus : elles sont sautées, et la numérotation des chapitres garde leur place. Une diapo sans texte n’a pas de chapitre."
      ]
    },
    {
      id: "ce-qui-manque", title: "Ce qu’elle ne lit pas : notes, images et graphiques",
      paragraphs: [
        "Les notes du présentateur ne sont pas lues. Si ton prof a mis ses explications dans les notes, sous les diapos, l’audio ne contiendra que les titres et les puces. Ouvre ton fichier et regarde où se trouve le texte avant de compter sur l’écoute.",
        "Les images, les graphiques et les SmartArt ne sont ni lus ni décrits. Le texte contenu dans une image, comme la capture d’une page de manuel, n’est pas reconnu : dans la radio, la reconnaissance de texte ne fonctionne que pour les PDF scannés. Un schéma fait de flèches reste muet, sauf si ses étiquettes sont écrites dans des formes ou des zones de texte.",
        "La radio ne résume pas et ne reformule pas. Un diaporama de mots-clés donne un audio de mots-clés : utile pour te remettre en tête un plan que tu connais déjà, moins pour découvrir une matière. Pour un cours plein de formules ou de courbes, garde les diapos sous les yeux et réserve l’écoute aux définitions et aux passages rédigés."
      ]
    },
    {
      id: "ordre", title: "L’ordre de lecture n’est pas toujours celui de l’écran",
      paragraphs: [
        "Sur une diapo, la radio suit l’ordre dans lequel les éléments sont empilés dans le fichier, de l’arrière-plan vers le premier plan, et non leur position à l’écran. Le titre passe d’abord, puis les zones de texte dans cet ordre, puis les tableaux en dernier. Un encadré ajouté après coup en haut de la diapo peut donc être lu après le texte du bas.",
        "Si l’ordre te gêne sur une diapo importante, tu peux le changer dans PowerPoint avec « Mettre au premier plan » ou « Mettre à l’arrière-plan », ou corriger le texte dans la radio (étape 3). Pour une diapo chargée, le plus sûr reste d’écouter les premières secondes de son chapitre."
      ]
    },
    {
      id: "importer", title: "1. Importe ton fichier .pptx",
      paragraphs: [
        "Ouvre la radio, clique sur IMPORTER ou glisse le fichier dessus. La radio accepte le format .pptx. Si ta présentation vient de Google Slides ou de Keynote, télécharge-la ou exporte-la d’abord en .pptx.",
        "Un ancien fichier .ppt est refusé avec le message « ENREGISTRE-LE EN .PPTX » : ouvre-le dans ton logiciel de présentation et enregistre-le au bon format. Une présentation protégée par un mot de passe doit être déverrouillée avant l’import. Les limites sont larges pour un cours : 100 Mo par fichier, 5 000 diapos et 2 millions de caractères.",
        "Après l’import, ouvre le sélecteur de chapitres : tu dois y retrouver tes diapos, une par ligne, avec leur titre. Le choix des passages avec PAGES n’existe que pour les PDF. Pour sauter des diapos d’un PowerPoint, masque-les dans ton logiciel avant l’import."
      ]
    },
    {
      id: "nettoyer", title: "2. Retire le pied de page répété avec NETTOYER",
      paragraphs: [
        "Beaucoup de cours ont le nom de l’école, de la matière ou de l’année tapé dans une simple zone de texte, sur chaque diapo. Ce texte-là est lu, à chaque fois. Quand la radio repère une ligne qui revient au début ou à la fin d’au moins la moitié des diapos, le bouton NETTOYER apparaît. Un clic retire ces répétitions, un second les remet. Ton fichier d’origine n’est pas modifié.",
        "Nous avons fait l’essai avec un petit cours fictif sur la photosynthèse : six diapos, dont une masquée, et un pied de page tapé à la main sur les cinq autres. NETTOYER l’a retiré partout, sauf sur la diapo qui contient un tableau : comme les tableaux sont lus en dernier, la ligne n’y était plus en fin de diapo. Après le nettoyage, jette un œil au texte, surtout autour des tableaux."
      ],
      figure: { src: "/assets/guides/radio-powerpoint.jpg", width: 1100, height: 850, alt: "La radio orange avec le diaporama photosynthese.pptx importé : le texte des premières diapos à l’écran, le chapitre 1 sélectionné et le bouton NETTOYÉ activé.", caption: "Le cours d’exemple après un clic sur NETTOYER : la radio indique « 1 répétition retirée », et le sélecteur de chapitres suit les diapos." }
    },
    {
      id: "corriger", title: "3. Corrige le texte seulement si c’est utile",
      paragraphs: [
        "Ouvre le menu ⋯, puis RELIRE LE TEXTE. Tu peux y corriger un nombre mal écrit, supprimer une ligne inutile ou remettre deux phrases dans le bon ordre, puis cliquer sur « Mettre dans la radio ».",
        "Dès que tu modifies le texte, la radio ne sait plus où commence chaque diapo : les chapitres par diapo sont remplacés par un découpage automatique, et le bouton NETTOYER disparaît. Fais donc le nettoyage d’abord et garde les corrections pour ce qui gêne vraiment l’écoute. Si tu ouvres cet écran sans rien changer, tes chapitres restent en place."
      ]
    },
    {
      id: "exporter", title: "4. Choisis la voix, puis télécharge le MP3",
      paragraphs: [
        "La langue est détectée à partir du texte : un cours en anglais est lu par une voix anglaise. Deux voix sont proposées par langue. La vitesse va de 0,7× à 1,5× : commence à vitesse normale, accélère pour une révision rapide ou ralentis pour un passage dense. Appuie sur PARLE pour écouter le premier chapitre avant de tout exporter.",
        "Clique ensuite sur MP3. La radio fabrique l’audio sur ton appareil, avec la voix et la vitesse choisies et le texte tel qu’il est à l’écran, nettoyage compris. Pour un long cours, cela peut prendre du temps : garde l’onglet ouvert et, sur téléphone, évite de verrouiller l’écran. Le fichier téléchargé s’écoute ensuite sans connexion, dans ton lecteur audio habituel.",
        "Pour retrouver le cours plus tard sur le même navigateur, ouvre le menu ⋯, puis MES COURS. Cette bibliothèque reste sur ton appareil : elle ne se synchronise pas avec ton téléphone."
      ]
    },
    {
      id: "pdf-ou-pptx", title: "PowerPoint ou PDF : quel fichier importer ?",
      paragraphs: [
        "Si tu as les deux versions d’un même cours, le .pptx donne directement un chapitre par diapo, avec son titre : c’est pratique pour naviguer pendant l’écoute. Le PDF permet en plus de choisir les passages à lire avec PAGES et de reconnaître le texte des pages scannées.",
        "Dans les deux cas, l’audio sert mieux la révision si tu l’écoutes par petits morceaux : un chapitre, une pause, puis ce que tu as retenu, dit avec tes mots. Le guide pour écouter ses cours détaille cette méthode, avec un exemple."
      ]
    }
  ]
}, {
  kind: "article",
  slug: "pdf-voix-haute-telephone",
  title: "Lire un PDF à voix haute sur son téléphone, sans app",
  h1: "Comment lire un PDF à voix haute sur son téléphone",
  navLabel: "PDF sur téléphone",
  description: "Ton cours PDF lu à voix haute sur ton téléphone, sans installer d’application : choisis les pages du doigt, écoute, puis garde le MP3 pour le trajet.",
  published: "2026-11-02",
  updated: "2026-11-02",
  intro: "Ton cours est un PDF sur ton téléphone et tu préférerais l’écouter plutôt que de le relire sur un petit écran. Pas besoin d’installer une application : speechsynthe.si s’ouvre dans le navigateur. Tu importes le PDF, la radio le lit à voix haute, et tu peux télécharger le MP3. C’est gratuit et sans compte.",
  premise: "La radio lit le texte du PDF tel qu’il est écrit : elle ne le résume pas, ne décrit pas les images et n’explique pas un schéma. Sur un téléphone, deux choses demandent un peu d’organisation : choisir les pages du bout du doigt, et préparer l’audio avant de ranger le téléphone dans ta poche. Ce guide montre comment faire, étape par étape.",
  related: [
    { href: "/pdf-en-audio/", label: "PDF en audio", text: "le mode d’emploi complet de la radio pour les PDF, avec les questions fréquentes." },
    { href: "/ecouter-ses-cours/", label: "Écouter ses cours pour réviser", text: "la méthode pour réviser avec l’audio, et un petit cours d’exemple à télécharger." },
    { href: "/powerpoint-en-mp3/", label: "Convertir un PowerPoint en MP3", text: "si ton cours est un diaporama .pptx plutôt qu’un PDF." }
  ],
  sections: [
    {
      id: "ouvrir", title: "1. Ouvre ton PDF depuis le téléphone",
      paragraphs: [
        "Va sur speechsynthe.si dans le navigateur de ton téléphone et appuie sur IMPORTER. Ton téléphone ouvre son propre sélecteur de fichiers : choisis le PDF là où il est rangé. La radio accepte aussi les PowerPoint au format .pptx. Le PDF est ouvert et son texte extrait sur ton appareil ; il n’est pas envoyé à un serveur pour produire la voix.",
        "Les limites sont larges : 100 Mo par fichier et 5 000 pages. Sur un téléphone, commence quand même par un chapitre ou quelques pages. Préparer l’audio demande du calcul, et un long cours prend du temps, surtout sur un téléphone. Un premier essai court te dit vite si la voix et le rythme te conviennent.",
        "Pas de cours sous la main ? La touche EXEMPLE, à côté d’IMPORTER, charge un mini-cours de deux pages sur la moyenne et la médiane, puis lance la lecture. Si tu comptes revenir souvent, ajoute le site à ton écran d’accueil depuis le menu de ton navigateur : il s’ouvrira alors comme une application, sans rien installer depuis un magasin d’applications."
      ]
    },
    {
      id: "pages", title: "2. Choisis les pages à écouter, du bout du doigt",
      paragraphs: [
        "Après l’import, le début du texte s’affiche dans l’écran de la radio. Si ton PDF a un texte sélectionnable, la touche PAGES ouvre le cours page par page. Choisis « À lire » ou « À sauter », touche le premier mot du passage, puis le dernier : tout ce qui se trouve entre les deux est surligné. La gomme retire un surlignage de la même façon.",
        "Sur un écran tactile, faire glisser le doigt fait défiler les pages et ne surligne rien. Tu peux donc parcourir tout le cours sans marquer un passage par erreur. Si tu ne marques rien, tout le texte est lu. Tu peux surligner seulement le chapitre de demain avec « À lire », ou garder tout le cours et passer la page de garde et la bibliographie en « À sauter ». Appuie ensuite sur « Revenir à la radio ».",
        "Si le nom de l’école ou du cours revient en haut ou en bas de chaque page, la radio le repère et affiche le bouton NETTOYER. Un clic retire ces répétitions, un second les remet. Sur le cours d’exemple, l’écran indique alors « 1 RÉPÉTITION RETIRÉE ». Ton fichier d’origine n’est jamais modifié."
      ],
      figure: { src: "/assets/guides/radio-telephone.jpg", width: 780, height: 1400, narrow: true, alt: "La radio orange sur un écran de téléphone : le cours d’exemple Moyenne et médiane importé, le premier chapitre à l’écran, les touches PAGES et NETTOYÉ, puis IMPORTER, EXEMPLE et EFFACE.", caption: "Le cours d’exemple sur un écran de téléphone, après un clic sur NETTOYER. Les touches PARLE et MP3 sont juste en dessous." }
    },
    {
      id: "scan", title: "3. Si ton PDF est fait de photos ou de pages scannées",
      paragraphs: [
        "Un PDF fait de photos de pages ou d’un polycopié passé au scanner n’a souvent aucun texte sélectionnable. Dans ce cas, l’écran de relecture s’ouvre tout seul après l’import. Ouvre « Texte en désordre ou incomplet ? », coche « Lire aussi les pages scannées », choisis le français ou l’anglais, puis appuie sur « Relire le PDF ».",
        "La reconnaissance du texte se fait sur ton téléphone, jusqu’à 50 pages par import. Elle peut prendre plusieurs minutes et se tromper, en particulier sur les nombres et les mots rares. Relis le résultat avant de l’écouter, corrige ce qui gêne, puis valide avec « Mettre dans la radio »."
      ]
    },
    {
      id: "voix", title: "4. Règle la voix, puis écoute un premier passage",
      paragraphs: [
        "Les commandes de la radio sont sous l’écran, avec PARLE et MP3 tout en bas. La langue est détectée dans le texte : un cours en anglais est lu par une voix anglaise, sans traduction. Il y a deux voix par langue, en français et en anglais. Le bouton rotatif change de voix et le curseur VITESSE règle le débit de 0,7× à 1,5×.",
        "Appuie sur PARLE. La première fois, la radio télécharge la voix sur ton téléphone : l’écran affiche « CHARGEMENT VOIX » avec un pourcentage. Ensuite, la voix reste dans le cache de ton navigateur. Si ton forfait mobile est limité, fais ce premier essai en wifi.",
        "Pendant l’écoute, les touches de 30 secondes te font reculer ou avancer, et la liste des chapitres, en bas de l’écran, t’emmène directement à une partie du cours. PARLE devient PAUSE, puis REPRENDRE."
      ]
    },
    {
      id: "ecran", title: "5. Le point à connaître : garde l’écran allumé",
      paragraphs: [
        "Dans le navigateur, la radio fabrique l’audio sur ton téléphone, au fur et à mesure. Garde donc l’onglet ouvert et évite de verrouiller l’écran pendant la préparation. Si tu passes à une autre application ou si l’écran se met en veille, la lecture et la préparation peuvent s’interrompre, selon ton téléphone et ton navigateur.",
        "Pour écouter avec le téléphone en poche, la bonne méthode est donc le MP3, décrit à l’étape suivante. Une fois téléchargé, c’est un fichier audio comme un autre, que tu écoutes dans ton lecteur habituel.",
        "Pour reprendre un cours plus tard, ouvre le menu ⋯, puis MES COURS, et appuie sur « Enregistrer ce cours ». Ta position est gardée quand tu quittes l’onglet, et ce cours revient à l’écran la prochaine fois que tu ouvres la radio. Cette bibliothèque reste sur ton téléphone : elle ne se synchronise pas avec ton ordinateur."
      ]
    },
    {
      id: "mp3", title: "6. Télécharge le MP3 avant de partir",
      paragraphs: [
        "Appuie sur MP3. La radio fabrique le fichier sur ton téléphone, avec la voix et la vitesse choisies, les passages retenus dans PAGES et le nettoyage. L’avancement s’affiche à l’écran en pourcentage. Le fichier porte le nom de la voix, par exemple speechsynthe-si-jessica.mp3, et arrive dans les téléchargements de ton navigateur.",
        "Pour un cours de plusieurs chapitres, lance l’export avant de quitter le wifi, écran allumé, et si possible téléphone branché. Une fois le MP3 téléchargé, il s’écoute sans connexion : dans le train, en marchant ou à la salle de sport.",
        "Tu peux aussi préparer le MP3 sur ordinateur, où corriger un long texte est plus confortable, puis copier le fichier sur ton téléphone comme n’importe quel fichier audio."
      ]
    },
    {
      id: "limites", title: "Quand le téléphone n’est pas le bon outil",
      paragraphs: [
        "Un tableau, une page à plusieurs colonnes ou une formule passent mal à l’oral : l’ordre de lecture peut être faux, et entendre des nombres sans leur disposition fait vite perdre le sens. Rien ne décrit une image ou un schéma. Pour ces passages, garde le PDF sous les yeux, ou marque-les « À sauter » et revois-les à part.",
        "L’écoute sert surtout aux passages rédigés : définitions, explications, textes à connaître. Écoute un chapitre, mets en pause et redis l’essentiel avec tes mots : c’est plus utile que de laisser tourner l’audio pendant une heure. Le guide pour écouter ses cours détaille cette méthode.",
        "Tes documents restent sur ton appareil. Si tu appuies sur PARTAGER, une copie chiffrée du texte et des réglages est envoyée pour créer un lien valable sept jours ; toute personne qui a ce lien peut ouvrir le cours. Réserve-le à un contenu que tu as le droit de partager."
      ]
    }
  ]
}];
