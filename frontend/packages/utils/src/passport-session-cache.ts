import type { PassportMe } from "@yunicity/types";

type PassportSessionState = "unknown" | "inactive" | "active";

let sessionUserId: string | null = null;
let sessionState: PassportSessionState = "unknown";
let cachedPassportMe: PassportMe | null = null;
let inFlightTryGet: Promise<PassportMe | null> | null = null;

export function resetPassportSessionCache(): void {
  sessionState = "unknown";
  cachedPassportMe = null;
  inFlightTryGet = null;
}

/** Invalide le cache si l'utilisateur connecté change. */
export function syncPassportSessionUser(userId: string | null): void {
  if (userId === sessionUserId) {
    return;
  }
  sessionUserId = userId;
  resetPassportSessionCache();
}

export function getPassportSessionCache():
  | { state: "inactive" }
  | { state: "active"; passport: PassportMe }
  | { state: "unknown" } {
  if (sessionState === "inactive") {
    return { state: "inactive" };
  }
  if (sessionState === "active" && cachedPassportMe) {
    return { state: "active", passport: cachedPassportMe };
  }
  return { state: "unknown" };
}

export function markPassportSessionInactive(): void {
  sessionState = "inactive";
  cachedPassportMe = null;
}

export function markPassportSessionActive(passport: PassportMe): void {
  sessionState = "active";
  cachedPassportMe = passport;
}

/** Déduplique les appels parallèles à tryGetPassportMe pendant le chargement initial. */
export function resolvePassportTryInFlight(
  fetcher: () => Promise<PassportMe | null>,
): Promise<PassportMe | null> {
  const cached = getPassportSessionCache();
  if (cached.state === "inactive") {
    return Promise.resolve(null);
  }
  if (cached.state === "active") {
    return Promise.resolve(cached.passport);
  }
  if (inFlightTryGet) {
    return inFlightTryGet;
  }

  inFlightTryGet = fetcher().finally(() => {
    inFlightTryGet = null;
  });
  return inFlightTryGet;
}
