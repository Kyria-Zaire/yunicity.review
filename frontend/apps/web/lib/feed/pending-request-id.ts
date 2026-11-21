/**
 * §3.4 bis du contrat — clé d'une tentative de publication à l'issue
 * INDÉTERMINÉE, conservée au-delà de la fermeture de l'écran.
 *
 * Quand la requête de création est partie sans qu'aucune réponse ne revienne,
 * personne ne sait si la publication existe. Jeter la clé, c'est jeter la seule
 * protection contre le doublon. On la garde donc en `sessionStorage` — le temps
 * de l'onglet, pas davantage.
 *
 * ⛔ **LA CLÉ SEULE.** Ni texte, ni médias, ni brouillon : la promesse « aucune
 * récupération du brouillon après rechargement » reste entière. Ce module ne
 * doit JAMAIS apprendre à stocker du contenu.
 */

export const PENDING_REQUEST_STORAGE_KEY = "yunicity.post-composer.pending-request";

type PendingRequest = { accountId: string; requestId: string };

/**
 * Clé en attente du compte courant, ou `null`.
 *
 * ⛔ Aucune clé ne traverse une bascule d'utilisateur : une clé qui appartient
 * à un autre compte est **ignorée ET effacée**. Un compte ne doit jamais se
 * voir annoncer la publication incertaine d'un autre, ni la voir ressurgir au
 * retour du premier sur un appareil partagé.
 */
export function readPendingRequestId(accountId: string | null): string | null {
  if (accountId === null || accountId === "") return null;
  const stored = parseStored(readRaw());
  if (stored === null) return null;
  if (stored.accountId !== accountId) {
    clearPendingRequestId();
    return null;
  }
  return stored.requestId;
}

/** Sans compte identifié, on ne peut pas isoler la clé : on n'écrit rien. */
export function writePendingRequestId(accountId: string | null, requestId: string): void {
  if (accountId === null || accountId === "") return;
  const payload: PendingRequest = { accountId, requestId };
  try {
    window.sessionStorage.setItem(PENDING_REQUEST_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Navigation privée, stockage bloqué ou quota : la protection contre le
    // doublon se limite alors à la durée de vie de l'écran. Dégradation
    // acceptée — elle ne doit pas empêcher de publier.
  }
}

export function clearPendingRequestId(): void {
  try {
    window.sessionStorage.removeItem(PENDING_REQUEST_STORAGE_KEY);
  } catch {
    // Voir `writePendingRequestId` : un stockage indisponible n'est pas une
    // erreur à remonter à l'utilisateur.
  }
}

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(PENDING_REQUEST_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Le contenu stocké est une donnée externe : jamais crue sur parole. */
function parseStored(raw: string | null): PendingRequest | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const accountId = "accountId" in parsed ? parsed.accountId : null;
  const requestId = "requestId" in parsed ? parsed.requestId : null;
  if (typeof accountId !== "string" || typeof requestId !== "string") return null;
  if (accountId === "" || requestId === "") return null;
  return { accountId, requestId };
}
