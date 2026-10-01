import { describe, expect, it } from "vitest";

import type { LocalEvent } from "@yunicity/types";

import { buildMyAgendaGroups, countMyAgendaItems } from "./my-agenda-presenter";

function event(overrides: Partial<LocalEvent> & Pick<LocalEvent, "id" | "title" | "starts_at">): LocalEvent {
  return {
    city: "Reims",
    district: null,
    location_name: "Centre-ville",
    cover_image_url: null,
    event_type: "meetup",
    is_cancelled: false,
    interested_by_me: true,
    interest_count: 1,
    organization_id: null,
    neighborhood_id: null,
    neighborhood_summary: null,
    ends_at: null,
    description: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as LocalEvent;
}

describe("buildMyAgendaGroups", () => {
  const now = new Date("2026-09-03T10:00:00");

  it("groupe aujourd’hui / demain / cette semaine / plus tard", () => {
    const groups = buildMyAgendaGroups(
      [
        event({ id: "1", title: "Aujourd’hui", starts_at: "2026-09-03T18:00:00" }),
        event({ id: "2", title: "Demain", starts_at: "2026-09-04T19:00:00" }),
        event({ id: "3", title: "Week", starts_at: "2026-09-06T15:00:00" }),
        event({ id: "4", title: "Later", starts_at: "2026-09-20T15:00:00" }),
      ],
      "Reims",
      now,
    );

    expect(groups.map((g) => g.id)).toEqual(["today", "tomorrow", "this_week", "later"]);
    expect(groups[0]?.items[0]?.title).toBe("Aujourd’hui");
    expect(groups[1]?.items[0]?.title).toBe("Demain");
    expect(countMyAgendaItems(groups)).toBe(4);
  });

  it("ignore les événements passés et annulés", () => {
    const groups = buildMyAgendaGroups(
      [
        event({ id: "past", title: "Passé", starts_at: "2026-09-01T18:00:00" }),
        event({
          id: "cancelled",
          title: "Annulé",
          starts_at: "2026-09-05T18:00:00",
          is_cancelled: true,
        }),
        event({ id: "ok", title: "OK", starts_at: "2026-09-05T18:00:00" }),
      ],
      "Reims",
      now,
    );

    expect(countMyAgendaItems(groups)).toBe(1);
    expect(groups[0]?.items[0]?.href).toBe("/events/ok");
  });
});
