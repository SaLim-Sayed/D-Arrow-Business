/** HeroUI / React Aria may prefix string collection keys with `$`. */
export function selectionKeyToString(key: unknown): string | null {
  if (key == null || key === "") return null;
  const raw = String(key);
  return raw.startsWith("$") ? raw.slice(1) : raw;
}

/** Map app keys back to HeroUI collection keys for `selectedKeys`. */
export function toSelectionCollectionKey(key: unknown): string | null {
  const normalized = selectionKeyToString(key);
  if (!normalized) return null;
  return `$${normalized}`;
}
