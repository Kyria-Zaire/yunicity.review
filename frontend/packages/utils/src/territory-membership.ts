/** Adhésion locale quartier / lieu — stockage client en attendant l’API (MOBILE-TERRITORY-COMPOSER-01). */

export type TerritoryMembershipKind = "neighborhood" | "place";

export type TerritoryMembershipKey = {
  kind: TerritoryMembershipKind;
  slug: string;
  city: string;
};

const STORAGE_KEY = "yunicity.territoryMembership.v1";

function normalizeCity(city: string): string {
  return city.trim() || "Reims";
}

export function buildTerritoryMembershipId(key: TerritoryMembershipKey): string {
  return `${key.kind}:${normalizeCity(key.city).toLowerCase()}:${key.slug.trim().toLowerCase()}`;
}

function readMembershipSet(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return new Set();
  }
}

function writeMembershipSet(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function isTerritoryMember(key: TerritoryMembershipKey): boolean {
  return readMembershipSet().has(buildTerritoryMembershipId(key));
}

export function joinTerritory(key: TerritoryMembershipKey): void {
  const ids = readMembershipSet();
  ids.add(buildTerritoryMembershipId(key));
  writeMembershipSet(ids);
}

export function leaveTerritory(key: TerritoryMembershipKey): void {
  const ids = readMembershipSet();
  ids.delete(buildTerritoryMembershipId(key));
  writeMembershipSet(ids);
}

export function listTerritoryMembershipIds(): string[] {
  return [...readMembershipSet()];
}
