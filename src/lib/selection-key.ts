/** HeroUI / React Aria may prefix string collection keys with `$` or `.$`. */
export function selectionKeyToString(key: unknown): string | null {
  if (key == null || key === "") return null;
  let raw = String(key);
  if (raw.startsWith(".$")) raw = raw.slice(2);
  else if (raw.startsWith("$")) raw = raw.slice(1);
  return raw;
}

/** Map app keys back to HeroUI collection keys for `selectedKeys`. */
export function toSelectionCollectionKey(key: unknown): string | null {
  const normalized = selectionKeyToString(key);
  if (!normalized) return null;
  return `$${normalized}`;
}
