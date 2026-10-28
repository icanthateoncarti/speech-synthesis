import { MAX_TEXT_CHARS } from "./limits.js";
import { hasSpeakableContent } from "./text.js";

let closePrevious;
// L'écran de la radio s'agrandit jusqu'à remplir la page : on « rentre » dans l'écran.
// data-entering reste posé pendant l'animation (les clics ne visent rien tant que l'écran grandit).
function enterScreen(dialog) {
  const from = document.querySelector(".screen")?.getBoundingClientRect();
  if (!from?.width || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const start = `inset(${from.top}px ${innerWidth - from.right}px ${innerHeight - from.bottom}px ${from.left}px round 18px)`;
  dialog.dataset.entering = "";
  const grow = dialog.animate({ clipPath: [start, "inset(0px 0px 0px 0px round 0px)"] }, { duration: 460, easing: "cubic-bezier(.65,0,.25,1)" });
  dialog.firstElementChild.animate({ opacity: [0, 0, 1], transform: ["translateY(8px)", "translateY(8px)", "none"] }, { duration: 620, easing: "ease-out" });
  grow.finished.catch(() => {}).finally(() => delete dialog.dataset.entering);
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
    const close = () => { dialog.close(); finish(); };
    const closed = () => { if (!dialog.open) finish(); };
    const cancel = event => { event.preventDefault(); close(); };
    const finish = () => {
      if (!active) return;
      active = false;
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
    dialog.showModal(); enterScreen(dialog); validity(); $("review-close").focus({ preventScroll: true });
  });
}
