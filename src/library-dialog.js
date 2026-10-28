import { listCourses, removeCourse, audioUsage } from "./library-store.js";

let closePrevious;
export async function openLibrary({ canSave, save, open, removed }) {
  closePrevious?.();
  const dialog = document.getElementById("library-dialog"), list = document.getElementById("library-list"), feedback = document.getElementById("library-feedback");
  const button = document.getElementById("library-save"), close = document.getElementById("library-close");
  button.disabled = !canSave;
  let closed = false;
  async function refresh() {
    const [courses, bytes] = await Promise.all([listCourses(), audioUsage()]);
    if (closed) return;
    list.replaceChildren();
    feedback.textContent = `${courses.length}/20 cours · ${(bytes / 1024 / 1024).toFixed(1)} Mo d’audio sauvegardé sur 200 Mo`;
    for (const course of courses) {
      const row = document.createElement("div"); row.className = "library-row";
      const label = document.createElement("span"); label.textContent = course.name || "Sans titre";
      const use = document.createElement("button"); use.textContent = "Reprendre";
      use.onclick = () => { open(course); end(); };
      const remove = document.createElement("button"); remove.textContent = "Supprimer";
      remove.onclick = async () => {
        if (!confirm(`Supprimer « ${course.name || "Sans titre"} » et ses audios de cet appareil ?`)) return;
        try { await removeCourse(course.id); removed(course.id); await refresh(); }
        catch (error) { feedback.textContent = error.message; }
      };
      row.append(label, use, remove); list.append(row);
    }
    if (!courses.length) { const p = document.createElement("p"); p.textContent = "Aucun cours enregistré sur cet appareil."; list.append(p); }
  }
  button.onclick = async () => {
    button.disabled = true;
    try { await save(); await refresh(); } catch (error) { feedback.textContent = error.message; }
    finally { if (!closed) button.disabled = !canSave; }
  };
  const finish = () => {
    if (closed) return; closed = true;
    dialog.removeEventListener("close", closedEvent); dialog.removeEventListener("cancel", cancel);
    if (closePrevious === end) closePrevious = null;
    button.onclick = close.onclick = null; list.replaceChildren();
  };
  const end = () => { dialog.close(); finish(); };
  const closedEvent = () => { if (!dialog.open) finish(); };
  const cancel = event => { event.preventDefault(); end(); };
  closePrevious = end; close.onclick = end;
  dialog.addEventListener("close", closedEvent); dialog.addEventListener("cancel", cancel);
  dialog.showModal(); close.focus();
  await refresh().catch(error => { feedback.textContent = error.message; });
}
