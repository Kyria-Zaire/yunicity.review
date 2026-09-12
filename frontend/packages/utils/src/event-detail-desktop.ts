/**
 * Desktop event detail presenters (DESKTOP-EVENT-DETAIL-01).
 * Gallery extras are presentation-only (no DB gallery field).
 */
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";

import {
  EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  EDITORIAL_IMAGE_MUSIQUE_LOCALE,
  NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN,
  NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
} from "./editorial-fallback-images";
import { EVENT_TYPE_FALLBACK_IMAGES, resolveEventHeroImage } from "./event-hero-image";
import {
  EVENT_DETAIL_DESKTOP_BREADCRUMB_SORTIR,
  EVENT_DETAIL_DESKTOP_FEATURED_BADGE,
  EVENT_DETAIL_DESKTOP_KNOW_BOOKING,
  EVENT_DETAIL_DESKTOP_KNOW_BOOKING_BODY,
  EVENT_DETAIL_DESKTOP_KNOW_DURATION,
  EVENT_DETAIL_DESKTOP_KNOW_DURATION_BODY,
  EVENT_DETAIL_DESKTOP_KNOW_DURATION_CONCERT_BODY,
  EVENT_DETAIL_DESKTOP_KNOW_DURATION_MARKET_BODY,
  EVENT_DETAIL_DESKTOP_KNOW_DURATION_MEETUP_BODY,
  EVENT_DETAIL_DESKTOP_KNOW_LANG,
  EVENT_DETAIL_DESKTOP_KNOW_LANG_BODY,
  EVENT_DETAIL_DESKTOP_KNOW_LANG_CONCERT,
  EVENT_DETAIL_DESKTOP_KNOW_LANG_CONCERT_BODY,
  EVENT_DETAIL_DESKTOP_KNOW_LANG_MARKET,
  EVENT_DETAIL_DESKTOP_KNOW_LANG_MARKET_BODY,
  EVENT_DETAIL_DESKTOP_KNOW_LANG_MEETUP,
  EVENT_DETAIL_DESKTOP_KNOW_LANG_MEETUP_BODY,
  EVENT_DETAIL_DESKTOP_PROGRAM_END,
  EVENT_DETAIL_DESKTOP_PROGRAM_END_GENERIC,
  EVENT_DETAIL_DESKTOP_PROGRAM_START,
  EVENT_DETAIL_DESKTOP_PROGRAM_START_CONCERT,
  EVENT_DETAIL_DESKTOP_PROGRAM_START_GENERIC,
  EVENT_DETAIL_DESKTOP_PROGRAM_WELCOME,
  EVENT_DETAIL_DESKTOP_PROGRAM_WELCOME_CONCERT,
  EVENT_DETAIL_DESKTOP_PROGRAM_WELCOME_GENERIC,
  EVENT_DETAIL_DESKTOP_STARTED,
  EVENT_DETAIL_DESKTOP_STARTS_IN,
  EVENT_DETAIL_DESKTOP_ENDED,
} from "./event-detail-portal-labels";
import { formatEventDurationLabel, formatEventClockTime } from "./events-agenda";
import { eventTypeLabel } from "./event-labels";
import { isEventTonight } from "./sortir-portal";
import {
  SORTIR_CARD_BADGE_CULTURE,
  SORTIR_CARD_BADGE_FOOD,
  SORTIR_CARD_BADGE_LOCAL,
  SORTIR_CARD_BADGE_MUSIC,
} from "./sortir-portal-labels";

export type EventDetailBreadcrumb = {
  label: string;
  href?: string;
};

export type EventDesktopBadge = {
  label: string;
  tone: "culture" | "featured" | "music" | "food" | "local" | "default";
};

export type EventProgramStep = {
  timeLabel: string;
  title: string;
};

export type EventKnowRow = {
  icon: "globe" | "calendar" | "clock";
  title: string;
  body: string;
};

function desktopBadgeLabel(eventType: string | null): string {
  const type = eventType?.trim().toLowerCase();
  if (type === "local_concert") return SORTIR_CARD_BADGE_MUSIC;
  if (type === "local_market" || type === "market") return SORTIR_CARD_BADGE_FOOD;
  if (type === "cafe_meetup" || type === "meetup" || type === "association_evening") {
    return SORTIR_CARD_BADGE_LOCAL;
  }
  if (type === "exhibition") return SORTIR_CARD_BADGE_CULTURE;
  return eventTypeLabel(eventType) ?? "Sortie";
}

function desktopBadgeTone(eventType: string | null): EventDesktopBadge["tone"] {
  const type = eventType?.trim().toLowerCase();
  if (type === "local_concert") return "music";
  if (type === "local_market" || type === "market") return "food";
  if (type === "cafe_meetup" || type === "meetup" || type === "association_evening") return "local";
  if (type === "exhibition") return "culture";
  return "default";
}

/** Featured spotlight heuristic — exhibition + cover (QA cathédrale). */
export function eventIsFeaturedSpotlight(event: LocalEvent): boolean {
  const type = event.event_type?.trim().toLowerCase();
  return type === "exhibition" && Boolean(event.cover_image_url?.trim());
}

export function buildEventDesktopBadges(event: LocalEvent): EventDesktopBadge[] {
  const badges: EventDesktopBadge[] = [
    {
      label: desktopBadgeLabel(event.event_type).toUpperCase(),
      tone: desktopBadgeTone(event.event_type),
    },
  ];
  if (eventIsFeaturedSpotlight(event)) {
    badges.push({
      label: EVENT_DETAIL_DESKTOP_FEATURED_BADGE.toUpperCase(),
      tone: "featured",
    });
  }
  return badges;
}

export function buildEventDetailBreadcrumbs(event: LocalEvent): EventDetailBreadcrumb[] {
  const category = desktopBadgeLabel(event.event_type);
  return [
    { label: EVENT_DETAIL_DESKTOP_BREADCRUMB_SORTIR, href: "/sortir" },
    { label: category, href: "/sortir" },
    { label: event.title },
  ];
}

function galleryExtrasForType(eventType: string | null): string[] {
  const type = eventType?.trim().toLowerCase();
  if (type === "local_concert") {
    return [
      EDITORIAL_IMAGE_MUSIQUE_LOCALE,
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80",
    ];
  }
  if (type === "local_market" || type === "market") {
    return [
      NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN,
      EVENT_TYPE_FALLBACK_IMAGES.market!,
    ].filter(Boolean);
  }
  if (type === "cafe_meetup" || type === "meetup") {
    return [
      EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
      NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
    ];
  }
  // exhibition / culture — extras éditoriaux pour galerie immersive maquette
  return [
    NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1502602898657-3e91748cbb34?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1431274172761-fca41d894122?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&auto=format&fit=crop&q=80",
  ];
}

/**
 * Cover + editorial extras for immersive gallery. Dedupes identical URLs.
 * CTA should hide when length <= 1.
 */
export function buildEventDesktopGalleryUrls(
  event: LocalEvent,
  culturalPlaces: CulturalPlaceListItem[] = [],
): string[] {
  const hero = resolveEventHeroImage(event, culturalPlaces);
  const urls: string[] = [];
  const push = (url: string | null | undefined) => {
    const trimmed = url?.trim();
    if (!trimmed || urls.includes(trimmed)) return;
    urls.push(trimmed);
  };
  push(hero);
  for (const extra of galleryExtrasForType(event.event_type)) {
    push(extra);
  }
  return urls;
}

export function buildEventProgramSteps(
  event: LocalEvent,
  now = new Date(),
): EventProgramStep[] {
  const start = new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) return [];

  const type = event.event_type?.trim().toLowerCase();
  const isVisit = type === "exhibition" || /cathédrale|visite|nocturne/i.test(event.title);
  const isConcert = type === "local_concert";

  const welcomeTitle = isVisit
    ? EVENT_DETAIL_DESKTOP_PROGRAM_WELCOME
    : isConcert
      ? EVENT_DETAIL_DESKTOP_PROGRAM_WELCOME_CONCERT
      : EVENT_DETAIL_DESKTOP_PROGRAM_WELCOME_GENERIC;
  const startTitle = isVisit
    ? EVENT_DETAIL_DESKTOP_PROGRAM_START
    : isConcert
      ? EVENT_DETAIL_DESKTOP_PROGRAM_START_CONCERT
      : EVENT_DETAIL_DESKTOP_PROGRAM_START_GENERIC;
  const endTitle = isVisit
    ? EVENT_DETAIL_DESKTOP_PROGRAM_END
    : EVENT_DETAIL_DESKTOP_PROGRAM_END_GENERIC;

  const welcomeAt = new Date(start.getTime() - 15 * 60_000);
  const end = event.ends_at
    ? new Date(event.ends_at)
    : new Date(start.getTime() + 90 * 60_000);

  void now;

  return [
    { timeLabel: formatEventClockTime(welcomeAt.toISOString()), title: welcomeTitle },
    { timeLabel: formatEventClockTime(event.starts_at), title: startTitle },
    { timeLabel: formatEventClockTime(end.toISOString()), title: endTitle },
  ];
}

function knowCopyForType(eventType: string | null): {
  langTitle: string;
  langBody: string;
  durationBody: string;
} {
  const type = eventType?.trim().toLowerCase();
  if (type === "local_concert") {
    return {
      langTitle: EVENT_DETAIL_DESKTOP_KNOW_LANG_CONCERT,
      langBody: EVENT_DETAIL_DESKTOP_KNOW_LANG_CONCERT_BODY,
      durationBody: EVENT_DETAIL_DESKTOP_KNOW_DURATION_CONCERT_BODY,
    };
  }
  if (type === "local_market" || type === "market") {
    return {
      langTitle: EVENT_DETAIL_DESKTOP_KNOW_LANG_MARKET,
      langBody: EVENT_DETAIL_DESKTOP_KNOW_LANG_MARKET_BODY,
      durationBody: EVENT_DETAIL_DESKTOP_KNOW_DURATION_MARKET_BODY,
    };
  }
  if (type === "cafe_meetup" || type === "meetup" || type === "association_evening") {
    return {
      langTitle: EVENT_DETAIL_DESKTOP_KNOW_LANG_MEETUP,
      langBody: EVENT_DETAIL_DESKTOP_KNOW_LANG_MEETUP_BODY,
      durationBody: EVENT_DETAIL_DESKTOP_KNOW_DURATION_MEETUP_BODY,
    };
  }
  return {
    langTitle: EVENT_DETAIL_DESKTOP_KNOW_LANG,
    langBody: EVENT_DETAIL_DESKTOP_KNOW_LANG_BODY,
    durationBody: EVENT_DETAIL_DESKTOP_KNOW_DURATION_BODY,
  };
}

export function buildEventKnowRows(event: LocalEvent): EventKnowRow[] {
  const duration =
    formatEventDurationLabel(event.starts_at, event.ends_at) ?? "1 h 15";
  const copy = knowCopyForType(event.event_type);
  return [
    {
      icon: "globe",
      title: copy.langTitle,
      body: copy.langBody,
    },
    {
      icon: "calendar",
      title: EVENT_DETAIL_DESKTOP_KNOW_BOOKING,
      body: EVENT_DETAIL_DESKTOP_KNOW_BOOKING_BODY,
    },
    {
      icon: "clock",
      title: EVENT_DETAIL_DESKTOP_KNOW_DURATION(duration),
      body: copy.durationBody,
    },
  ];
}

/** Reims centre — preview carte si l’événement n’a pas de GPS. */
export const EVENT_DETAIL_MAP_FALLBACK = { latitude: 49.2583, longitude: 4.0317 };

export function resolveEventDesktopMapPoint(event: LocalEvent): {
  latitude: number;
  longitude: number;
} {
  if (event.latitude != null && event.longitude != null) {
    return { latitude: event.latitude, longitude: event.longitude };
  }
  return EVENT_DETAIL_MAP_FALLBACK;
}

export function formatEventCountdownLabel(
  startsAt: string,
  endsAt: string | null,
  now = new Date(),
): string | null {
  const start = Date.parse(startsAt);
  if (!Number.isFinite(start)) return null;
  const end = endsAt ? Date.parse(endsAt) : start + 2 * 60 * 60 * 1000;
  const nowMs = now.getTime();
  if (Number.isFinite(end) && end <= nowMs) return EVENT_DETAIL_DESKTOP_ENDED;
  if (start <= nowMs) return EVENT_DETAIL_DESKTOP_STARTED;
  const diffMin = Math.round((start - nowMs) / 60_000);
  if (diffMin < 60) return EVENT_DETAIL_DESKTOP_STARTS_IN(`${diffMin} min`);
  const hours = Math.floor(diffMin / 60);
  const rest = diffMin % 60;
  if (rest === 0) return EVENT_DETAIL_DESKTOP_STARTS_IN(`${hours} h`);
  return EVENT_DETAIL_DESKTOP_STARTS_IN(`${hours} h ${rest} min`);
}

export function formatEventDesktopWhenLine(
  event: LocalEvent,
  now = new Date(),
): string {
  const time = formatEventClockTime(event.starts_at);
  if (isEventTonight(event, now)) {
    return `Ce soir • ${time}`;
  }
  const start = new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) return time;
  const day = start.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} • ${time}`;
}

export function formatEventDesktopLocationLine(event: LocalEvent): string {
  const place = event.location_name?.trim() || event.city;
  const district = event.district?.trim();
  return district ? `${place} • ${district}` : place;
}

export function formatEventDesktopAgendaWhen(startsAt: string): string {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return formatEventClockTime(startsAt);
  const day = start.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} • ${formatEventClockTime(startsAt)}`;
}

/** Badge tone Sortir pour cartes similaires desktop. */
export function eventDesktopSimilarBadgeTone(
  eventType: string | null,
): EventDesktopBadge["tone"] {
  return desktopBadgeTone(eventType);
}

export function eventDesktopSimilarBadgeLabel(eventType: string | null): string {
  return desktopBadgeLabel(eventType).toUpperCase();
}

/** Truncate description for « Afficher la suite » (chars). */
export const EVENT_DETAIL_ABOUT_PREVIEW_CHARS = 220;

export function splitEventAboutText(description: string | null | undefined): {
  preview: string;
  rest: string | null;
} {
  const text = description?.trim() ?? "";
  if (!text) return { preview: "", rest: null };
  if (text.length <= EVENT_DETAIL_ABOUT_PREVIEW_CHARS) {
    return { preview: text, rest: null };
  }
  const cut = text.slice(0, EVENT_DETAIL_ABOUT_PREVIEW_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  const preview = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd();
  return { preview: `${preview}…`, rest: text };
}

/** Sous-titre court (1re ligne) + corps « À propos » (reste ou texte complet). */
export function splitEventDesktopCopy(description: string | null | undefined): {
  subtitle: string;
  preview: string;
  rest: string | null;
} {
  const text = description?.trim() ?? "";
  if (!text) return { subtitle: "", preview: "", rest: null };
  const newline = text.indexOf("\n");
  let firstLine = text;
  if (newline >= 0) {
    firstLine = text.slice(0, newline).trim();
  } else {
    const sentenceEnd = text.search(/\.\s/);
    if (sentenceEnd > 20) {
      firstLine = text.slice(0, sentenceEnd + 1).trim();
    }
  }
  const subtitle =
    firstLine.length > 110 ? `${firstLine.slice(0, 107).trimEnd()}…` : firstLine;
  const body = newline >= 0 ? text.slice(newline + 1).trim() : text;
  const about = splitEventAboutText(body || text);
  return { subtitle, preview: about.preview, rest: about.rest };
}
