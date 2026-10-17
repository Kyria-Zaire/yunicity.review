/**
 * État d'ouverture des inscriptions, lu au runtime — AUTH-04A.
 *
 * Le backend répond sur `GET /auth/registration-status` et reste la seule source
 * de vérité. Sans réponse complète et valide, le frontend ne monte jamais le
 * formulaire.
 */

import type { RegistrationStatus } from "@yunicity/types";

/** Script officiel du widget. Seul hôte autorisé pour Turnstile. */
export const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Clés de test officielles Cloudflare.
 *
 * Elles permettent d'éprouver toute la chaîne — montage du widget, transmission
 * du jeton, refus — sans compte ni appel réseau réel, et sans qu'aucune vraie
 * clé n'existe dans le dépôt.
 */
export const TURNSTILE_TEST_SITE_KEY_ALWAYS_PASSES = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SITE_KEY_ALWAYS_BLOCKS = "2x00000000000000000000AB";

/**
 * Normalise une réponse du backend.
 *
 * Fail-closed : une réponse partielle ou incohérente n'autorise jamais le
 * montage du formulaire. Seul le contrat complet du backend fait foi.
 */
export function parseRegistrationStatus(payload: unknown): RegistrationStatus | null {
  if (!payload || typeof payload !== "object") return null;
  const brut = payload as Record<string, unknown>;
  if (
    typeof brut.open !== "boolean" ||
    !["closed", "pilot", "public"].includes(String(brut.mode)) ||
    typeof brut.temporarily_unavailable !== "boolean" ||
    typeof brut.turnstile_required !== "boolean" ||
    !(
      brut.turnstile_site_key === null ||
      (typeof brut.turnstile_site_key === "string" && brut.turnstile_site_key.length > 0)
    ) ||
    !(brut.closes_at === null || typeof brut.closes_at === "string")
  ) {
    return null;
  }

  const mode = String(brut.mode);
  if (
    (mode === "closed" && brut.open) ||
    (mode === "pilot" && !brut.open) ||
    (brut.temporarily_unavailable && brut.open) ||
    (mode === "public" && brut.open && (!brut.turnstile_required || !brut.turnstile_site_key))
  ) {
    return null;
  }

  return {
    open: brut.open,
    mode,
    temporarily_unavailable: brut.temporarily_unavailable,
    turnstile_required: brut.turnstile_required,
    turnstile_site_key: brut.turnstile_site_key,
    closes_at: brut.closes_at,
  };
}

/**
 * Turnstile ne peut être exigé que si le backend a fourni de quoi monter le
 * widget. Exiger un jeton sans site key produirait un formulaire impossible à
 * soumettre — un blocage total plutôt qu'une protection.
 */
export function shouldRenderTurnstile(status: RegistrationStatus): boolean {
  return status.turnstile_required && Boolean(status.turnstile_site_key);
}

/**
 * Le formulaire est-il réellement utilisable ?
 *
 * Turnstile exigé sans site key rendrait la soumission impossible : mieux vaut
 * l'annoncer que laisser quelqu'un remplir quatre étapes pour rien. Ne jamais
 * traiter ce cas en désactivant silencieusement la vérification — ce serait
 * ouvrir une inscription sans la protection que le mode exige.
 */
export function isRegistrationFormUsable(status: RegistrationStatus): boolean {
  if (!status.open || status.temporarily_unavailable) return false;
  if (status.turnstile_required && !status.turnstile_site_key) return false;
  return true;
}
