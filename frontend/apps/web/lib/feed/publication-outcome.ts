/**
 * §3.4 bis (c) du contrat — que faire de la clé d'idempotence selon l'issue.
 *
 * ⛔ **Jamais sur le seul numéro du statut.** Un code HTTP décrit une erreur,
 * pas l'endroit où elle a été levée. La clé ne repart que sur une **garantie de
 * chemin serveur** : la requête n'a démontrablement pas atteint le service.
 *
 * Asymétrie des coûts, qui dicte tout le reste :
 *   - conserver une clé à tort → au pire un rejeu (200) ou un 409 ;
 *   - la renouveler à tort → un **doublon irréparable**.
 *
 * ⇒ **conservation par défaut, renouvellement sur preuve.**
 */

/**
 * Statuts qui PROUVENT que la requête n'a pas atteint `PostService.create_post` :
 *   - `422` : validation Pydantic, avant le corps du gestionnaire ;
 *   - `429` : `enforce_rate_limit`, appelé avant le service.
 *
 * ⛔ 400 et 403 n'y figurent pas, bien qu'aujourd'hui levés avant l'insertion :
 * le client ne doit pas dépendre de l'emplacement d'un `raise` qu'un refactor
 * déplacera.
 */
const STATUTS_SANS_CREATION = [422, 429] as const;

export type CreationOutcome =
  /** 409 — la publication existe déjà. Clé conservée jusqu'à un geste explicite. */
  | { kind: "already_sent" }
  /** 5xx ou aucune réponse — personne ne sait. Clé conservée. ⛔ Pas un échec. */
  | { kind: "undetermined" }
  /** Échec à annoncer ; `renewKey` dit si la clé peut repartir. */
  | { kind: "rejected"; renewKey: boolean };

export function classifyCreationError(error: unknown): CreationOutcome {
  const status = statusOf(error);
  if (codeOf(error) === "POST_REQUEST_CONFLICT" || status === 409) {
    return { kind: "already_sent" };
  }
  // Aucun statut : coupure réseau, délai dépassé, abandon après envoi. La
  // requête est peut-être arrivée — l'issue est inconnue.
  if (status === null) return { kind: "undetermined" };
  // ⚠️ Un 5xx n'innocente rien : un échec après `commit` reste possible.
  if (status >= 500) return { kind: "undetermined" };
  return { kind: "rejected", renewKey: (STATUTS_SANS_CREATION as readonly number[]).includes(status) };
}

function statusOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  if (!("status" in error)) return null;
  return typeof error.status === "number" ? error.status : null;
}

function codeOf(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  if (!("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}
