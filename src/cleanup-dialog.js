const $ = (id) => document.getElementById(id);

export function reviewCleanup(source) {
  const dialog = $("cleanup-dialog"), list = $("cleanup-list");
  const removed = new Set(source.reviewed ? source.removed : source.suggestions.map((item) => item.id));
  list.replaceChildren(...source.suggestions.map((item) => {
    const label = document.createElement("label"), input = document.createElement("input"), text = document.createElement("span");
    input.type = "checkbox"; input.value = item.id; input.checked = removed.has(item.id);
    text.textContent = `${item.text} — ${item.pages} pages ou diapositives`;
    label.append(input, text); return label;
  }));
  $("cleanup-empty").hidden = source.suggestions.length > 0;
  $("cleanup-apply").disabled = !source.suggestions.length;
  $("cleanup-restore").disabled = !source.removed.length;
  return new Promise((resolve) => {
    let result = null;
    const apply = () => { result = [...list.querySelectorAll("input:checked")].map((input) => input.value); dialog.close(); };
    const restore = () => { result = []; dialog.close(); };
    const cancel = () => dialog.close();
    const closed = () => {
      $("cleanup-apply").removeEventListener("click", apply);
      $("cleanup-restore").removeEventListener("click", restore);
      $("cleanup-cancel").removeEventListener("click", cancel);
      resolve(result);
    };
    $("cleanup-apply").addEventListener("click", apply);
    $("cleanup-restore").addEventListener("click", restore);
    $("cleanup-cancel").addEventListener("click", cancel);
    dialog.addEventListener("close", closed, { once: true });
    dialog.showModal();
    $("cleanup-cancel").focus();
  });
}
