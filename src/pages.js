// Vue des pages d'un PDF importé : on y surligne ce qu'il faut lire (« À lire »)
// ou sauter (« À sauter »), directement sur les vraies pages.
// Un mot cliqué est relié au texte lu grâce aux positions relevées à l'extraction
// (`pageMaps`, voir src/pdf.js) : un élément de la couche de texte = un morceau.
import { openPdfForView } from "./pdf.js";
import { applyTool, hasMarks, readRanges, selectedLength, wordRange } from "./selection.js";

const CHARS_PER_SECOND = 14;
const MAX_WIDTH = 900;
const DRAG_PIXELS = 8;
const HINTS = {
  include: "Clique sur le premier mot à lire, puis sur le dernier. Tu peux aussi glisser de l'un à l'autre.",
  exclude: "Clique sur le premier mot à sauter, puis sur le dernier. Tu peux aussi glisser de l'un à l'autre.",
  erase: "Clique sur le premier et le dernier mot du surlignage à retirer.",
  second: "Clique maintenant sur le dernier mot du passage.",
  miss: "Clique sur un mot du texte.",
};

const $ = (id) => document.getElementById(id);

function formatDuration(chars) {
  const minutes = Math.max(1, Math.round(chars / CHARS_PER_SECOND / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}` : `${minutes} min`;
}

/**
 * Ouvre la vue et résout les nouveaux surlignages quand on la ferme
 * (« Terminé », Échap ou fermeture : rien n'est perdu).
 */
export async function openPages({ file, pageMaps, text, marks: initial }) {
  const dialog = $("pages-dialog"), list = $("pages-list");
  let marks = { include: [...initial.include], exclude: [...initial.exclude] };
  let tool = "include", anchor = null, press = null, closed = false;
  const rendered = new Map();
  const { pdfjs, task } = await openPdfForView(file);
  const pdf = await task.promise;
  const count = Math.min(pdf.numPages, pageMaps.length);

  // Position, dans le texte lu, du caractère `k` du morceau `i` de la page `p`.
  function docOffset(p, i, k) {
    const info = pageMaps[p];
    const start = info.spans[i * 2], end = info.spans[i * 2 + 1];
    if (start < 0) return null;
    return info.offset + Math.min(info.map[Math.min(start + k, end)], info.length);
  }

  function setHint(key) { $("pages-hint").textContent = HINTS[key]; }

  function summary() {
    const ranges = readRanges(text.length, marks);
    const chars = selectedLength(ranges);
    $("pages-summary").textContent = !hasMarks(marks) ? "Tout le document sera lu"
      : !ranges.length ? "Rien ne sera lu"
      : `${ranges.length} passage${ranges.length > 1 ? "s" : ""} · environ ${formatDuration(chars)}`;
    $("pages-clear").disabled = !hasMarks(marks);
  }

  function classOf(offset) {
    if (offset === null) return "";
    if (anchor !== null && offset >= anchor[0] && offset < anchor[1]) return "hl-anchor";
    if (marks.exclude.some(([a, b]) => offset >= a && offset < b)) return "hl-exclude";
    if (marks.include.some(([a, b]) => offset >= a && offset < b)) return "hl-include";
    return "";
  }

  function paintPage(p) {
    const state = rendered.get(p);
    if (!state?.divs) return;
    state.divs.forEach((div, i) => {
      const str = state.strings[i] ?? "";
      const segments = [];
      for (let k = 0; k < str.length; k++) {
        const kind = classOf(docOffset(p, i, k));
        if (segments.length && segments.at(-1).kind === kind) segments.at(-1).text += str[k];
        else segments.push({ kind, text: str[k] });
      }
      const key = segments.map((s) => s.kind + s.text.length).join("|");
      if (div.dataset.paint === key) return;
      div.dataset.paint = key;
      div.replaceChildren(...segments.map(({ kind, text: value }) => {
        if (!kind) return document.createTextNode(value);
        const mark = document.createElement("mark");
        mark.className = kind;
        mark.textContent = value;
        return mark;
      }));
    });
  }

  function repaint() { for (const p of rendered.keys()) paintPage(p); summary(); }

  async function renderPage(p, holder) {
    if (rendered.has(p)) return;
    rendered.set(p, {});
    const page = await pdf.getPage(p + 1);
    if (closed) return;
    const width = Math.min(MAX_WIDTH, list.clientWidth - 32);
    const scale = width / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });
    const ratio = window.devicePixelRatio || 1;
    holder.style.width = `${viewport.width}px`;
    holder.style.height = `${viewport.height}px`;
    holder.style.setProperty("--scale-factor", String(scale));
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.setAttribute("aria-hidden", "true");
    const layer = document.createElement("div");
    layer.className = "textLayer";
    holder.replaceChildren(canvas, layer);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport, transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] }).promise;
    const textLayer = new pdfjs.TextLayer({ textContentSource: await page.getTextContent(), container: layer, viewport });
    await textLayer.render();
    if (closed) return;
    textLayer.textDivs.forEach((div, i) => { div.dataset.i = String(i); });
    rendered.set(p, { divs: textLayer.textDivs, strings: textLayer.textContentItemsStr });
    paintPage(p);
  }

  // Mot sous le pointeur → position dans le texte lu.
  function locate(x, y) {
    const caret = document.caretPositionFromPoint?.(x, y);
    const range = caret ? null : document.caretRangeFromPoint?.(x, y);
    const node = caret?.offsetNode ?? range?.startContainer;
    const offset = caret?.offset ?? range?.startOffset ?? 0;
    const div = node?.nodeType === Node.TEXT_NODE ? node.parentElement?.closest(".textLayer span[data-i]") : null;
    const holder = div?.closest(".pdf-page");
    if (!div || !holder) return null;
    let k = 0;
    for (const child of div.childNodes) {
      const leaf = child.nodeType === Node.TEXT_NODE ? child : child.firstChild;
      if (leaf === node) { k += offset; break; }
      k += child.textContent.length;
    }
    const i = Number(div.dataset.i), p = Number(holder.dataset.page);
    return docOffset(p, i, Math.min(k, Math.max(0, (div.textContent.length || 1) - 1)));
  }

  function apply(first, second) {
    marks = applyTool(marks, tool, wordRange(text, first, second));
    anchor = null;
    setHint(tool);
    repaint();
  }

  function choose(next) {
    tool = next; anchor = null; setHint(next);
    for (const button of dialog.querySelectorAll("[data-tool]")) button.setAttribute("aria-pressed", String(button.dataset.tool === next));
    repaint();
  }

  const onDown = (event) => {
    if (event.button !== 0) return;
    // Pas de sélection de texte native : le geste sert uniquement à surligner.
    if (event.pointerType !== "touch") event.preventDefault();
    press = { x: event.clientX, y: event.clientY, at: locate(event.clientX, event.clientY), touch: event.pointerType === "touch" };
  };
  const onUp = (event) => {
    if (!press) return;
    const start = press; press = null;
    const end = locate(event.clientX, event.clientY);
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_PIXELS;
    if (moved && start.touch) return; // le doigt a fait défiler la page
    if (moved && start.at !== null && end !== null) { apply(start.at, end); return; }
    if (end === null) { setHint("miss"); return; }
    if (anchor === null) {
      anchor = wordRange(text, end, end);
      setHint("second");
      repaint();
    } else apply(anchor[0], end);
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) void renderPage(Number(entry.target.dataset.page), entry.target);
  }, { root: list, rootMargin: "1500px 0px" });

  // Pages à la bonne taille avant rendu : la barre de défilement reste juste.
  const first = (await pdf.getPage(1)).getViewport({ scale: 1 });
  const width = Math.min(MAX_WIDTH, list.clientWidth - 32);
  list.replaceChildren(...Array.from({ length: count }, (_, p) => {
    const holder = document.createElement("div");
    holder.className = "pdf-page";
    holder.dataset.page = String(p);
    holder.style.width = `${width}px`;
    holder.style.height = `${(width * first.height) / first.width}px`;
    holder.setAttribute("aria-label", `Page ${p + 1} sur ${count}`);
    observer.observe(holder);
    return holder;
  }));
  $("pages-file").textContent = file.name;
  choose("include");
  summary();

  const tools = [...dialog.querySelectorAll("[data-tool]")];
  const onTool = (event) => choose(event.currentTarget.dataset.tool);
  const onClear = () => { marks = { include: [], exclude: [] }; anchor = null; setHint(tool); repaint(); };
  const onKey = (event) => { if (event.key === "Escape" && anchor !== null) { event.preventDefault(); event.stopPropagation(); anchor = null; setHint(tool); repaint(); } };
  tools.forEach((button) => button.addEventListener("click", onTool));
  $("pages-clear").addEventListener("click", onClear);
  list.addEventListener("pointerdown", onDown);
  list.addEventListener("pointerup", onUp);
  dialog.addEventListener("keydown", onKey, true);
  dialog.showModal();
  list.scrollTop = 0;

  return new Promise((resolve) => {
    const finish = () => {
      if (closed) return;
      closed = true;
      observer.disconnect();
      tools.forEach((button) => button.removeEventListener("click", onTool));
      $("pages-clear").removeEventListener("click", onClear);
      $("pages-done").removeEventListener("click", done);
      list.removeEventListener("pointerdown", onDown);
      list.removeEventListener("pointerup", onUp);
      dialog.removeEventListener("keydown", onKey, true);
      dialog.removeEventListener("close", finish);
      if (dialog.open) dialog.close();
      list.replaceChildren();
      void task.destroy();
      resolve(marks);
    };
    const done = () => finish();
    $("pages-done").addEventListener("click", done);
    dialog.addEventListener("close", finish);
  });
}
