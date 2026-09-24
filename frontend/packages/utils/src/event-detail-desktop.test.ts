import { describe, expect, it } from "vitest";

import type { LocalEvent } from "@yunicity/types";

import {
  buildEventDesktopBadges,
  buildEventDesktopGalleryUrls,
  buildEventKnowRows,
  buildEventProgramSteps,
  eventIsFeaturedSpotlight,
  splitEventAboutText,
} from "./event-detail-desktop";

const baseEvent: LocalEvent = {
  id: "e1",
  organization_id: null,
  title: "Visite nocturne de la cathédrale",
  description:
    "Une découverte lumineuse du patrimoine rémois sous les voûtes de Notre-Dame. Un parcours guidé pour comprendre l’histoire et l’architecture.",
  event_type: "exhibition",
  city: "Reims",
  district: "Centre-ville",
  starts_at: "2026-05-16T18:30:00.000Z",
  ends_at: "2026-05-16T19:45:00.000Z",
  timezone: "Europe/Paris",
  location_name: "Parvis Notre-Dame",
  address: "Place du Cardinal Luçon",
  latitude: 49.2535,
  longitude: 4.034,
  cover_image_url: "https://cdn.example/cathedrale.jpg",
  moderation_status: "approved",
  is_cancelled: false,
  interested_by_me: false,
  interest_count: 0,
  organization: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("event-detail-desktop", () => {
  it("marks exhibition with cover as featured and CULTURE badge", () => {
    expect(eventIsFeaturedSpotlight(baseEvent)).toBe(true);
    const badges = buildEventDesktopBadges(baseEvent);
    expect(badges.map((b) => b.label)).toEqual(["CULTURE", "À LA UNE"]);
  });

  it("builds a multi-image gallery from cover + editorial extras", () => {
    const urls = buildEventDesktopGalleryUrls(baseEvent);
    expect(urls.length).toBeGreaterThan(1);
    expect(urls[0]).toContain("cathedrale");
  });

  it("builds a 3-step program from starts/ends", () => {
    const steps = buildEventProgramSteps(baseEvent);
    expect(steps).toHaveLength(3);
    expect(steps[1]?.title).toMatch(/Début/);
  });

  it("uses concert-specific program and know rows", () => {
    const concert = { ...baseEvent, event_type: "local_concert", title: "Live au Cryptoportique" };
    const rows = buildEventKnowRows(concert);
    expect(rows[0]?.title).toBe("Concert en live");
    expect(rows[2]?.body).toBe("Set live sur place");
    const steps = buildEventProgramSteps(concert);
    expect(steps[0]?.title).toBe("Ouverture des portes");
    expect(steps[1]?.title).toBe("Début du concert");
  });

  it("splits long about text for Afficher la suite", () => {
    const long = "a ".repeat(200);
    const { preview, rest } = splitEventAboutText(long);
    expect(preview.endsWith("…")).toBe(true);
    expect(rest).toBeTruthy();
  });
});
