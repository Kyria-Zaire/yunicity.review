/** Suivi publications en cours — sessionStorage (VIDEO-04C). */

export type LocalVideoPendingRecord = {
  videoId: string;
  title: string | null;
  registeredAt: string;
};

const STORAGE_KEY = "yunicity.local-video.pending-v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function parseRecords(raw: string | null): LocalVideoPendingRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is LocalVideoPendingRecord =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as LocalVideoPendingRecord).videoId === "string" &&
        typeof (entry as LocalVideoPendingRecord).registeredAt === "string",
    );
  } catch {
    return [];
  }
}

function pruneStale(records: LocalVideoPendingRecord[]): LocalVideoPendingRecord[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  return records.filter((record) => {
    const at = Date.parse(record.registeredAt);
    return Number.isFinite(at) && at >= cutoff;
  });
}

export function readLocalVideoPendingRecords(): LocalVideoPendingRecord[] {
  if (!canUseStorage()) return [];
  const records = pruneStale(parseRecords(window.sessionStorage.getItem(STORAGE_KEY)));
  writeLocalVideoPendingRecords(records);
  return records;
}

export function writeLocalVideoPendingRecords(records: LocalVideoPendingRecord[]): void {
  if (!canUseStorage()) return;
  if (records.length === 0) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function registerLocalVideoPending(record: LocalVideoPendingRecord): void {
  const existing = readLocalVideoPendingRecords().filter(
    (item) => item.videoId !== record.videoId,
  );
  writeLocalVideoPendingRecords([record, ...existing]);
}

export function removeLocalVideoPending(videoId: string): void {
  const next = readLocalVideoPendingRecords().filter((item) => item.videoId !== videoId);
  writeLocalVideoPendingRecords(next);
}
