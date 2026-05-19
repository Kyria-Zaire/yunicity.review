/** Messages scan partenaire — ton humain (TICKET-306). */

export const SCAN_ERROR_MESSAGES: Record<string, string> = {
  PASSPORT_NOT_FOUND: "Ce Passport n’est pas reconnu. Vérifie le code ou le QR.",
  QR_INVALID: "Code invalide. Réessaie en scannant ou en saisissant le code.",
  REDEMPTION_ALREADY_EXISTS: "Cette offre a déjà été utilisée pour ce citoyen.",
  OFFER_NOT_FOUND: "Offre introuvable.",
  OFFER_NOT_PUBLISHED: "Cette offre n’est pas disponible pour le moment.",
  OFFER_EXPIRED: "Cette offre a expiré.",
  OFFER_EXHAUSTED: "Cette offre n’est plus disponible.",
  OFFER_TIER_REQUIRED: "Le Passport de ce citoyen ne couvre pas cette offre.",
  FORBIDDEN: "Tu n’as pas l’autorisation pour ce lieu.",
  SCAN_PARTNER_FORBIDDEN: "Aucun lieu vérifié ne t’autorise à scanner.",
};

export function humanizeScanError(code: string | undefined, fallback: string): string {
  if (code && SCAN_ERROR_MESSAGES[code]) {
    return SCAN_ERROR_MESSAGES[code];
  }
  return fallback;
}
