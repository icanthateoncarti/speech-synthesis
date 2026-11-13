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
    { href: "/pdf-voix-haute-telephone/", label: "Lire un PDF à voix haute sur son téléphone", text: "choisir les pages du doigt et préparer le MP3 avant de partir." },
    { href: "/temps-lecture-voix-haute/", label: "Combien de temps dure l’écoute d’un cours ?", text: "nos mesures avec les deux voix, et une table de 1 000 à 10 000 mots." },
    { href: "/cours-en-podcast/", label: "Transformer son cours en podcast", text: "podcast résumé par une IA ou cours lu mot pour mot : ce qui change, et comment faire un MP3 par chapitre." }
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
        "Les documents sont traités dans ton navigateur. Si tu choisis PARTAGER, une copie chiffrée du texte et des réglages est envoyée pour créer un lien valable sept jours. Toute personne qui possède ce lien peut ouvrir le cours : utilise-le uniquement pour du contenu que tu peux partager. Si tu choisis MP3 RAPIDE pour un long cours, le texte est envoyé à Microsoft Azure pour fabriquer le MP3 ; sinon, le MP3 est préparé sur ton appareil."
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
    { href: "/pdf-voix-haute-telephone/", label: "Lire un PDF à voix haute sur son téléphone", text: "choisir les pages du doigt et préparer le MP3 avant de partir." },
    { href: "/cours-en-podcast/", label: "Transformer son cours en podcast", text: "podcast résumé par une IA ou cours lu mot pour mot : ce qui change pour réviser." }
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
    { href: "/powerpoint-en-mp3/", label: "Convertir un PowerPoint en MP3", text: "si ton cours est un diaporama .pptx plutôt qu’un PDF." },
    { href: "/pdf-scanne-a-voix-haute/", label: "PDF scanné à voix haute", text: "le détail de la reconnaissance du texte, et les erreurs à corriger avant d’écouter." }
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
        "Tes documents restent sur ton appareil. Si tu appuies sur PARTAGER, une copie chiffrée du texte et des réglages est envoyée pour créer un lien valable sept jours ; toute personne qui a ce lien peut ouvrir le cours. Réserve-le à un contenu que tu as le droit de partager. Si tu choisis MP3 RAPIDE pour un long cours, le texte est envoyé à Microsoft Azure pour fabriquer le MP3 ; sinon, le MP3 est préparé sur ton appareil."
      ]
    }
  ]
}, {
  kind: "article",
  slug: "pdf-scanne-a-voix-haute",
  title: "PDF scanné à voix haute : faire reconnaître le texte",
  h1: "Comment faire lire à voix haute un PDF scanné",
  navLabel: "PDF scanné",
  description: "Polycopié passé au scanner ou photos de pages : fais reconnaître le texte sur ton appareil, corrige-le, puis écoute ton cours ou garde le MP3.",
  published: "2026-11-04",
  updated: "2026-11-04",
  intro: "Ton cours est un polycopié passé au scanner, ou une série de photos de pages réunies en PDF. Tu l’ouvres pour l’écouter et rien ne se passe : il n’y a pas de texte, seulement des images. Avec speechsynthe.si, tu peux faire reconnaître ce texte dans ton navigateur, le relire, puis l’écouter ou le télécharger en MP3. C’est gratuit et sans compte.",
  premise: "La reconnaissance du texte, qu’on appelle aussi OCR, transforme l’image d’une page en lettres. Elle se trompe parfois, surtout sur les nombres et les mots rares : la radio te montre donc le résultat avant de le lire. Pour ce guide, nous avons fabriqué un petit cours de biologie de trois pages, uniquement en images, et suivi le parcours sur un écran de téléphone. Les messages cités sont ceux qui s’affichent à l’écran.",
  related: [
    { href: "/pdf-en-audio/", label: "PDF en audio", text: "le mode d’emploi complet de la radio pour les PDF, avec les questions fréquentes." },
    { href: "/pdf-voix-haute-telephone/", label: "Lire un PDF à voix haute sur son téléphone", text: "choisir les pages du doigt et préparer le MP3 avant de partir." },
    { href: "/ecouter-ses-cours/", label: "Écouter ses cours pour réviser", text: "la méthode pour réviser avec l’audio, et un petit cours d’exemple à télécharger." }
  ],
  sections: [
    {
      id: "pourquoi", title: "Pourquoi un PDF scanné ne se lit pas tout seul",
      paragraphs: [
        "Un PDF créé depuis un traitement de texte contient du texte : tu peux le sélectionner, le copier, et la radio le lit directement. Un PDF sorti d’un scanner ou d’une application photo ne contient souvent qu’une image par page. Pour l’ordinateur, c’est une photo, pas des mots. Le test est simple : ouvre le PDF et essaie de sélectionner une phrase. Si rien ne se surligne, c’est un scan.",
        "La radio fait ce test pour toi, page par page : une page qui contient une image et presque aucun texte est considérée comme scannée. Un même PDF peut mélanger les deux, par exemple un cours imprimé avec quelques pages photocopiées au milieu. Les pages qui ont du texte sont lues normalement ; seules les pages scannées passent par la reconnaissance."
      ]
    },
    {
      id: "importer", title: "1. Importe le PDF : l’écran de relecture s’ouvre seul",
      paragraphs: [
        "Ouvre speechsynthe.si, sur ordinateur ou sur téléphone, et appuie sur IMPORTER, puis choisis ton PDF. Dès qu’il contient au moins une page scannée, la radio ouvre l’écran « Relire avant d’écouter » au lieu de lancer la lecture.",
        "Si tout le PDF est scanné, la zone de texte est vide et le bouton « Mettre dans la radio » reste grisé : il n’y a encore rien à lire. Si seules quelques pages sont scannées, le texte des autres pages est déjà là, mais celui des pages scannées manque. Dans les deux cas, ne valide pas tout de suite et passe à l’étape suivante. « Annuler » referme l’écran sans toucher à ce qui était déjà dans la radio."
      ]
    },
    {
      id: "reconnaitre", title: "2. Lance la reconnaissance du texte",
      paragraphs: [
        "En bas de l’écran, appuie sur « Texte en désordre ou incomplet ? » : les réglages s’ouvrent. Coche « Lire aussi les pages scannées (50 maximum) », puis choisis la « Langue des scans », Français ou Anglais. Appuie enfin sur « Relire le PDF ».",
        "La radio affiche « Lecture du PDF en cours… », puis « Reconnaissance de la page 1/3 sur cet appareil… », et ainsi de suite jusqu’à la dernière page. « Annuler » arrête l’opération et referme l’écran. À la fin, le message devient « Nouveau texte prêt. Vérifie surtout les noms, les nombres et les tableaux. » et le texte reconnu remplit la zone.",
        "Tout se passe sur ton appareil : ton PDF n’est envoyé à aucun serveur. La première fois, la radio télécharge le moteur de reconnaissance et le modèle de la langue choisie ; ils restent ensuite dans le cache du navigateur. La durée dépend du nombre de pages, de leur netteté et de ton appareil. Sur notre cours de trois pages nettes, quelques secondes ont suffi sur un ordinateur récent. Pour un long polycopié sur un téléphone, compte plusieurs minutes, garde l’écran allumé et, si ton forfait mobile est limité, fais le premier essai en wifi."
      ],
      figure: { src: "/assets/guides/relecture-scan.jpg", width: 780, height: 1688, narrow: true, alt: "L’écran sombre Relire avant d’écouter sur un téléphone : le texte reconnu du cours d’essai en haut, puis la case Lire aussi les pages scannées cochée, la langue Français et le bouton Relire le PDF.", caption: "Le cours d’essai juste après la reconnaissance. Les réglages occupent le bas de l’écran : un nouvel appui sur « Texte en désordre ou incomplet ? » les referme." }
    },
    {
      id: "corriger", title: "3. Relis et corrige le texte reconnu",
      paragraphs: [
        "Les réglages restent ouverts après la reconnaissance et cachent une partie du texte. Appuie de nouveau sur « Texte en désordre ou incomplet ? » pour les refermer : la zone de texte reprend toute la place, et tu peux corriger directement, comme dans un traitement de texte.",
        "Sur notre cours d’essai, les phrases et les accents sont bien passés, « photosynthèse » et « thylakoïdes » compris, tout comme « 12,5 % » et « 48 plants ». En revanche, « Groupe A » est devenu « Groupe À », « 1 190 cm2 » est devenu « 1190 cm2 », et « Groupe D : 1 107 cm2 » a été coupé en deux lignes, « Groupe » puis « D :1107 cm2 ». À l’oral, « Groupe À » s’entend « groupe à », et un chiffre faux ne se remarque pas en écoutant. Relis donc d’abord les nombres, les noms propres et les tableaux.",
        "Retire aussi ce qui revient sur chaque page. NETTOYER n’est pas proposé après une reconnaissance : sur l’essai, la ligne « Cours de biologie — page 1 sur 3 » était lue à la fin de chaque page, avec son numéro. Supprime ces lignes à la main, comme les suites de signes sans sens que la reconnaissance ajoute parfois ; lors d’un de nos essais, « ° PA) 2 » est apparu juste avant un titre.",
        "Garde les titres seuls sur leur ligne : la radio marque une courte pause autour d’eux. Sur l’essai, les trois titres « Chapitre … » sont devenus les trois chapitres du sélecteur. Les lignes coupées par la largeur de la page sont recollées : une ligne qui continue en minuscule est rattachée à la précédente, pour que la voix ne s’arrête pas au milieu d’une phrase. Quand le texte te convient, appuie sur « Mettre dans la radio »."
      ]
    },
    {
      id: "ecouter", title: "4. Écoute, puis télécharge le MP3",
      paragraphs: [
        "Le texte reconnu est maintenant dans la radio, sous le nom de ton fichier. Il se lit comme n’importe quel cours : la langue de la voix est détectée dans le texte, tu choisis l’une des deux voix, tu règles la vitesse de 0,7× à 1,5×, puis tu appuies sur PARLE. Le sélecteur de chapitres t’emmène directement à une partie.",
        "Pour écouter sans connexion, appuie sur MP3 : la radio fabrique le fichier sur ton appareil, avec la voix et la vitesse choisies, puis le télécharge. Garde l’onglet ouvert pendant la préparation. Pour ne pas refaire la reconnaissance plus tard, ouvre le menu ⋯, puis MES COURS, et appuie sur « Enregistrer ce cours » : le texte corrigé reste sur ce navigateur.",
        "Après une reconnaissance, PAGES, qui sert à surligner les passages à lire dans un PDF au texte sélectionnable, n’est pas proposé. Pour sauter une partie, supprime-la dans l’écran de relecture, que tu rouvres avec le menu ⋯ puis RELIRE LE TEXTE, ou importe seulement les pages utiles."
      ]
    },
    {
      id: "long", title: "Un long polycopié : la limite des 50 pages",
      paragraphs: [
        "La reconnaissance traite au plus 50 pages scannées par import. Au-delà, les pages scannées suivantes ne sont pas lues, et l’écran le signale par un message qui commence par « Document limité ». Les pages qui contiennent déjà du texte ne comptent pas dans ces 50.",
        "Pour un syllabus de 120 pages scannées, découpe-le en parties de 50 pages au plus : la plupart des lecteurs PDF savent enregistrer ou imprimer une sélection de pages au format PDF. Importe ensuite chaque partie, corrige-la, puis enregistre-la dans MES COURS. Chaque import remplace le texte de la radio, mais la bibliothèque garde jusqu’à 20 cours sur ton appareil.",
        "Commencer par un seul chapitre a un autre avantage : tu vois tout de suite si la qualité du scan suffit, avant d’y passer une soirée."
      ]
    },
    {
      id: "limites", title: "Ce que la reconnaissance ne sait pas faire",
      paragraphs: [
        "Elle lit le texte imprimé, en français ou en anglais. Elle n’est pas faite pour l’écriture à la main : des notes manuscrites donnent peu de texte utilisable, ou un texte faux. Une page photographiée de travers, floue ou à moitié dans l’ombre donne aussi beaucoup d’erreurs. Si tu scannes toi-même, pose la page bien à plat, sous une bonne lumière, et cadre-la en entier.",
        "Les images, les schémas et les graphiques ne sont ni lus ni décrits. Un tableau scanné devient du texte à plat, et son ordre de lecture peut être faux : garde le document sous les yeux pour ces passages. Le réglage « Ordre de lecture » vaut pour les pages qui ont déjà du texte ; sur une page scannée, c’est la reconnaissance qui décide de l’ordre, alors vérifie les pages à deux colonnes.",
        "Enfin, la reconnaissance ne fonctionne que sur les PDF. Si ton PowerPoint est fait de captures d’écran, exporte-le d’abord en PDF depuis ton logiciel de présentation, puis importe ce PDF."
      ]
    }
  ]
}, {
  kind: "article",
  slug: "temps-lecture-voix-haute",
  title: "Temps de lecture à voix haute par une voix de synthèse",
  h1: "Combien de temps dure l’écoute d’un cours lu par une voix de synthèse ?",
  navLabel: "Durée d’écoute",
  description: "Mesuré sur un cours de 669 mots : 188 mots par minute avec la voix Jessica, 175 avec Tom. Durées de 1 000 à 10 000 mots et effet de la vitesse.",
  published: "2026-11-09",
  updated: "2026-11-09",
  tocTitle: "Dans cette page",
  intro: "Avant de transformer un cours en audio, une question revient : combien de temps va durer l’écoute ? Nous avons mesuré la réponse avec les deux voix de synthèse françaises de speechsynthe.si, sur un texte de cours écrit pour l’occasion. Cette page donne les chiffres obtenus, la méthode, et une table pour estimer la durée de ton propre cours.",
  premise: "Ces chiffres valent pour des voix de synthèse, pas pour une personne qui lit à voix haute : une voix humaine a son propre rythme, qui change d’un lecteur à l’autre. Ils valent aussi pour nos textes et notre appareil. Un cours rempli de nombres ou de listes ne se lit pas au même rythme qu’un texte rédigé, et nous le montrons plus bas.",
  related: [
    { href: "/ecouter-ses-cours/", label: "Écouter ses cours pour réviser", text: "la méthode pour réviser avec l’audio, et un petit cours d’exemple à télécharger." },
    { href: "/pdf-en-audio/", label: "PDF en audio", text: "le mode d’emploi complet de la radio pour les PDF, avec le choix des pages." },
    { href: "/powerpoint-en-mp3/", label: "Convertir un PowerPoint en MP3", text: "ce que la radio lit dans un diaporama .pptx, et ce qu’elle laisse de côté." },
    { href: "/pdf-voix-haute-telephone/", label: "Lire un PDF à voix haute sur son téléphone", text: "préparer le MP3 avant de partir, sans installer d’application." }
  ],
  sample: { href: "/assets/guides/texte-mesure-duree.txt", label: "Télécharger le texte mesuré (TXT, 669 mots)", description: "Le texte de cours écrit pour cette mesure, sur la mémoire et les révisions. Colle-le dans la radio pour refaire le test sur ton appareil et comparer la durée affichée." },
  sections: [
    {
      id: "reponse", title: "La réponse courte",
      paragraphs: [
        "À vitesse normale (1,0×), la voix Jessica de speechsynthe.si lit un cours rédigé en français à environ 188 mots par minute, et la voix Tom à environ 175 mots par minute.",
        "Un texte de cours de 669 mots donne 3 min 34 s d’audio avec Jessica et 3 min 49 s avec Tom. À ce rythme, 1 000 mots représentent un peu plus de 5 minutes d’écoute, et 5 000 mots entre 27 et 29 minutes.",
        "Un exercice plein de nombres se lit plus lentement : 144 mots par minute avec Jessica et 133 avec Tom, soit environ un quart de mots en moins par minute que le texte rédigé.",
        "Le curseur de vitesse ne divise pas la durée autant que son chiffre le laisse penser : à 1,5×, l’écoute dure environ 26 % de moins avec Jessica et 29 % de moins avec Tom, et non un tiers de moins."
      ]
    },
    {
      id: "methode", title: "Comment nous avons mesuré",
      paragraphs: [
        "Nous avons écrit deux textes originaux. Le premier est un cours rédigé de 669 mots sur la mémoire et les révisions, en neuf paragraphes, sans titre ni liste. Le second est un exercice corrigé de statistique de 258 mots, avec une série de notes, une moyenne, une médiane et une étendue. Les deux sont publiés en fichiers texte : speechsynthe.si/assets/guides/texte-mesure-duree.txt et speechsynthe.si/assets/guides/texte-mesure-duree-chiffres.txt.",
        "Chaque texte a été lu par la radio dans Google Chrome, sur un Mac, avec le même moteur que celui du site en ligne le 9 novembre 2026. Nous avons mesuré la durée exacte de l’audio produit, celui qui est placé dans le MP3 quand tu appuies sur MP3. Pour le vérifier, un des enregistrements a été exporté en MP3 : sa durée ne différait de celle de l’audio que de 0,08 seconde.",
        "Les mots sont comptés comme dans un traitement de texte : une suite de caractères entre deux espaces compte pour un mot, à condition de contenir une lettre ou un chiffre. « L’encodage » et « 13,5 » comptent donc chacun pour un mot, et un point-virgule isolé ne compte pas.",
        "Le cours de 669 mots a été lu deux fois à vitesse normale avec chaque voix. Les deux durées obtenues diffèrent de 1,5 seconde avec Jessica et de 0,3 seconde avec Tom : la synthèse n’est pas tout à fait identique d’une fois à l’autre, mais l’écart reste inférieur à 1 %. Les autres vitesses n’ont été mesurées qu’une fois."
      ]
    },
    {
      id: "vitesse-normale", title: "À vitesse normale : 188 et 175 mots par minute",
      paragraphs: [
        "Jessica lit plus vite que Tom : sur le même cours, son audio est plus court d’environ 15 secondes. Aucune des deux voix n’est meilleure dans l’absolu ; si tu as du mal à suivre l’une, essaie l’autre avant de toucher à la vitesse.",
        "Les durées ci-dessous sont celles qui ont été mesurées, sans calcul. Le débit est le nombre de mots du texte divisé par la durée de l’audio."
      ],
      table: {
        caption: "Durées mesurées le 9 novembre 2026 (moyenne des deux passages à 1,0× pour le cours rédigé)",
        head: ["Texte et voix", "Vitesse", "Durée de l’audio", "Mots par minute"],
        rows: [
          ["Cours rédigé (669 mots), Jessica", "1,0×", "3 min 34 s", "188"],
          ["Cours rédigé (669 mots), Tom", "1,0×", "3 min 49 s", "175"],
          ["Exercice chiffré (258 mots), Jessica", "1,0×", "1 min 47 s", "144"],
          ["Exercice chiffré (258 mots), Tom", "1,0×", "1 min 56 s", "133"]
        ]
      }
    },
    {
      id: "ton-cours", title: "Combien de minutes pour ton cours ?",
      paragraphs: [
        "Le nombre de pages ne suffit pas pour prévoir la durée : une diapositive peut contenir dix mots, une page de syllabus en contenir plusieurs centaines. Notre cours d’exemple de deux pages, celui du guide pour écouter ses cours, compte environ 270 mots, soit à peine une minute et demie d’écoute. Mieux vaut partir du nombre de mots.",
        "Pour le connaître, ouvre ton cours dans un traitement de texte : Word l’affiche dans la barre du bas, et Google Docs dans le menu Outils, puis Nombre de mots. Pour un PDF, copie une page représentative dans l’un de ces logiciels, compte ses mots, puis multiplie par le nombre de pages.",
        "La table ci-dessous applique les débits mesurés sur le cours rédigé. Ce sont des calculs, pas des mesures : compte un peu plus si ton cours contient beaucoup de nombres, de formules ou de listes."
      ],
      table: {
        caption: "Durée d’écoute calculée à partir des débits mesurés (arrondie à la minute)",
        head: ["Longueur du cours", "Jessica 1,0×", "Tom 1,0×", "Jessica 1,5×", "Tom 1,5×"],
        rows: [
          ["1 000 mots", "5 min", "6 min", "4 min", "4 min"],
          ["3 000 mots", "16 min", "17 min", "12 min", "12 min"],
          ["5 000 mots", "27 min", "29 min", "20 min", "20 min"],
          ["10 000 mots", "53 min", "57 min", "40 min", "41 min"]
        ]
      }
    },
    {
      id: "chiffres", title: "Les nombres ralentissent l’écoute",
      paragraphs: [
        "Sur l’exercice de statistique, le débit tombe à 144 mots par minute avec Jessica et à 133 avec Tom. La raison tient à l’écart entre l’écrit et l’oral : « 145,5 » compte pour un seul mot à l’écrit, mais il en faut quatre pour le dire à voix haute : « cent quarante-cinq virgule cinq ». Les nombres prennent donc plus de temps que leur place sur la page.",
        "Pour un cours de statistique, de gestion ou de physique, compte environ un tiers de temps en plus que dans la table précédente. C’est aussi le genre de passage où l’écoute seule montre ses limites : entendre une suite de notes ne permet pas de voir le tableau. Garde le document sous les yeux pour ces parties, ou écoute-les à une vitesse plus basse."
      ]
    },
    {
      id: "curseur", title: "Le curseur de vitesse : 1,5× ne divise pas le temps par 1,5",
      paragraphs: [
        "Le curseur VITESSE de la radio va de 0,7× à 1,5×, par pas de 0,1. Sur le cours rédigé, voici ce que nous avons mesuré. Avec Jessica : 4 min 37 s à 0,7× (145 mots par minute), 3 min 12 s à 1,2× (209 mots par minute) et 2 min 39 s à 1,5× (253 mots par minute). Avec Tom : 5 min 16 s à 0,7× (127 mots par minute), 3 min 17 s à 1,2× (204 mots par minute) et 2 min 43 s à 1,5× (247 mots par minute).",
        "Passer de 1,0× à 1,5× fait donc gagner environ un quart du temps d’écoute, pas un tiers. À 0,7×, l’audio dure 30 % de plus avec Jessica et 38 % de plus avec Tom. À vitesse rapide, les deux voix se rapprochent : 4 secondes d’écart seulement à 1,5×, contre 15 à vitesse normale.",
        "Si tu découvres un cours, commence à 1,0×. Une vitesse plus haute convient mieux pour repasser un chapitre que tu connais déjà. Les réglages de voix et de vitesse choisis au moment d’appuyer sur MP3 sont ceux du fichier téléchargé : pour changer de vitesse après coup, il faut refaire l’export, ou utiliser la vitesse de lecture de ton lecteur audio s’il en propose une."
      ]
    },
    {
      id: "estimation", title: "La durée affichée par la radio",
      paragraphs: [
        "Pendant la lecture, la radio affiche la durée totale, précédée d’un « ~ » tant que tout l’audio n’est pas prêt. Au tout début, avant le premier passage, elle ne connaît que la longueur du texte et compte environ 14 caractères par seconde. Pour notre cours rédigé de 4 024 caractères, cela donne une première estimation de 4 min 47 s, plus longue que la durée réelle, 3 min 34 s avec Jessica et 3 min 49 s avec Tom.",
        "Dès que les premiers passages sont prêts, la radio recalcule la durée à partir de l’audio déjà produit. Dans notre essai avec Jessica, sur un ordinateur, l’affichage est passé de « ~4:47 » à « ~3:44 » dès le premier passage, a oscillé quelques secondes autour de 3:40, puis s’est fixé sur « 3:34 », sans « ~ », une fois tout l’audio prêt, en moins de 25 secondes. Quand le « ~ » disparaît, la durée affichée est exacte. Si tu veux savoir combien de temps prendra ton cours, attends donc quelques secondes après avoir appuyé sur PARLE."
      ]
    },
    {
      id: "limites", title: "Ce que ces chiffres ne disent pas",
      paragraphs: [
        "Ils reposent sur deux textes, une machine et une seule date. Un autre cours, avec plus de titres, de listes ou de mots anglais, peut donner un débit un peu différent ; les titres, par exemple, sont entourés d’une courte pause. La durée de l’audio ne devrait guère changer d’un appareil à l’autre, puisque le moteur est le même, mais nous ne l’avons mesurée que sur un Mac. Le temps de préparation, lui, dépend beaucoup de l’appareil : sur un téléphone, fabriquer le MP3 d’un long cours prend plus de temps que sur un ordinateur.",
        "Ils ne disent rien de ce que tu retiens. Une heure d’écoute n’équivaut pas à une heure d’étude : l’audio permet de repasser la matière, mais pour vérifier que tu sais, il faut encore essayer de la retrouver sans support. Les deux textes de la mesure sont publiés pour que chacun puisse refaire le test et comparer."
      ]
    }
  ]
}, {
  kind: "article",
  slug: "cours-en-podcast",
  title: "Transformer son cours en podcast : résumé IA ou cours lu ?",
  h1: "Transformer son cours en podcast : deux façons très différentes",
  navLabel: "Cours en podcast",
  description: "Un « podcast » de cours peut être un dialogue d’IA qui résume, ou ton cours lu mot pour mot. Comment faire le second, gratuitement, un MP3 par chapitre.",
  published: "2026-11-13",
  updated: "2026-11-13",
  tocTitle: "Dans cette page",
  intro: "Tu voudrais réviser ton cours en l’écoutant, comme un podcast, dans le train ou en marchant. En cherchant comment le transformer, tu tombes surtout sur des outils d’intelligence artificielle qui fabriquent une émission à deux voix à partir de ton PDF. C’est une possibilité. Il en existe une autre : faire lire ton cours tel qu’il est écrit, et l’emporter en MP3. Ce guide explique la différence, puis montre comment faire la seconde avec speechsynthe.si, gratuitement et sans compte.",
  premise: "Les deux approches ne donnent pas le même fichier et ne servent pas au même moment de l’étude. Un podcast généré par une IA raconte ton cours avec ses propres mots. Une voix de synthèse qui lit ton cours n’ajoute et ne retire rien. Aucune n’est meilleure dans l’absolu : tout dépend de ce que tu dois savoir le jour de l’examen.",
  related: [
    { href: "/ecouter-ses-cours/", label: "Écouter ses cours pour réviser", text: "la méthode pas à pas, avec un petit cours d’exemple en PDF à télécharger." },
    { href: "/powerpoint-en-mp3/", label: "Convertir un PowerPoint en MP3", text: "ce que la radio lit dans un diaporama .pptx, et ce qu’elle laisse de côté." },
    { href: "/temps-lecture-voix-haute/", label: "Combien de temps dure l’écoute d’un cours ?", text: "nos mesures : environ 5 minutes d’écoute pour 1 000 mots." },
    { href: "/pdf-voix-haute-telephone/", label: "Lire un PDF à voix haute sur son téléphone", text: "choisir les pages du doigt et préparer le MP3 avant de partir." }
  ],
  sections: [
    {
      id: "deux-choses", title: "« Podcast de cours » : deux choses sous le même nom",
      paragraphs: [
        "Le premier type, c’est le podcast généré. Tu donnes ton cours à un outil d’intelligence artificielle, il le lit, en tire l’essentiel et produit une discussion entre deux voix, comme une émission de radio. NotebookLM, de Google, est le plus connu ; beaucoup d’autres outils proposent la même idée.",
        "Le second type, c’est le cours lu. Une voix de synthèse prononce le texte de ton PDF ou de ton PowerPoint, du premier au dernier mot, dans l’ordre. Il n’y a pas d’animateur, pas de musique, pas de reformulation : c’est ton cours, à l’oral. C’est ce que fait speechsynthe.si.",
        "La différence compte parce qu’elle change ce que tu entends. Avec le premier, tu écoutes ce qu’une IA a retenu de ton cours. Avec le second, tu écoutes ton cours."
      ]
    },
    {
      id: "podcast-genere", title: "Ce que fait un podcast généré par une IA",
      paragraphs: [
        "D’après la page d’aide de NotebookLM consultée le 13 novembre 2026, ses « aperçus audio » sont par défaut une conversation entre deux animateurs IA à partir des sources que tu ajoutes. D’autres formats existent : un « Briefing » plus court, présenté par une seule voix, une « Critique » et un « Débat ». Tu peux régler la longueur et télécharger le fichier audio. Il faut un compte Google, et ton cours est envoyé chez Google pour être analysé.",
        "Google prévient lui-même que ces aperçus audio sont générés par IA et peuvent contenir des inexactitudes. C’est logique : pour résumer, l’outil choisit ce qui lui semble important, reformule et relie les idées entre elles. Il peut laisser de côté le détail que ton professeur juge essentiel, ou dire une chose un peu différente de ton syllabus sans que tu t’en rendes compte à l’oreille.",
        "Ce format a de vrais atouts. Une discussion vivante est agréable à écouter, et une vue d’ensemble aide à entrer dans une matière que tu ne connais pas encore. Pour un premier contact avec un chapitre, ou pour te remettre en tête le plan général, il peut très bien convenir."
      ]
    },
    {
      id: "cours-lu", title: "Pourquoi écouter ton cours mot pour mot",
      paragraphs: [
        "À l’examen, on te demande souvent ce qui est écrit dans ton cours, et pas une version approchée : une définition précise, les étapes d’un raisonnement dans le bon ordre, les conditions d’un article de loi, une liste à connaître en entier. Pour ces contenus-là, un résumé ne suffit pas. Il faut réentendre les mots exacts.",
        "C’est le rôle du cours lu. La radio de speechsynthe.si ne résume pas et ne reformule pas : une définition reste une définition, une liste de sept éléments reste une liste de sept éléments. Ce que tu entends est exactement ce que tu reliras dans ton PDF. Si une phrase te paraît étrange, c’est qu’elle l’est dans le cours, pas dans l’audio.",
        "L’inconvénient est la durée. Un cours lu en entier dure plus longtemps qu’un résumé : dans nos mesures, la voix Jessica lit environ 188 mots par minute, soit un peu plus de 5 minutes d’écoute pour 1 000 mots. Un chapitre de 3 000 mots donne donc un épisode d’environ un quart d’heure. C’est pour cela que le découpage en épisodes, plus bas, est utile."
      ]
    },
    {
      id: "comparer", title: "Les deux formats côte à côte",
      paragraphs: [
        "Le tableau résume ce qui distingue les deux approches. La colonne de gauche s’appuie sur la page d’aide de NotebookLM ; d’autres générateurs de podcast peuvent fonctionner un peu autrement."
      ],
      table: {
        caption: "Podcast généré par une IA et cours lu par une voix de synthèse",
        head: ["Critère", "Podcast généré (exemple : NotebookLM)", "Cours lu (speechsynthe.si)"],
        rows: [
          ["Ce que tu entends", "Une discussion qui résume et reformule ton cours", "Le texte de ton cours, dans l’ordre, sans ajout"],
          ["Voix", "Deux animateurs par défaut, une seule pour le Briefing", "Une voix, au choix parmi deux par langue (français, anglais)"],
          ["Exactitude", "Peut contenir des inexactitudes, selon Google", "Les mots de ton document ; vérifie seulement l’extraction du texte"],
          ["Durée", "Réglable, plus courte que le cours", "Celle du texte : environ 5 minutes pour 1 000 mots"],
          ["Compte et envoi", "Compte Google ; le cours est envoyé chez Google", "Sans compte ; le texte est lu sur ton appareil"],
          ["Usage conseillé", "Découvrir une matière, avoir une vue d’ensemble", "Mémoriser le contenu exact avant l’examen"]
        ]
      }
    },
    {
      id: "preparer", title: "1. Prépare le cours à transformer",
      paragraphs: [
        "Ouvre speechsynthe.si et appuie sur IMPORTER. La radio accepte les PDF et les PowerPoint au format .pptx. Un ancien fichier .ppt est refusé avec le message « ENREGISTRE-LE EN .PPTX ». Un document Word est refusé avec « CHOISIS UN PDF OU UN PPTX » : enregistre-le d’abord en PDF depuis ton traitement de texte.",
        "Ensuite, retire ce qui gâcherait l’écoute. Si le nom de l’école ou du cours revient sur chaque page, le bouton NETTOYER apparaît et retire ces répétitions en un clic. Avec un PDF, PAGES te permet de marquer la page de garde, le sommaire ou la bibliographie « À sauter ». Si ton PDF est scanné, la radio peut en reconnaître le texte, jusqu’à 50 pages par import ; relis-le avant d’écouter, car la reconnaissance se trompe parfois sur les nombres.",
        "Pour un diaporama, chaque diapo devient un chapitre, avec son titre. Les notes du présentateur ne sont pas lues : si ton professeur a mis ses explications dans les notes, l’audio ne contiendra que les puces des diapos."
      ]
    },
    {
      id: "episodes", title: "2. Découpe-le en épisodes",
      paragraphs: [
        "Un fichier de deux heures est difficile à utiliser. Comme pour un vrai podcast, mieux vaut des épisodes courts : un chapitre par fichier, de 10 à 20 minutes. Tu sais ainsi où tu en es, et tu peux réécouter seulement la partie qui te pose problème.",
        "Avec un PDF au texte sélectionnable, ouvre PAGES, choisis « À lire », puis clique ou touche le premier mot du chapitre et le dernier : seul ce passage sera lu et mis dans le MP3. Reviens à la radio, exporte, puis recommence avec le chapitre suivant. Avec un PowerPoint, masque dans ton logiciel les diapos que tu ne veux pas dans l’épisode avant l’import, ou découpe ton fichier en plusieurs parties.",
        "Chaque MP3 téléchargé porte le nom de la voix, par exemple speechsynthe-si-jessica.mp3. Renomme-le tout de suite, par exemple « Droit civil 03 - Les contrats.mp3 » : tu retrouveras tes épisodes dans l’ordre, sans confondre deux fichiers qui portent le même nom."
      ]
    },
    {
      id: "mp3", title: "3. Choisis la voix et fabrique le MP3",
      paragraphs: [
        "La langue est détectée dans le texte : un cours en anglais est lu par une voix anglaise. Il y a deux voix par langue. Appuie sur PARLE pour écouter le début, puis règle la vitesse entre 0,7× et 1,5×. Pour une matière que tu découvres, reste à 1,0× ; pour repasser un chapitre déjà connu, une vitesse plus haute fait gagner environ un quart du temps à 1,5×.",
        "Appuie ensuite sur MP3. Par défaut, la radio fabrique l’audio sur ton appareil : garde l’onglet ouvert et, sur téléphone, l’écran allumé jusqu’à la fin. Pour un long chapitre, la radio peut te proposer MP3 RAPIDE, qui prépare le fichier en quelques secondes avec une voix proche. Dans ce cas, ton texte est envoyé à Microsoft Azure pour fabriquer l’audio. C’est à toi de choisir, à chaque export ; « Sur mon appareil » garde le texte chez toi.",
        "Le fichier obtenu est un MP3 ordinaire. Il s’écoute sans connexion, dans le lecteur audio de ton téléphone ou de ton ordinateur."
      ]
    },
    {
      id: "ecouter", title: "4. Écoute-le comme un épisode, pas comme un fond sonore",
      paragraphs: [
        "Un cours lu ne remplace pas l’étude. Laisser tourner l’audio pendant une heure donne l’impression de travailler, mais ne prouve pas que tu as retenu. Écoute un épisode, mets en pause, puis redis l’essentiel avec tes mots, sans regarder. Vérifie ensuite dans ton cours ce que tu as oublié.",
        "Certains passages ne gagnent rien à l’oral. Un tableau, un schéma ou une formule perdent leur sens sans leur disposition : la radio ne décrit pas les images, et une suite de nombres s’écoute mal. Marque ces pages « À sauter » et revois-les sur papier.",
        "Rien n’empêche de combiner les deux formats. Un podcast généré peut t’aider à entrer dans un chapitre la première semaine, et ton cours lu à le fixer mot pour mot avant l’examen. Garde simplement en tête que seul le second contient exactement ce que ton professeur a écrit."
      ]
    }
  ]
}];
