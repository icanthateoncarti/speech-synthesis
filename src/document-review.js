import { MAX_TEXT_CHARS } from "./limits.js";
import { hasSpeakableContent } from "./text.js";
import { createTypewriter } from "./typewriter.js";

let closePrevious, typewriter;
// On zoome dans l'écran de la radio : la radio grossit vers son écran pendant qu'un cadre d'écran vide
// grandit jusqu'à la fenêtre, en laissant voir l'orange autour, assombri ; le contenu apparaît ensuite.
// À la fermeture, le cadre vide rétrécit dans la radio (la vraie fenêtre est déjà fermée : focus et
// clavier ne dépendent pas de l'animation). Uniquement transform et opacity : la carte graphique s'en
// charge, l'animation reste fluide même quand la page applique un long texte.
// data-entering reste posé pendant l'entrée (les clics ne visent rien tant que l'écran grandit).
const ZOOM_MS = 520, EASE = "cubic-bezier(.65,0,.35,1)";
let zoom = null, outro = null;
function screenGeometry() {
  const screen = document.querySelector(".screen"), room = document.querySelector(".room");
  if (!screen || !room || matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const s = screen.getBoundingClientRect(), r = room.getBoundingClientRect();
  if (!s.width) return null;
  // L'écran zoomé remplit la fenêtre (moins une marge), centré : la fenêtre de relecture prend sa place.
  const margin = innerWidth < 640 ? 10 : 36;
  const scale = Math.max(1, Math.min((innerWidth - 2 * margin) / s.width, (innerHeight - 2 * margin) / s.height));
  const cx = s.left + s.width / 2, cy = s.top + s.height / 2, w = innerWidth / 2, h = innerHeight / 2;
  const border = parseFloat(getComputedStyle(screen).borderTopWidth) || 8, radius = parseFloat(getComputedStyle(screen).borderTopLeftRadius) || 18;
  // Téléphone : l'écran de la radio est presque aussi large que la fenêtre, on l'étire sur toute la hauteur.
  const height = innerWidth < 640 ? innerHeight - 2 * margin : s.height * scale;
  return { screen: s, room, scale,
    target: { inset: "auto", left: `${w - s.width * scale / 2}px`, top: `${h - height / 2}px`, width: `${s.width * scale}px`, height: `${height}px`, borderWidth: `${border * scale}px`, borderRadius: `${radius * scale}px` },
    frames: [
      { transformOrigin: `${cx - r.left}px ${cy - r.top}px`, transform: "none" },
      { transformOrigin: `${cx - r.left}px ${cy - r.top}px`, transform: `translate(${w - cx}px, ${h - cy}px) scale(${scale})` },
    ] };
}
const place = (dialog, target) => {
  for (const el of dialog.querySelectorAll(".review-screen, .review-shell")) { el.style.cssText = ""; Object.assign(el.style, target ?? {}); }
};
// Transform qui ramène le cadre (à sa taille finale) sur l'écran de la radio.
const onScreen = (rect, shell) => {
  const t = shell.getBoundingClientRect();
  return `translate(${rect.left - t.left}px, ${rect.top - t.top}px) scale(${rect.width / t.width}, ${rect.height / t.height})`;
};
function zoomIn(dialog) {
  outro?.();
  const g = screenGeometry();
  place(dialog, g?.target);
  if (!g) return Promise.resolve();
  const shell = dialog.querySelector(".review-shell"), panel = dialog.querySelector(".review-screen");
  document.documentElement.classList.add("zoomed");
  dialog.dataset.entering = "";
  zoom = { screen: g.screen, room: g.room.animate(g.frames, { duration: ZOOM_MS, easing: EASE, fill: "forwards" }) };
  // Fenêtre redimensionnée ou téléphone tourné : on recalcule le zoom sans animation.
  zoom.refit = () => {
    zoom.room.cancel();
    const next = screenGeometry();
    place(dialog, next?.target);
    if (!next) { removeEventListener("resize", zoom.refit); zoom = null; document.documentElement.classList.remove("zoomed"); return; }
    zoom.screen = next.screen;
    zoom.room = next.room.animate(next.frames, { duration: ZOOM_MS, easing: EASE, fill: "forwards" });
    zoom.room.finish();
  };
  addEventListener("resize", zoom.refit);
  dialog.querySelector(".review-shade").animate({ opacity: [0, 1] }, { duration: ZOOM_MS, easing: "ease-out" });
  const grow = shell.animate({ transform: [onScreen(g.screen, shell), "none"] }, { duration: ZOOM_MS, easing: EASE });
  return grow.finished.then(() => {
    delete dialog.dataset.entering;
    panel.animate({ opacity: [0, 1] }, { duration: 180, easing: "ease-out" });
  }, () => delete dialog.dataset.entering);
}
// Renvoie une promesse tenue quand l'écran est rentré dans la radio.
function zoomOut(dialog) {
  if (!zoom) return null;
  const { screen, room, refit } = zoom; zoom = null;
  removeEventListener("resize", refit);
  const ghost = document.createElement("div");
  ghost.className = "review-ghost"; ghost.inert = true; ghost.setAttribute("aria-hidden", "true");
  ghost.append(dialog.querySelector(".review-shade").cloneNode(), dialog.querySelector(".review-shell").cloneNode());
  document.body.append(ghost);
  const [shade, shell] = ghost.children;
  shade.animate({ opacity: [1, 0] }, { duration: ZOOM_MS, easing: "ease-in", fill: "forwards" });
  const shrink = shell.animate({ transform: ["none", onScreen(screen, shell)] }, { duration: ZOOM_MS, easing: EASE, fill: "forwards" });
  room.reverse();
  outro = () => { outro = null; ghost.remove(); room.cancel(); document.documentElement.classList.remove("zoomed"); };
  return shrink.finished.then(() => outro?.(), () => {});
}
export function reviewDocument({ text, file, extract, signal }) {
  closePrevious?.();
  const $ = id => document.getElementById(id);
  const dialog = $("review-dialog"), editor = $("review-text"), feedback = $("review-feedback");
  const apply = $("review-apply"), rebuild = $("review-extract");
  rebuild.disabled = false;
  typewriter ??= createTypewriter(editor); typewriter.stop();
  editor.value = text; editor.maxLength = MAX_TEXT_CHARS;
  const settings = $("review-settings"), options = $("review-pdf-options");
  // Les réglages du PDF restent derrière un bouton : l'écran ne montre que le texte.
  settings.hidden = !file; options.hidden = true; settings.setAttribute("aria-expanded", "false");
  $("review-layout").value = "native"; $("review-ocr").checked = false; $("review-lang-row").hidden = true;
  feedback.textContent = "Tu peux corriger le texte directement.";
  let result = null, controller, active = true;
  const validity = () => { apply.disabled = Boolean(controller) || !hasSpeakableContent(editor.value); };
  return new Promise(resolve => {
    // Le texte est appliqué une fois l'écran rentré dans la radio, pas pendant l'animation.
    const close = () => { const back = dialog.open ? zoomOut(dialog) : null; dialog.close(); finish(back); };
    const closed = () => { if (!dialog.open) finish(); };
    const cancel = event => { event.preventDefault(); close(); };
    const finish = (back) => {
      if (!active) return;
      active = false;
      // Fermée sans passer par close() : on revient à la radio sans animation.
      typewriter.finish();
      if (zoom) { removeEventListener("resize", zoom.refit); zoom.room.cancel(); zoom = null; document.documentElement.classList.remove("zoomed"); }
      dialog.removeEventListener("close", closed); dialog.removeEventListener("cancel", cancel);
      if (closePrevious === close) closePrevious = null;
      controller?.abort(); signal?.removeEventListener("abort", close);
      editor.oninput = apply.onclick = rebuild.onclick = settings.onclick = $("review-close").onclick = $("review-ocr").onchange = null;
      if (back) back.then(() => resolve(result)); else resolve(result);
    };
    editor.oninput = validity;
    $("review-ocr").onchange = () => { $("review-lang-row").hidden = !$("review-ocr").checked; };
    settings.onclick = () => { options.hidden = !options.hidden; settings.setAttribute("aria-expanded", String(!options.hidden)); };
    apply.onclick = () => { typewriter.finish(); result = editor.value; close(); };
    $("review-close").onclick = close;
    rebuild.onclick = async () => {
      if (controller) return;
      typewriter.finish();
      controller = new AbortController(); rebuild.disabled = true; validity();
      feedback.textContent = "Lecture du PDF en cours… « Annuler » l’arrête.";
      try {
        const doc = await extract({ signal: controller.signal, layout: $("review-layout").value, ocr: $("review-ocr").checked, lang: $("review-lang").value,
          onProgress: value => { if (active) feedback.textContent = value; } });
        if (!active) return;
        editor.value = doc.text;
        feedback.textContent = doc.truncated ? "Document limité : 500 pages, 50 pages reconnues ou 2 millions de caractères. Vérifie le texte avant de le mettre dans la radio." : "Nouveau texte prêt. Vérifie surtout les noms, les nombres et les tableaux.";
      } catch (error) { if (active) feedback.textContent = error.name === "AbortError" ? "Annulé" : "Lecture impossible : " + error.message; }
      finally { controller = null; if (active) { rebuild.disabled = false; validity(); } }
    };
    closePrevious = close;
    dialog.addEventListener("close", closed); dialog.addEventListener("cancel", cancel); signal?.addEventListener("abort", close, { once: true });
    dialog.showModal(); validity();
    editor.setSelectionRange(0, 0); editor.scrollTop = 0; $("review-close").focus({ preventScroll: true });
    // Comme sur la radio : une fois l'écran agrandi, le texte s'y écrit très vite.
    zoomIn(dialog).then(() => { if (active && editor.value === text) typewriter.type(text); });
  });
}
