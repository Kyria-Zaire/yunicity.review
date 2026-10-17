/**
 * Mémorise l'adresse tout juste inscrite, le temps d'atteindre l'écran de
 * confirmation (AUTH-01).
 *
 * `sessionStorage` plutôt que l'URL : une adresse e-mail dans une query string
 * finit dans l'historique, les journaux de serveur et l'en-tête `Referer`. Elle
 * ne survit volontairement pas à la fermeture de l'onglet — le formulaire de
 * renvoi prend alors le relais.
 */

const STORAGE_KEY = "yunicity.pending-verification-email";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Navigation privée ou stockage refusé : le parcours reste praticable.
    return null;
  }
}

export function rememberPendingVerificationEmail(email: string): void {
  try {
    storage()?.setItem(STORAGE_KEY, email);
  } catch {
    // Sans mémoire, l'utilisateur ressaisira son adresse. Rien de bloquant.
  }
}

export function readPendingVerificationEmail(): string | null {
  try {
    return storage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function forgetPendingVerificationEmail(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Sans effet : rien à nettoyer.
  }
}
