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
    { href: "/pdf-en-audio/", label: "Lire un PDF à voix haute", text: "pour un cours en PDF, avec le choix des pages et la lecture des pages scannées." }
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
    { href: "/pdf-en-audio/", label: "Lire un PDF à voix haute", text: "pour un cours en PDF, avec le choix des pages et la lecture des pages scannées." }
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
}];
