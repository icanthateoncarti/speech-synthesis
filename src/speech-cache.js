// Cache de passages en RAM uniquement. Un plafond fixe évite de garder tout un
// cours en double sur téléphone ; les passages les moins récents sont évincés.
export function createSpeechCache(maxBytes = 8 * 1024 * 1024) {
  const entries = new Map();
  let bytes = 0;
  return {
    get(key) {
      const value = entries.get(key);
      if (value) { entries.delete(key); entries.set(key, value); }
      return value;
    },
    put(key, value) {
      if (entries.has(key)) { bytes -= entries.get(key).byteLength; entries.delete(key); }
      if (value.byteLength > maxBytes) return;
      while ((bytes + value.byteLength > maxBytes || entries.size >= 128) && entries.size) {
        const oldest = entries.keys().next().value;
        bytes -= entries.get(oldest).byteLength; entries.delete(oldest);
      }
      entries.set(key, value); bytes += value.byteLength;
    },
    clear() { entries.clear(); bytes = 0; },
  };
}
