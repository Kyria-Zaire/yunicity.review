/** Social notification micro-copy (TICKET-503). */

import type { SocialNotificationType } from "@yunicity/types";

export function formatNotificationMessage(
  type: SocialNotificationType,
  actorName: string | null,
  payload?: Record<string, unknown>,
): string {
  switch (type) {
    case "POST_LIKED":
      return "Quelqu'un a aimé votre publication.";
    case "POST_COMMENTED":
      return actorName
        ? `${actorName} a commenté votre publication.`
        : "Quelqu'un a commenté votre publication.";
    case "PASSPORT_LEVEL_UNLOCKED": {
      const tierLabel =
        typeof payload?.tier_label === "string" ? payload.tier_label : null;
      if (tierLabel) {
        return `Vous avez atteint le niveau ${tierLabel}.`;
      }
      return "Votre Passport évolue.";
    }
    case "LOCAL_STAMP_EARNED": {
      const stampTitle =
        typeof payload?.stamp_title === "string" ? payload.stamp_title : null;
      const city = typeof payload?.city === "string" ? payload.city : null;
      if (stampTitle && city) {
        return `${stampTitle} — un nouveau souvenir à ${city}.`;
      }
      return "Nouveau souvenir ajouté à votre Passport.";
    }
    default:
      return "Nouvelle activité sur Yunicity.";
  }
}

export function formatNotificationRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "À l'instant";
  }
  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Il y a ${hours} h`;
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
