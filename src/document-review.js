import { MAX_TEXT_CHARS } from "./limits.js";
import { hasSpeakableContent } from "./text.js";

let closePrevious;
// On zoome dans l'écran de la radio : la radio grossit vers son écran, l'écran s'agrandit en laissant
// voir l'orange autour, assombri. À la fermeture, une copie inerte de l'écran recule dans la radio
// (la vraie fenêtre est déjà fermée : focus et clavier ne dépendent pas de l'animation).
// data-entering reste posé pendant l'entrée (les clics ne visent rien tant que l'écran grandit).
const ZOOM_MS = 520, EASE = "cubic-bezier(.65,0,.35,1)";
let zoom = null, outro = null;
function screenGeometry() {
  const screen = document.querySelector(".screen"), machine = document.querySelector(".machine"), room = document.querySelector(".room");
  if (!screen || !machine || !room || matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const s = screen.getBoundingClientRect(), m = machine.getBoundingClientRect(), r = room.getBoundingClientRect();
  if (!s.width) return null;
  const cx = s.left + s.width / 2, cy = s.top + s.height / 2, w = innerWidth / 2, h = innerHeight / 2;
  // Assez gros pour que la radio couvre toute la fenêtre une fois centrée sur son écran.
  const scale = Math.min(3, Math.max(1.1, w / (cx - m.left), w / (m.right - cx), h / (cy - m.top), h / (m.bottom - cy)));
  return { screen: s, room, frames: [
    { transformOrigin: `${cx - r.left}px ${cy - r.top}px`, transform: "none" },
    { transformOrigin: `${cx - r.left}px ${cy - r.top}px`, transform: `translate(${w - cx}px, ${h - cy}px) scale(${scale})` },
  ] };
}
const clipTo = (rect, panel) => {
  const p = panel.getBoundingClientRect(), px = value => `${Math.max(0, value)}px`;
  return `inset(${px(rect.top - p.top)} ${px(p.right - rect.right)} ${px(p.bottom - rect.bottom)} ${px(rect.left - p.left)} round 18px)`;
};
function zoomIn(dialog) {
  outro?.();
  const g = screenGeometry();
  if (!g) return;
  const panel = dialog.querySelector(".review-screen");
  document.documentElement.classList.add("zoomed");
  zoom = { screen: g.screen, room: g.room.animate(g.frames, { duration: ZOOM_MS, easing: EASE, fill: "forwards" }) };
  dialog.dataset.entering = "";
  dialog.querySelector(".review-shade").animate({ opacity: [0, 1] }, { duration: ZOOM_MS, easing: "ease-out" });
  const grow = panel.animate({ clipPath: [clipTo(g.screen, panel), "inset(0px round 18px)"] }, { duration: ZOOM_MS, easing: EASE });
  panel.firstElementChild.animate({ opacity: [0, 0, 1], transform: ["translateY(8px)", "translateY(8px)", "none"] }, { duration: ZOOM_MS + 160, easing: "ease-out" });
  grow.finished.catch(() => {}).finally(() => delete dialog.dataset.entering);
}
function zoomOut(dialog) {
  if (!zoom) return;
  const { screen, room } = zoom; zoom = null;
  const ghost = document.createElement("div");
  ghost.className = "review-ghost"; ghost.inert = true; ghost.setAttribute("aria-hidden", "true");
  ghost.append(dialog.querySelector(".review-shade").cloneNode(true), dialog.querySelector(".review-screen").cloneNode(true));
  document.body.append(ghost);
  const panel = ghost.querySelector(".review-screen");
  panel.firstElementChild.scrollTop = dialog.querySelector(".review-inner").scrollTop;
  panel.firstElementChild.animate({ opacity: [1, 0] }, { duration: 180, fill: "forwards" });
  ghost.firstElementChild.animate({ opacity: [1, 0] }, { duration: ZOOM_MS, easing: "ease-in", fill: "forwards" });
  const shrink = panel.animate({ clipPath: ["inset(0px round 18px)", clipTo(screen, panel)] }, { duration: ZOOM_MS, easing: EASE, fill: "forwards" });
  room.reverse();
  outro = () => { outro = null; ghost.remove(); room.cancel(); document.documentElement.classList.remove("zoomed"); };
  shrink.finished.then(() => outro?.(), () => {});
}
export function reviewDocument({ text, file, scannedPages = [], extract, signal }) {
  closePrevious?.();
  const $ = id => document.getElementById(id);
  const dialog = $("review-dialog"), editor = $("review-text"), feedback = $("review-feedback");
  const apply = $("review-apply"), rebuild = $("review-extract");
  rebuild.disabled = false;
  editor.value = text; editor.maxLength = MAX_TEXT_CHARS;
  $("review-pdf-options").hidden = !file;
  $("review-layout").value = "native"; $("review-ocr").checked = false;
  feedback.textContent = scannedPages.length ? `${scannedPages.length} page(s) avec peu ou pas de texte détectable. Tu peux activer la reconnaissance des scans ci-dessous.` : "Vérifie l’ordre de lecture et corrige les mots si nécessaire. Le fichier original reste intact.";
  let result = null, controller, active = true;
  const validity = () => { apply.disabled = Boolean(controller) || !hasSpeakableContent(editor.value); };
  return new Promise(resolve => {
    const close = () => { if (dialog.open) zoomOut(dialog); dialog.close(); finish(); };
    const closed = () => { if (!dialog.open) finish(); };
    const cancel = event => { event.preventDefault(); close(); };
    const finish = () => {
      if (!active) return;
      active = false;
      // Fermée sans passer par close() : on revient à la radio sans animation.
      if (zoom) { zoom.room.cancel(); zoom = null; document.documentElement.classList.remove("zoomed"); }
      dialog.removeEventListener("close", closed); dialog.removeEventListener("cancel", cancel);
      if (closePrevious === close) closePrevious = null;
      controller?.abort(); signal?.removeEventListener("abort", close);
      editor.oninput = apply.onclick = rebuild.onclick = $("review-close").onclick = null;
      resolve(result);
    };
    editor.oninput = validity;
    apply.onclick = () => { result = editor.value; close(); };
    $("review-close").onclick = close;
    rebuild.onclick = async () => {
      if (controller) return;
      controller = new AbortController(); rebuild.disabled = true; validity();
      feedback.textContent = "Extraction en cours… Tu peux fermer pour annuler.";
      try {
        const doc = await extract({ signal: controller.signal, layout: $("review-layout").value, ocr: $("review-ocr").checked, lang: $("review-lang").value,
          onProgress: value => { if (active) feedback.textContent = value; } });
        if (!active) return;
        editor.value = doc.text;
        feedback.textContent = doc.truncated ? "Document limité : 500 pages, 50 pages reconnues ou 2 millions de caractères. Vérifie le texte avant d’appliquer." : "Texte extrait. Vérifie les noms, nombres, colonnes et tableaux avant d’appliquer.";
      } catch (error) { if (active) feedback.textContent = error.name === "AbortError" ? "Annulé" : "Extraction impossible : " + error.message; }
      finally { controller = null; if (active) { rebuild.disabled = false; validity(); } }
    };
    closePrevious = close;
    dialog.addEventListener("close", closed); dialog.addEventListener("cancel", cancel); signal?.addEventListener("abort", close, { once: true });
    dialog.showModal(); zoomIn(dialog); validity(); $("review-close").focus({ preventScroll: true });
  });
}
