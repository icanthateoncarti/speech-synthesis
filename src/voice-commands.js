// Commandes courtes, reconnues sur l'appareil uniquement. Ce module n'utilise
// jamais le service distant de SpeechRecognition ni une écoute permanente.

const UNITS = new Map([
  ["zero", 0], ["un", 1], ["une", 1], ["deux", 2], ["trois", 3],
  ["quatre", 4], ["cinq", 5], ["six", 6], ["sept", 7], ["huit", 8],
  ["neuf", 9], ["dix", 10], ["onze", 11], ["douze", 12],
  ["treize", 13], ["quatorze", 14], ["quinze", 15], ["seize", 16],
]);
const TENS = new Map([
  ["vingt", 20], ["trente", 30], ["quarante", 40], ["cinquante", 50],
  ["soixante", 60], ["septante", 70], ["huitante", 80], ["nonante", 90],
]);

function smallNumber(words) {
  if (!words.length) return 0;
  if (words.length === 1) return UNITS.get(words[0]) ?? TENS.get(words[0]) ?? null;
  if (words[0] === "quatre" && words[1] === "vingt") {
    const rest = smallNumber(words.slice(2));
    return rest !== null && rest < 20 ? 80 + rest : null;
  }
  if (words[0] === "dix" && words.length === 2) {
    const rest = UNITS.get(words[1]);
    return rest >= 1 && rest <= 9 ? 10 + rest : null;
  }
  const tens = TENS.get(words[0]);
  const rest = smallNumber(words.slice(1));
  return tens && rest !== null && rest > 0 && rest < (tens === 60 ? 20 : 10) ? tens + rest : null;
}

function numberValue(value) {
  if (/^\d+$/.test(value)) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number <= 10_000 ? number : null;
  }
  if (/\d/.test(value)) return null;
  const words = value.split(" ").filter((word) => word && word !== "et")
    .map((word) => word === "vingts" ? "vingt" : word === "cents" ? "cent" : word);
  const thousand = words.indexOf("mille");
  if (thousand >= 0) {
    const prefix = thousand === 0 ? 1 : numberValue(words.slice(0, thousand).join(" "));
    const suffix = words.length > thousand + 1 ? numberValue(words.slice(thousand + 1).join(" ")) : 0;
    const result = prefix !== null && suffix !== null ? prefix * 1000 + suffix : null;
    return result !== null && result <= 10_000 ? result : null;
  }
  const hundred = words.indexOf("cent");
  if (hundred >= 0) {
    const prefix = hundred === 0 ? 1 : smallNumber(words.slice(0, hundred));
    const suffix = smallNumber(words.slice(hundred + 1));
    return prefix >= 1 && prefix <= 9 && suffix !== null && suffix < 100 ? prefix * 100 + suffix : null;
  }
  return smallNumber(words);
}

function normalizeCommand(raw) {
  return String(raw ?? "").normalize("NFD").replace(/\p{M}/gu, "")
    .toLowerCase().replace(/['’\-]/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ").trim();
}

/** Une commande reconnue, sans exécuter d'action ni analyser du texte arbitraire. */
export function parseVoiceCommand(raw) {
  // Un signe négatif explicite ne doit jamais se transformer en nombre positif.
  if (/[-−]\s*\d/.test(String(raw))) return null;
  let text = normalizeCommand(raw)
    .replace(/^(?:s il te plait|peux tu|tu peux) /, "")
    .replace(/ (?:s il te plait|merci)$/, "");
  if (/^(?:pause|stop|arrete|attends|attend|mets en pause|mets la lecture en pause|arrete la lecture)$/.test(text)
      || /^(?:(?:attends|attend|stop)(?: |$))+$/.test(text)) return { type: "pause" };
  if (/^(?:reprends|reprendre|continue|continuer|reprends la lecture|continue la lecture|lecture)$/.test(text)) return { type: "resume" };
  text = text.replace(/^(?:(?:attends|attend|stop) )+/, "");

  if (/^(?:recommence|redemarre|reprends depuis le debut)(?: le| ce)? chapitre$/.test(text)
      || /^(?:retourne|reviens|va) (?:au debut du|en debut de) chapitre$/.test(text)) return { type: "chapter-start" };

  let adjacent = /^(?:(?:va|reviens|retourne|passe|saute) (?:au|a la) )?(chapitre|phrase) (precedent|precedente|suivant|suivante|prochain|prochaine)$/.exec(text);
  if (!adjacent) {
    const reversed = /^(?:reviens|retourne|va|passe) (?:au|a la) (precedent|precedente|suivant|suivante|prochain|prochaine) (chapitre|phrase)$/.exec(text);
    if (reversed) adjacent = [reversed[0], reversed[2], reversed[1]];
  }
  if (adjacent) {
    return { type: adjacent[1] === "phrase" ? "relative-sentence" : "relative-chapter", count: adjacent[2].startsWith("preced") ? -1 : 1 };
  }

  let direction;
  if (/^(?:reviens|recule|reculez|retourne|remonte)\b/.test(text)) direction = -1;
  else if (/^(?:avance|avancez|passe|saute|skip)\b/.test(text)) direction = 1;
  else return null;
  if ((direction > 0 && / en arriere$/.test(text)) || (direction < 0 && / en avant$/.test(text))) return null;
  text = text.replace(/^(?:reviens|recule|reculez|retourne|remonte|avance|avancez|passe|saute|skip)\b/, "").trim()
    .replace(/^(?:en arriere|en avant) /, "")
    .replace(/^(?:jusqu aux|jusqu au|de|d) /, "")
    .replace(/ (?:en arriere|en avant)$/, "")
    .replace(/ (?:prochains?|prochaines?|suivants?|suivantes?|precedents?|precedentes?) (?=chapitres?$|phrases?$)/, " ");

  const quantity = /^(.+?) (secondes?|minutes?|heures?|phrases?|chapitres?)$/.exec(text);
  if (!quantity) return null;
  const number = numberValue(quantity[1]);
  if (number === null || number <= 0) return null;
  const unit = quantity[2];
  if (unit.startsWith("phrase")) return { type: "relative-sentence", count: direction * number };
  if (unit.startsWith("chapitre")) return { type: "relative-chapter", count: direction * number };
  const factor = unit.startsWith("heure") ? 3600 : unit.startsWith("minute") ? 60 : 1;
  const seconds = number * factor;
  return seconds <= 86_400 ? { type: "relative-time", seconds: direction * seconds } : null;
}

function voiceError(code, message) {
  return Object.assign(new Error(message), { code });
}

/**
 * Une activation explicite = une commande. Le lecteur doit être mis en pause
 * avant start() pour que la radio ne s'écoute pas elle-même.
 *
 * Après installation d'un pack, start() rend false avec l'état ready : un second
 * clic est nécessaire. Le téléchargement n'ouvre ainsi jamais le microphone.
 */
export function createVoiceCommands({
  onCommand = () => {}, onState = () => {}, onError = () => {},
  recognitionConstructor = globalThis.SpeechRecognition,
  secureContext = globalThis.isSecureContext === true,
  captureTimeout = 15_000,
} = {}) {
  const Recognition = recognitionConstructor;
  let localSupport = false;
  if (secureContext && typeof Recognition === "function" && typeof Recognition.available === "function") {
    try { localSupport = "processLocally" in new Recognition(); } catch { /* API indisponible */ }
  }
  let state = "idle", recognition = null, timer = null, epoch = 0, disposed = false, ready = false;

  function setState(next) {
    state = next;
    if (!disposed) onState(next);
  }
  function fail(code, message, terminal = "error") {
    setState(terminal);
    if (!disposed) onError(voiceError(code, message));
  }
  const current = (token) => !disposed && token === epoch;
  const busy = () => ["checking", "downloading", "starting", "listening"].includes(state);

  async function check(token) {
    if (!localSupport) {
      fail("unsupported", "Les commandes vocales locales ne sont pas disponibles dans ce navigateur. Utilise les boutons ou la commande écrite.", "unsupported");
      return "unavailable";
    }
    setState("checking");
    try {
      const status = await Recognition.available({ langs: ["fr-FR"], processLocally: true });
      if (!current(token)) return "unavailable";
      ready = status === "available";
      if (ready) setState("ready");
      else if (status === "unavailable") fail("language-unavailable", "Le français n'est pas disponible pour la reconnaissance locale sur cet appareil.", "unavailable");
      else if (status === "downloadable" || status === "downloading") setState("idle");
      else fail("availability", "Le navigateur n'a pas confirmé la disponibilité de la reconnaissance locale.");
      return ["available", "downloadable", "downloading", "unavailable"].includes(status) ? status : "unavailable";
    } catch {
      if (current(token)) fail("availability", "Impossible de vérifier la reconnaissance vocale locale. Les commandes écrites restent disponibles.");
      return "unavailable";
    }
  }

  async function install(status, token) {
    if (!current(token)) return "unavailable";
    if (status === "available" || status === "unavailable") return status;
    if (typeof Recognition.install !== "function") {
      fail("installation-unavailable", "Le navigateur ne permet pas d'installer le français pour la reconnaissance locale.", "unavailable");
      return "unavailable";
    }
    setState("downloading");
    try {
      const installed = await Recognition.install({ langs: ["fr-FR"] });
      if (!current(token)) return "unavailable";
      if (!installed) throw new Error("installation incomplete");
      ready = true;
      setState("ready");
      return "available";
    } catch {
      if (current(token)) fail("installation", "Le téléchargement du français n'a pas abouti. Réessaie quand la connexion est disponible.");
      return "unavailable";
    }
  }

  async function availability() {
    if (disposed || busy()) return ready ? "available" : "unavailable";
    return check(++epoch);
  }

  async function prepare() {
    if (disposed || busy()) return ready ? "available" : "unavailable";
    const token = ++epoch;
    return install(await check(token), token);
  }

  function stop({ discard = true } = {}) {
    if (!discard && recognition) {
      try { recognition.stop(); } catch { stop(); }
      return;
    }
    epoch++;
    clearTimeout(timer);
    timer = null;
    const active = recognition;
    recognition = null;
    if (active) {
      try { discard ? active.abort() : active.stop(); } catch { /* Déjà terminé */ }
    }
    setState("idle");
  }

  async function start() {
    if (disposed || busy()) return false;
    const token = ++epoch;
    if (!ready) {
      const status = await check(token);
      if (!current(token)) return false;
      if (status !== "available") {
        await install(status, token);
        return false;
      }
    }
    if (!current(token)) return false;
    let handled = false, failed = false;
    try {
      const active = new Recognition();
      if (!("processLocally" in active)) throw new Error("local processing absent");
      active.processLocally = true;
      if (active.processLocally !== true) throw new Error("local processing refused");
      active.lang = "fr-FR";
      active.continuous = false;
      active.interimResults = false;
      active.maxAlternatives = 3;
      recognition = active;
      active.onstart = () => { if (current(token)) setState("listening"); };
      active.onresult = (event) => {
        if (!current(token) || handled) return;
        let command = null, transcript = "", sawFinal = false;
        for (let i = event.resultIndex ?? 0; i < event.results.length && !command; i++) {
          const result = event.results[i];
          if (!result.isFinal) continue;
          sawFinal = true;
          for (let n = 0; n < result.length && !command; n++) {
            transcript = result[n].transcript;
            command = parseVoiceCommand(transcript);
          }
        }
        if (!sawFinal) return;
        handled = true;
        try {
          if (command) onCommand(command, transcript);
          else fail("unknown-command", "Commande non reconnue. Essaie « reviens trente secondes en arrière ».");
        } finally {
          try { active.abort(); } catch { /* Déjà terminé */ }
        }
      };
      active.onerror = (event) => {
        if (!current(token) || handled || event.error === "aborted") return;
        failed = true;
        const denied = ["not-allowed", "service-not-allowed"].includes(event.error);
        const noSpeech = event.error === "no-speech";
        if (event.error === "language-not-supported") ready = false;
        fail(event.error || "recognition", denied ? "L'accès au microphone est refusé. Autorise-le dans les réglages du navigateur."
          : noSpeech ? "Je n'ai pas entendu de commande. Appuie à nouveau pour réessayer."
          : event.error === "audio-capture" ? "Aucun microphone n'est disponible sur cet appareil."
          : "La reconnaissance locale s'est interrompue. Appuie à nouveau pour réessayer.");
      };
      active.onend = () => {
        if (!current(token)) return;
        recognition = null;
        clearTimeout(timer);
        timer = null;
        if (!handled && !failed) onError(voiceError("no-speech", "Aucune commande entendue. Appuie à nouveau pour parler."));
        setState("idle");
      };
      setState("starting");
      timer = setTimeout(() => {
        if (!current(token)) return;
        try { active.stop(); } catch { stop(); }
      }, captureTimeout);
      active.start();
      return true;
    } catch {
      clearTimeout(timer);
      timer = null;
      try { recognition?.abort(); } catch { /* Déjà terminé */ }
      recognition = null;
      if (current(token)) fail("start", "Impossible d'ouvrir la reconnaissance vocale locale. Utilise les commandes écrites.");
      return false;
    }
  }

  function finish() {
    stop({ discard: false });
  }

  function dispose() {
    stop();
    disposed = true;
  }

  return { supported: () => localSupport, availability, prepare, start, stop, finish, dispose, getState: () => state };
}
