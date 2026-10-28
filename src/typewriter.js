// Le texte arrive dans un champ comme tapé très vite : seulement la partie visible, puis tout le texte.
// Une touche ou un clic dans le champ termine tout de suite ; data-typing reste posé pendant l'effet.
export function createTypewriter(field) {
  let typing = null;
  const stop = () => { if (typing) { cancelAnimationFrame(typing.frame); typing = null; delete field.dataset.typing; } };
  const finish = () => typing?.done();
  for (const type of ["keydown", "pointerdown"]) field.addEventListener(type, finish);
  function type(text) {
    finish();
    const show = () => { field.value = text; field.setSelectionRange(0, 0); field.scrollTop = 0; };
    if (!text || matchMedia("(prefers-reduced-motion: reduce)").matches) { show(); return; }
    // ~ ce qui tient à l'écran ; la suite arrive d'un coup, hors de vue.
    const visible = Math.min(text.length, 520), duration = Math.min(650, 150 + visible * 0.9), start = performance.now();
    let shown = "";
    const job = { frame: 0, done() { stop(); if (field.value === shown) show(); } };
    const step = now => {
      if (field.value !== shown) { stop(); return; } // le champ a été changé ailleurs
      // L'horodatage d'une image peut précéder start : on borne à [0, 1].
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      if (t === 1) { job.done(); return; }
      shown = text.slice(0, Math.round(visible * t)); field.value = shown;
      job.frame = requestAnimationFrame(step);
    };
    typing = job; field.dataset.typing = ""; field.value = ""; field.scrollTop = 0; job.frame = requestAnimationFrame(step);
  }
  return { type, stop, finish };
}
