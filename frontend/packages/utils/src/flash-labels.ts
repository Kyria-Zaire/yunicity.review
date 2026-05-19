/** Flash offer micro-copy (TICKET-501) — sobre, local, premium. */

export const FLASH_BADGE_LABEL = "Flash";

export const FLASH_PARTNER_HELPER =
  "Les offres flash mettent en avant une opportunité locale limitée dans le temps — sans ton promotionnel agressif.";

export type FlashTimerInput = {
  is_flash?: boolean;
  remaining_hours?: number | null;
  remaining_minutes?: number | null;
  flash_ends_at?: string | null;
};

/** Libellé timer pour feed / Passport — pas de secondes, pas de rouge. */
export function formatFlashTimerLabel(input: FlashTimerInput): string | null {
  if (!input.is_flash) {
    return null;
  }
  const hours = input.remaining_hours ?? 0;
  const minutes = input.remaining_minutes ?? 0;
  if (hours <= 0 && minutes <= 0) {
    return "Offre flash terminée";
  }
  if (hours >= 8) {
    return "Disponible encore aujourd'hui";
  }
  if (hours >= 1 && minutes === 0) {
    return `Encore ${hours}h`;
  }
  if (hours >= 1) {
    return `Se termine dans ${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `Encore ${minutes} min`;
  }
  return "Offre locale limitée";
}
