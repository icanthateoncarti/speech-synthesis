import { createShare, receiveShare, createdShares, deleteShare } from "./share.js";
const $ = id => document.getElementById(id);
let closePrevious;
export async function openSharing({ data, fragment, accept }) {
  closePrevious?.();
  const dialog = $("share-dialog"), feedback = $("share-feedback"), list = $("share-list"), create = $("share-create"), input = $("share-link");
  let active = true, received;
  const controller = new AbortController();
  create.disabled = false;
  input.value = ""; $("share-result").hidden = true; $("share-import").hidden = true; create.hidden = !data;
  feedback.textContent = fragment ? "Ouverture du cours partagé…" : "Le lien contient ton texte actuel, tes chapitres, ta position et tes réglages. Il ne contient ni le fichier original ni l’audio.";
  function renderList() {
    list.replaceChildren();
    for (const entry of createdShares()) {
      const row = document.createElement("div"); row.className = "library-row";
      const label = document.createElement("span"); label.textContent = `${entry.name || "Cours"} · expire le ${new Date(entry.expires).toLocaleDateString("fr")}`;
      const copy = document.createElement("button"); copy.textContent = "Voir le lien";
      copy.onclick = () => { input.value = entry.link; $("share-result").hidden = false; };
      const remove = document.createElement("button"); remove.textContent = "Supprimer le lien";
      remove.onclick = async () => { remove.disabled = true; try { await deleteShare(entry); if (active) { renderList(); feedback.textContent = "Lien supprimé. Les copies déjà importées chez les destinataires restent disponibles."; input.value = ""; $("share-result").hidden = true; } } catch (error) { if (active) { feedback.textContent = error.message; remove.disabled = false; } } };
      row.append(label, copy, remove); list.append(row);
    }
  }
  const finish = () => {
    if (!active) return; active = false; controller.abort();
    dialog.removeEventListener("close", closed); dialog.removeEventListener("cancel", cancel);
    if (closePrevious === close) closePrevious = null;
    list.replaceChildren(); create.onclick = $("share-close").onclick = $("share-copy").onclick = $("share-import").onclick = null;
  };
  const close = () => { dialog.close(); finish(); };
  const closed = () => { if (!dialog.open) finish(); };
  const cancel = event => { event.preventDefault(); close(); };
  closePrevious = close;
  $("share-close").onclick = close;
  $("share-copy").onclick = async () => { try { await navigator.clipboard.writeText(input.value); feedback.textContent = "Lien copié."; } catch { input.focus(); input.select(); feedback.textContent = "Sélectionne et copie le lien."; } };
  $("share-import").onclick = () => { if (received) { accept(received); close(); } };
  create.onclick = async () => {
    create.disabled = true;
    feedback.textContent = "Chiffrement et création du lien…";
    try { const entry = await createShare(data, controller.signal); if (active) { input.value = entry.link; $("share-result").hidden = false; feedback.textContent = "Lien valable 7 jours. Garde-le complet : la fin du lien permet de déchiffrer le cours."; renderList(); } }
    catch (error) { if (active) feedback.textContent = error.message; }
    finally { if (active) create.disabled = false; }
  };
  dialog.addEventListener("close", closed); dialog.addEventListener("cancel", cancel);
  renderList(); dialog.showModal(); $("share-close").focus();
  if (fragment) {
    try { received = await receiveShare(fragment, controller.signal); if (active) { feedback.textContent = `« ${received.name} » · ${received.text.length.toLocaleString("fr")} caractères. Importer remplacera le texte actuellement affiché. Enregistre-le dans MES COURS pour le conserver.`; $("share-import").hidden = false; } }
    catch (error) { if (active) feedback.textContent = error.message; }
  }
}
