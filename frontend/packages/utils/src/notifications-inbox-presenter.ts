import type { SocialNotificationType, UserNotificationItem } from "@yunicity/types";

import { formatNotificationMessage } from "./social-notification-labels";

export type NotificationPresentationTone = "social" | "passport" | "events" | "system";

export type NotificationPresentation = {
  title: string;
  description: string;
  actionLabel: string;
  tone: NotificationPresentationTone;
};

function categoryOf(item: UserNotificationItem): string | null {
  const category = item.payload?.category;
  return typeof category === "string" ? category : null;
}

export function getNotificationPresentation(item: UserNotificationItem): NotificationPresentation {
  const description = formatNotificationMessage(item.type, item.actor_name, item.payload);
  const category = categoryOf(item);

  switch (item.type) {
    case "POST_LIKED":
      return {
        title: "Publication appréciée",
        description,
        actionLabel: "Voir la publication",
        tone: "social",
      };
    case "POST_COMMENTED":
      return {
        title: "Nouveau commentaire",
        description,
        actionLabel: "Voir la publication",
        tone: "social",
      };
    case "PASSPORT_LEVEL_UNLOCKED":
      return {
        title: "Niveau Passport",
        description,
        actionLabel: "Voir mon Passport",
        tone: "passport",
      };
    case "LOCAL_STAMP_EARNED":
      return {
        title: "Tampon territorial",
        description,
        actionLabel: "Voir mon Passport",
        tone: "passport",
      };
    case "LOCAL_EVENT_PUBLISHED":
      return {
        title: "Événement à venir",
        description,
        actionLabel: "Voir l'événement",
        tone: "events",
      };
    default:
      return {
        title: category === "passport" ? "Passport" : "Activité locale",
        description,
        actionLabel: "Voir le détail",
        tone: item.actor_id ? "social" : "system",
      };
  }
}

export function formatNotificationInboxTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (dayDiff === 0) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (dayDiff === 1) {
    return "Hier";
  }
  if (dayDiff > 1 && dayDiff < 7) {
    return `${dayDiff} j`;
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
