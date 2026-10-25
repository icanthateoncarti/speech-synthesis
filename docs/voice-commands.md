# Commandes vocales locales

`src/voice-commands.js` interprète les commandes françaises et pilote une capture
courte avec l'API vocale locale du navigateur. Les commandes peuvent aussi être
écrites : leur analyse est une fonction JavaScript sans dépendance.

## Contrat d'intégration

```js
const voice = createVoiceCommands({
  onCommand(command, transcript) {},
  onState(state) {},
  onError(error) {}, // Error avec code et message français
});
```

- `supported()` vérifie le contexte sécurisé, `SpeechRecognition.available` et
  l'existence de `processLocally` sur l'instance. Cela ne garantit pas que le pack
  français soit disponible sur cet appareil.
- `availability()` vérifie uniquement le pack `fr-FR` local.
- `prepare()` installe le pack local s'il peut être téléchargé, sans microphone.
- `start()` traite une seule commande. Il rend `true` si la capture démarre. Si le
  pack vient d'être installé, il rend `false` avec l'état `ready` : un second clic
  est nécessaire, pour garder l'ouverture du microphone liée à une action claire.
- `stop()` annule et ignore les résultats tardifs. `finish()` termine la capture
  et conserve son résultat éventuel. `dispose()` annule définitivement.
- États : `idle`, `checking`, `downloading`, `ready`, `starting`, `listening`,
  `unsupported`, `unavailable`, `error`.

Le lecteur doit être mis en pause pendant la capture pour éviter que sa propre
voix déclenche une commande. L'état `ready` peut précéder l'ouverture du micro
pendant `start()` ; ce n'est pas un signal de reprise du lecteur. Reprendre après
`start() === false`, ou après la fin effective de la capture (`idle`), en tenant
compte d'une commande explicite de pause.

## Commandes interprétées

- `relative-time` avec `seconds` : « reviens trente secondes en arrière »,
  « avance de cinq minutes ».
- `relative-sentence` avec `count` : « reviens trois phrases », « avance de six phrases ».
- `relative-chapter` avec `count` : « reviens au précédent chapitre »,
  « skip jusqu'aux trois prochains chapitres ».
- `chapter-start` : « recommence le chapitre ».
- `pause` et `resume` : « pause », « attends », « reprends la lecture ».

Les chiffres et les nombres écrits en français sont acceptés, y compris les
formes belges « septante » et « nonante ». Une phrase ordinaire ou une demande
ambiguë ne déclenche pas d'action.

## Confidentialité et compatibilité

La reconnaissance est toujours configurée avec `processLocally = true`, avant
`start()`. Aucune capture n'est lancée si la propriété manque ou refuse cette
valeur. Il n'y a aucun repli vers le service distant, ni vers le constructeur
historique préfixé. Le téléchargement initial du pack est géré par le navigateur
et n'est pas un envoi de l'audio.

Cette API est expérimentale et n'est pas disponible dans tous les navigateurs.
Safari, notamment sur iPhone, ne fournit pas cette interface locale dans les
données de compatibilité consultées le 2026-10-25. Les contrôles visuels, le clavier
et la commande écrite doivent donc rester disponibles. Le français lui-même est
vérifié à l'exécution, sans supposer qu'un navigateur qui expose l'API possède le
pack requis.

Références primaires consultées :

- [Spécification Web Speech API](https://webaudio.github.io/web-speech-api/#dom-speechrecognition-processlocally)
- [MDN : processLocally](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally)
- [MDN : available()](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/available_static)
- [MDN : install()](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/install_static)
