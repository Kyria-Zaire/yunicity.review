const STORAGE_KEY = "yunicity.search.recent";
const MAX_RECENT = 8;

function getStorage(): Storage | null {
  if (typeof window !== "undefined") return window.localStorage;
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    return globalThis.localStorage as Storage;
  }
  return null;
}

function readStorage(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length >= 2);
  } catch {
    return [];
  }
}

function writeStorage(items: string[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
  } catch {
    // ignore quota / private mode
  }
}

export function loadRecentSearches(): string[] {
  return readStorage();
}

export function addRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return readStorage();
  const next = [trimmed, ...readStorage().filter((item) => item.toLowerCase() !== trimmed.toLowerCase())];
  writeStorage(next);
  return next.slice(0, MAX_RECENT);
}

export function removeRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  const next = readStorage().filter((item) => item !== trimmed);
  writeStorage(next);
  return next;
}

export function clearRecentSearches(): string[] {
  writeStorage([]);
  return [];
}
