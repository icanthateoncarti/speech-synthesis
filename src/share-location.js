// Retirer le fragment avant les statistiques et conserver la clé en mémoire.
export function takeIncomingShare() {
  if (typeof location === "undefined" || !location.hash.startsWith("#session=")) return null;
  const fragment = location.hash;
  history.replaceState(null, "", location.pathname + location.search);
  return fragment;
}
export const incomingShare = takeIncomingShare();
