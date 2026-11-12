// Actions de La Machine offertes aux agents des navigateurs (WebMCP, document.modelContext).
// Chaque outil passe par les commandes d'une personne : écran, voix, vitesse, puis la touche.
const VOICES = ["jessica", "tom"];

const input = {
  type: "object",
  properties: {
    texte: { type: "string", description: "Le texte à lire, en français ou en anglais." },
    voix: { type: "string", enum: VOICES, description: "jessica (par défaut) ou tom." },
    vitesse: { type: "number", minimum: 0.7, maximum: 1.5, description: "De 0,7 à 1,5 ; 1 par défaut." },
  },
  required: ["texte"],
};

export function agentTools($) {
  function prepare({ texte, voix, vitesse }) {
    if (typeof texte !== "string" || !texte.trim()) throw new Error("texte vide");
    const screen = $("screen");
    screen.value = texte;
    screen.dispatchEvent(new Event("input", { bubbles: true }));
    if (VOICES.includes(voix)) $("voice-" + voix).click();
    if (Number.isFinite(vitesse)) {
      const speed = $("speed");
      speed.value = String(Math.min(1.5, Math.max(0.7, Math.round(vitesse * 10) / 10)));
      speed.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return texte.trim().split(/\s+/).length;
  }
  const done = (text) => ({ content: [{ type: "text", text }] });
  return [
    {
      name: "lire-a-voix-haute",
      description: "Lit un texte à voix haute dans le navigateur, avec une voix de synthèse gratuite, sans compte. Le texte reste sur l'appareil.",
      inputSchema: input,
      async execute(args) {
        const words = prepare(args);
        $("key-speak").click();
        return done(`Lecture lancée : ${words} mots. La touche PARLE met en pause.`);
      },
    },
    {
      name: "exporter-mp3",
      description: "Convertit un texte en fichier MP3 et le télécharge, avec une voix de synthèse gratuite, sans compte.",
      inputSchema: input,
      async execute(args) {
        const words = prepare(args);
        $("key-mp3").click();
        return done(`Export MP3 lancé : ${words} mots. Le fichier se télécharge une fois prêt.`);
      },
    },
  ];
}

export function registerAgentTools($, context = globalThis.document?.modelContext) {
  if (typeof context?.registerTool !== "function") return 0;
  let count = 0;
  for (const tool of agentTools($)) {
    try { void Promise.resolve(context.registerTool(tool)).catch(() => {}); count++; } catch {}
  }
  return count;
}
