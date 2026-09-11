/**
 * État d'ouverture des inscriptions, lu au runtime — AUTH-04A.
 *
 * `NEXT_PUBLIC_REGISTRATION_ENABLED` est figée à la compilation : elle ne peut
 * pas suivre un changement de mode côté serveur, et constituait donc une
 * seconde source de vérité, à tenir cohérente à la main. Le backend répond
 * désormais sur `GET /auth/registration-status`, et le frontend se contente de
 * le lire.
 *
 * La variable de compilation reste le **repli** pendant la transition : un WEB
 * déployé avant cette version continue de fonctionner, et un backend antérieur
 * — qui ne connaît pas encore la route — ne casse pas l'écran d'inscription.
 */

import type { RegistrationStatus } from "@yunicity/types";

import { resolveRegistrationEnabled } from "./registration-availability";

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

/** Repli utilisé quand le backend ne répond pas, ou ne connaît pas la route. */
export function fallbackRegistrationStatus(
  raw: string | undefined | null,
): RegistrationStatus {
  return {
    open: resolveRegistrationEnabled(raw),
    mode: "unknown",
    temporarily_unavailable: false,
    turnstile_required: false,
    turnstile_site_key: null,
    closes_at: null,
  };
}

/**
 * Normalise une réponse du backend.
 *
 * Tolérante par construction : un champ manquant ne doit pas fermer
 * l'inscription, seul un `open` explicitement faux le fait. Une réponse
 * partielle vient d'un backend plus ancien, pas d'une décision de fermeture.
 */
export function parseRegistrationStatus(payload: unknown): RegistrationStatus | null {
  if (!payload || typeof payload !== "object") return null;
  const brut = payload as Record<string, unknown>;
  if (typeof brut.open !== "boolean") return null;

  return {
    open: brut.open,
    mode: typeof brut.mode === "string" ? brut.mode : "unknown",
    temporarily_unavailable: brut.temporarily_unavailable === true,
    turnstile_required: brut.turnstile_required === true,
    turnstile_site_key:
      typeof brut.turnstile_site_key === "string" && brut.turnstile_site_key.length > 0
        ? brut.turnstile_site_key
        : null,
    closes_at: typeof brut.closes_at === "string" ? brut.closes_at : null,
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
