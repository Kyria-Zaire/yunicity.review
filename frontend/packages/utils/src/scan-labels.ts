/** Messages scan partenaire — ton humain (TICKET-306). */

export const SCAN_ERROR_MESSAGES: Record<string, string> = {
  PASSPORT_NOT_FOUND: "Ce Passport n’est pas reconnu. Vérifiez le code ou le QR.",
  QR_INVALID: "Code invalide. Réessayez en scannant ou en saisissant le code.",
  PASSPORT_USER_INACTIVE: "Ce compte citoyen n’est pas actif.",
  REDEMPTION_ALREADY_EXISTS: "Cette offre a déjà été utilisée pour ce citoyen.",
  OFFER_NOT_FOUND: "Offre introuvable.",
  OFFER_NOT_PUBLISHED: "Cette offre n’est pas disponible pour le moment.",
  OFFER_NOT_VERIFIED: "Ce lieu n’est pas encore vérifié.",
  OFFER_NOT_STARTED: "Cette offre n’est pas encore active.",
  OFFER_EXPIRED: "Cette offre a expiré.",
  OFFER_EXHAUSTED: "Cette offre n’est plus disponible.",
  OFFER_TIER_REQUIRED: "Le Passport de ce citoyen ne couvre pas cette offre.",
  FORBIDDEN: "Vous n’avez pas l’autorisation pour ce lieu.",
  SCAN_PARTNER_FORBIDDEN:
    "Ce compte n’est pas rattaché à une organisation partenaire autorisée à scanner.",
};

export function humanizeScanError(code: string | undefined, fallback: string): string {
  if (code && SCAN_ERROR_MESSAGES[code]) {
    return SCAN_ERROR_MESSAGES[code];
  }
  return fallback;
}

/** Alias stable pour le terminal terrain (PARTNER-SCAN-V2-HARDENING-01). */
export const humanizeScanErrorCode = humanizeScanError;
