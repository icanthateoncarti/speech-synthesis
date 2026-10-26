// Identité publique et choix de robots de Jonas (2026-10-26).
export const SITE = {
  name: "speechsynthe.si",
  url: "https://speechsynthe.si/",
  alternateName: "Speech Synthesis",
  logo: "https://speechsynthe.si/favicon.svg",
  contact: "https://github.com/icanthateoncarti/speech-synthesis/issues",
};

export const SEARCH_BOTS = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"];
export const TRAINING_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];
export const BLOCKED_BOTS = ["Bytespider"];
// Ces chemins techniques ne font pas partie du contenu éditorial public.
// robots.txt est une consigne d’exploration, jamais un contrôle d’accès.
export const EXCLUDED_PATHS = ["/admin/", "/api/", "/dashboard/", "/auth/", "/tests/", "/scripts/", "/docs/", "/node_modules/", "/.git/", "/.env"];

export const pagePath = (page) => page.slug ? `/${page.slug}/` : "/";
export const markdownPath = (page) => page.slug ? `/${page.slug}.md` : "/index.md";
export const absolute = (pathname) => new URL(pathname, SITE.url).href;
