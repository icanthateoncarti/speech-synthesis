// La géométrie réordonne les éléments sans inventer ni retirer de texte.
export function layoutItems(items, mode = "native") {
  if (mode === "native") return items;
  const text = items.filter(item => typeof item.str === "string" && item.str.trim());
  if (!text.length || text.some(item => !item.transform || item.transform[1] || item.transform[2])) return items;
  const sorted = [...text].sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
  const rows = [];
  for (const item of sorted) {
    const row = rows.at(-1);
    if (row && Math.abs(row.y - item.transform[5]) <= Math.max(2, item.height * 0.3)) row.items.push(item);
    else rows.push({ y: item.transform[5], items: [item] });
  }
  rows.forEach(row => row.items.sort((a, b) => a.transform[4] - b.transform[4]));
  if (mode === "rows") return rows.flatMap(row => row.items.map((item, i) => ({ ...item, original: item, hasEOL: i === row.items.length - 1, str: item.str + (i < row.items.length - 1 ? " ; " : "\n") })));
  const left = Math.min(...text.map(item => item.transform[4]));
  const right = Math.max(...text.map(item => item.transform[4] + item.width));
  const mid = (left + right) / 2;
  const output = [], blocks = [];
  const flush = () => {
    for (const side of [0, 1]) for (const row of blocks) {
      const parts = row.items.filter(item => (item.transform[4] < mid ? 0 : 1) === side);
      output.push(...parts.map((item, i) => ({ ...item, original: item, hasEOL: i === parts.length - 1 })));
    }
    blocks.length = 0;
  };
  for (const row of rows) {
    // Une ligne qui traverse la gouttière sépare les blocs (titre, légende…).
    if (row.items.some(item => item.transform[4] < mid && item.transform[4] + item.width > mid)) { flush(); output.push(...row.items.map((item, i) => ({ ...item, original: item, hasEOL: i === row.items.length - 1 }))); }
    else blocks.push(row);
  }
  flush();
  return output;
}
