/** Admin local events workspace helpers (ADMIN-05B). */

import type {
  AdminEventModerationStatus,
  AdminEventModerationStatusFilter,
  AdminLocalEventAction,
} from "@yunicity/types";

import { formatPassportDate } from "./passport-labels";

export const DEFAULT_ADMIN_EVENTS_CITY = "Reims";

export const ADMIN_EVENT_MODERATION_STATUS_LABELS: Record<AdminEventModerationStatus, string> = {
  pending_review: "En attente de validation",
  approved: "Approuvé",
  rejected: "Rejeté",
};

export const ADMIN_EVENT_VISIBILITY_LABELS: Record<"public", string> = {
  public: "Public",
};

export const ADMIN_EVENT_MODERATION_STATUS_FILTER_OPTIONS: {
  value: AdminEventModerationStatusFilter;
  label: string;
}[] = [
  { value: "pending_review", label: "En attente de validation" },
  { value: "approved", label: "Approuvés" },
  { value: "rejected", label: "Rejetés" },
  { value: "", label: "Tous les statuts" },
];

export function eventModerationStatusLabel(status: AdminEventModerationStatus | string): string {
  if (status in ADMIN_EVENT_MODERATION_STATUS_LABELS) {
    return ADMIN_EVENT_MODERATION_STATUS_LABELS[status as AdminEventModerationStatus];
  }
  return status;
}

export function eventVisibilityLabel(visibility: string | null | undefined): string {
  if (visibility === "public") {
    return ADMIN_EVENT_VISIBILITY_LABELS.public;
  }
  return visibility?.trim() ? visibility : "Public";
}

export function formatEventDate(iso: string | null | undefined): string {
  return formatPassportDate(iso);
}

export function buildAdminEventDetailPath(eventId: string): string {
  return `/events/${encodeURIComponent(eventId)}`;
}

export type EventTemporalStatus = "upcoming" | "ongoing" | "past";

const EVENTS_LIST_CONTEXT_KEYS = ["status", "city", "q", "event_type", "page", "page_size"] as const;

export const EVENT_TEMPORAL_STATUS_LABELS: Record<EventTemporalStatus, string> = {
  upcoming: "À venir",
  ongoing: "En cours",
  past: "Terminé",
};

export function eventTemporalStatus(
  startsAt: string,
  endsAt: string | null | undefined,
  now: Date = new Date(),
): EventTemporalStatus {
  const startMs = new Date(startsAt).getTime();
  const nowMs = now.getTime();
  if (!Number.isFinite(startMs)) {
    return "upcoming";
  }
  if (nowMs < startMs) {
    return "upcoming";
  }
  if (endsAt) {
    const endMs = new Date(endsAt).getTime();
    if (Number.isFinite(endMs) && nowMs >= endMs) {
      return "past";
    }
  }
  return "ongoing";
}

export function eventTemporalStatusLabel(status: EventTemporalStatus): string {
  return EVENT_TEMPORAL_STATUS_LABELS[status];
}

export function formatEventDuration(
  startsAt: string,
  endsAt: string | null | undefined,
): string {
  if (!endsAt?.trim()) {
    return "—";
  }
  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return "—";
  }
  const hours = Math.round((endMs - startMs) / 3_600_000);
  if (hours < 24) {
    return `${hours} h`;
  }
  const days = Math.round(hours / 24);
  return `${days} j`;
}

export function buildEventsListBackPath(detailSearchParams: URLSearchParams): string {
  const query: Record<string, string> = {};
  for (const key of EVENTS_LIST_CONTEXT_KEYS) {
    const value = detailSearchParams.get(key);
    if (value) {
      query[key] = value;
    }
  }
  return buildEventsListPath(query);
}

export function buildPublicEventUrl(eventId: string, webAppBaseUrl?: string): string {
  const path = `/events/${encodeURIComponent(eventId)}`;
  const base = webAppBaseUrl?.replace(/\/$/, "") ?? "";
  return base ? `${base}${path}` : path;
}

export function buildEventsListPath(query?: Record<string, string | undefined>): string {
  if (!query) {
    return "/events";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value?.trim()) {
      search.set(key, value.trim());
    }
  }
  const qs = search.toString();
  return qs ? `/events?${qs}` : "/events";
}

export function buildEventDetailPathWithListContext(
  eventId: string,
  listQuery: URLSearchParams,
): string {
  const base = buildAdminEventDetailPath(eventId);
  const qs = listQuery.toString();
  return qs ? `${base}?${qs}` : base;
}

export const eventCancelledBadgeLabel = "Annulé";

export const eventCancelWarningCopy =
  "L'événement sera retiré du feed, de la carte et des listes publiques. Le lien public renverra une erreur 410.";

export const eventModerationBlockedWhenCancelledCopy =
  "Cet événement est annulé. Les actions de modération sont bloquées.";

export function validateEventCancelReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (!trimmed) {
    return "Le motif est obligatoire.";
  }
  if (trimmed.length < 3) {
    return "Le motif doit contenir au moins 3 caractères.";
  }
  return null;
}

export function canCancelEvent(event: {
  moderation_status: string;
  is_cancelled: boolean;
}): boolean {
  return event.moderation_status === "approved" && !event.is_cancelled;
}

export function canAdminApproveEvent(status: string, isCancelled = false): boolean {
  return !isCancelled && status === "pending_review";
}

export function canAdminRejectEvent(status: string, isCancelled = false): boolean {
  return !isCancelled && (status === "pending_review" || status === "approved");
}

export const EVENT_ADMIN_ACTION_LABELS: Record<AdminLocalEventAction, string> = {
  approve: "Approbation",
  reject: "Rejet",
  cancel: "Annulation",
};

export function eventAdminActionLabel(action: AdminLocalEventAction | string): string {
  if (action in EVENT_ADMIN_ACTION_LABELS) {
    return EVENT_ADMIN_ACTION_LABELS[action as AdminLocalEventAction];
  }
  return action;
}

function eventStaffStatusLabel(status: string | null | undefined): string {
  if (!status?.trim()) {
    return "—";
  }
  return eventModerationStatusLabel(status);
}

export function formatEventAdminActionStatusTransition(
  previousStatus: string | null,
  newStatus: string | null,
): string {
  return `${eventStaffStatusLabel(previousStatus)} → ${eventStaffStatusLabel(newStatus)}`;
}

export function eventIsPubliclyVisible(event: {
  moderation_status: string;
  is_cancelled: boolean;
}): boolean {
  return event.moderation_status === "approved" && !event.is_cancelled;
}

export function eventIsFeedDistributed(event: {
  moderation_status: string;
  is_cancelled: boolean;
}): boolean {
  return eventIsPubliclyVisible(event);
}

export const eventFeedSyncCopy =
  "L'approbation staff synchronise l'événement vers le feed local et la carte citoyenne.";

export const eventPublicExposureCopy =
  "Vérifiez la cohérence avec ce que les citoyens verront sur le web et le feed.";
