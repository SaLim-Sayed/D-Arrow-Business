import { Timestamp } from "firebase/firestore";

export function timestampToIso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

export function mapDocWithTimestamps<T>(
  id: string,
  data: Record<string, unknown>
): T {
  return {
    id,
    ...data,
    createdAt: timestampToIso(data.createdAt) ?? new Date().toISOString(),
    updatedAt: timestampToIso(data.updatedAt) ?? new Date().toISOString(),
  } as T;
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/** Recursively remove undefined — required before Firestore writes. */
export function deepStripUndefined<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepStripUndefined(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return value;
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, deepStripUndefined(v)])
    ) as T;
  }
  return value;
}
