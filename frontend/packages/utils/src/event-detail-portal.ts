import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";

import { haversineMeters } from "./map-portal";
import { pickNearbyCulturalPlaces } from "./event-detail";
import { eventTypeLabel } from "./event-labels";

export type EventDateBadgeParts = {
  weekday: string;
  day: string;
  month: string;
};

export type EventDetailTabId = "about" | "practical" | "venue";

export function formatEventDateBadge(startsAt: string): EventDateBadgeParts | null {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const weekday = start
    .toLocaleDateString("fr-FR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  const month = start
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  return {
    weekday,
    day: String(start.getDate()),
    month,
  };
}

export function formatEventInterestSocialLine(count: number, interestedByMe: boolean): string | null {
  if (count <= 0 && !interestedByMe) {
    return null;
  }
  const base =
    count <= 0
      ? "Soyez le premier intéressé"
      : count === 1
        ? "1 personne intéressée"
        : `${count} personnes intéressées`;
  if (interestedByMe && count > 0) {
    return `${base} · vous y participez`;
  }
  return base;
}

export function formatOrganizationMemberSince(createdAt: string | null | undefined): string | null {
  if (!createdAt) {
    return null;
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function buildEventMetaChips(event: LocalEvent): { icon: "music" | "users" | "ticket" | "org"; label: string }[] {
  const chips: { icon: "music" | "users" | "ticket" | "org"; label: string }[] = [];
  const typeLabel = eventTypeLabel(event.event_type);
  if (typeLabel) {
    chips.push({ icon: "music", label: typeLabel });
  }
  chips.push({ icon: "users", label: "Tout public" });
  chips.push({ icon: "ticket", label: "Tarif sur place / non précisé" });
  if (event.organization?.name) {
    chips.push({ icon: "org", label: event.organization.name });
  }
  return chips;
}

export function resolveEventVenuePlace(
  event: LocalEvent,
  places: CulturalPlaceListItem[],
): CulturalPlaceListItem | null {
  if (places.length === 0) {
    return null;
  }

  const locationNeedle = event.location_name.trim().toLowerCase();
  const byName = places.find((place) => {
    const name = place.name.trim().toLowerCase();
    return name === locationNeedle || name.includes(locationNeedle) || locationNeedle.includes(name);
  });
  if (byName) {
    return byName;
  }

  if (event.latitude == null || event.longitude == null) {
    return null;
  }

  const nearest = pickNearbyCulturalPlaces(event, places, 1)[0];
  if (!nearest) {
    return null;
  }

  const distance = haversineMeters(
    event.latitude,
    event.longitude,
    nearest.latitude,
    nearest.longitude,
  );
  return distance <= 250 ? nearest : null;
}

export function buildGoogleCalendarUrl(event: LocalEvent): string | null {
  const start = new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  if (Number.isNaN(end.getTime())) {
    return null;
  }

  const format = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${format(start)}/${format(end)}`,
    details: event.description?.slice(0, 500) ?? "",
    location: [event.location_name, event.address].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function formatMapDistanceLabel(meters: number | null): string | null {
  if (meters == null || !Number.isFinite(meters)) {
    return null;
  }
  if (meters < 1000) {
    return `À ${Math.round(meters)} m`;
  }
  return `À ${(meters / 1000).toFixed(1)} km`;
}
