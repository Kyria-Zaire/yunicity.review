import { describe, expect, it } from "vitest";

import type { LocalEvent, Tribe } from "@yunicity/types";

import {
  buildAgendaWeekDays,
  buildAfterworkItems,
  buildCityPulseLine,
  defaultAgendaDayKey,
  filterAgendaHeroEvents,
  filterEventsOnDay,
  isAfterworkEvent,
  partitionAgendaDayEvents,
} from "./events-agenda";

function eventAt(iso: string, overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "e1",
    organization_id: null,
    title: "Concert test",
    description: null,
    event_type: "local_concert",
    city: "Reims",
    district: "Centre",
    starts_at: iso,
    ends_at: null,
    timezone: "Europe/Paris",
    location_name: "Cathédrale",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    organization: null,
    created_at: iso,
    ...overrides,
  };
}

describe("buildAgendaWeekDays", () => {
  it("returns fourteen days by default with short weekday labels", () => {
    const days = buildAgendaWeekDays(new Date("2026-05-27T12:00:00"));
    expect(days).toHaveLength(14);
    expect(days[0]?.weekdayShort).toMatch(/^[A-Z]{3}$/);
    expect(days[0]?.dayNumber).toBeGreaterThan(0);
  });
});

describe("filterEventsOnDay", () => {
  it("filters by local calendar day", () => {
    const events = [
      eventAt("2026-05-27T19:00:00"),
      eventAt("2026-05-28T19:00:00", { id: "e2" }),
    ];
    const onDay = filterEventsOnDay(events, "2026-05-27");
    expect(onDay).toHaveLength(1);
    expect(onDay[0]?.id).toBe("e1");
  });
});

describe("partitionAgendaDayEvents", () => {
  it("splits afterwork types from highlights", () => {
    const events = [
      eventAt("2026-05-27T19:00:00", { event_type: "local_concert" }),
      eventAt("2026-05-27T20:00:00", { id: "e2", event_type: "cafe_meetup" }),
    ];
    const { highlights, afterwork } = partitionAgendaDayEvents(events);
    expect(highlights).toHaveLength(1);
    expect(afterwork).toHaveLength(1);
    expect(isAfterworkEvent(afterwork[0]!)).toBe(true);
  });
});

describe("filterAgendaHeroEvents", () => {
  it("filters by query and theme", () => {
    const events = [
      eventAt("2026-05-27T19:00:00", { title: "Marché Boulingrin" }),
      eventAt("2026-05-27T20:00:00", { id: "e2", title: "Concert" }),
    ];
    const filtered = filterAgendaHeroEvents(events, {
      query: "marché",
      timeSlot: "",
      theme: "",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toContain("Marché");
  });
});

describe("defaultAgendaDayKey", () => {
  it("prefers today when it has events", () => {
    const now = new Date("2026-05-27T10:00:00");
    const week = buildAgendaWeekDays(now);
    const events = [eventAt("2026-05-27T19:00:00")];
    expect(defaultAgendaDayKey(events, week, now)).toBe("2026-05-27");
  });
});

describe("buildCityPulseLine", () => {
  it("uses editorial tone without trending copy", () => {
    const line = buildCityPulseLine({
      city: "Reims",
      eventsTonight: 2,
      eventsThisWeek: 5,
    });
    expect(line).toBe("Les quartiers commencent à s’animer ce soir.");
    expect(line).not.toMatch(/trending|viral|hot/i);
  });
});

describe("buildAfterworkItems", () => {
  it("merges afterwork events and tribes", () => {
    const tribe: Tribe = {
      id: "t1",
      slug: "cafe-culture",
      name: "Café culture",
      description: "Rencontres",
      city: "Reims",
      category: "cafe_culture",
      visibility: "public",
      persistence_kind: "ongoing",
      cover_image_url: null,
      is_featured: false,
      member_limit: 50,
      active_member_count: 12,
      is_archived: false,
      viewer_is_member: false,
      viewer_role: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const items = buildAfterworkItems(
      [eventAt("2026-05-27T19:00:00", { event_type: "meetup", id: "ev" })],
      [tribe],
      4,
    );
    expect(items.some((i) => i.kind === "event")).toBe(true);
    expect(items.some((i) => i.kind === "tribe")).toBe(true);
  });
});
