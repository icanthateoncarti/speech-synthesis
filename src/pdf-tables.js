// Les balises Table/TR/TH/TD du PDF donnent l’ordre des cellules, même si le
// flux graphique dessine les colonnes dans un autre ordre. Sans balises fiables,
// on conserve l’extraction habituelle plutôt que d’inventer une grille.
function descendants(node, budget) {
  const out = [], pending = [node];
  while (pending.length) {
    const current = pending.pop();
    if (!current || --budget.remaining < 0) return null;
    out.push(current);
    const children = current.children ?? [];
    for (let i = children.length - 1; i >= 0; i--) pending.push(children[i]);
  }
  return out;
}

export function pdfTables(items, tree) {
  if (!tree) return [];
  const budget = { remaining: 300_000 };
  const nodes = descendants(tree, budget);
  if (!nodes) return [];
  const strings = items.filter((item) => typeof item.str === "string");
  const position = new Map(strings.map((item, index) => [item, index]));
  const content = new Map(), stack = [];
  for (const item of items) {
    if (item.type === "beginMarkedContent" || item.type === "beginMarkedContentProps") {
      if (stack.length >= 128) return [];
      stack.push(item.id);
    } else if (item.type === "endMarkedContent") stack.pop();
    else if (typeof item.str === "string") {
      for (const id of new Set(stack.filter(Boolean))) {
        if (!content.has(id)) content.set(id, []);
        content.get(id).push(item);
      }
    }
  }
  const tables = [];
  for (const table of nodes.filter((node) => node.role === "Table")) {
    const children = descendants(table, budget);
    if (!children || children.slice(1).some((node) => node.role === "Table")) continue;
    const rowNodes = children.filter((node) => node.role === "TR");
    if (!rowNodes.length) continue;
    const used = new Set();
    let valid = true, first = Infinity, last = -1;
    const rows = rowNodes.map((row) => (row.children ?? []).filter((cell) => ["TH", "TD"].includes(cell.role)).map((cell) => {
      const parts = descendants(cell, budget);
      if (!parts) { valid = false; return { items: [] }; }
      const cellItems = [...new Set(parts.flatMap((node) => node.type === "content" ? content.get(node.id) ?? [] : []))];
      cellItems.sort((a, b) => position.get(a) - position.get(b));
      for (const item of cellItems) {
        if (used.has(item)) valid = false;
        used.add(item);
        first = Math.min(first, position.get(item)); last = Math.max(last, position.get(item));
      }
      return { items: cellItems, header: cell.role === "TH" && cell.scope !== "Row", colSpan: cell.colSpan ?? 1, rowSpan: cell.rowSpan ?? 1 };
    }));
    if (!valid || last < first || rows.some((row) => !row.length)) continue;
    // Une légende, un autre bloc ou des balises incomplètes au milieu du tableau
    // doivent rester lisibles : on refuse toute réécriture qui les ferait perdre.
    for (let i = first; i <= last; i++) if (strings[i].str.trim() && !used.has(strings[i])) valid = false;
    if (!valid) continue;
    const labeled = rows[0].length > 1 && rows[0].every((cell) => cell.header && cell.items.length)
      && rows.every((row) => row.length === rows[0].length && row.every((cell) => cell.colSpan === 1 && cell.rowSpan === 1));
    tables.push({ first, last, rows, labeled });
  }
  // Balises imbriquées ou qui se recouvrent : ne pas traiter deux fois le texte.
  tables.sort((a, b) => a.first - b.first);
  return tables.filter((table, i) => (i === 0 || tables[i - 1].last < table.first) && (i === tables.length - 1 || table.last < tables[i + 1].first));
}

export function renderPdfTable(table, renderCell, record) {
  let text = "";
  const labels = table.labeled ? table.rows[0].map((cell) => {
    const label = renderCell(cell.items).trim().replace(/[\s:;.!?]+$/u, "");
    return label.length <= 160 ? label : "";
  }) : [];
  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    let written = false;
    for (let column = 0; column < table.rows[rowIndex].length; column++) {
      const cell = table.rows[rowIndex][column], spans = [];
      const raw = renderCell(cell.items, (item, start, end) => spans.push([item, start, end]));
      const value = raw.trim();
      if (!value) continue;
      if (written) text += " ; ";
      else if (text) text += "\n";
      if (rowIndex > 0 && labels[column]) text += `${labels[column]} : `;
      const base = text.length - (raw.length - raw.trimStart().length);
      for (const [item, start, end] of spans) record?.(item, Math.max(text.length, base + start), Math.min(text.length + value.length, base + end));
      text += value;
      written = true;
    }
    // La ponctuation crée une pause, sans transformer la ligne en titre vocal.
    if (written && !/[.!?…]$/u.test(text)) text += ".";
  }
  return text;
}
