import { describe, expect, it } from "vitest";

import {
  formatFeedEventInterestLabel,
  formatFeedFeaturedEventScheduleLabel,
  resolveFeedEveningEventsTitle,
} from "@/lib/feed/feed-evening-events";

describe("feed-evening-events", () => {
  it("résout le titre selon le mode", () => {
    expect(resolveFeedEveningEventsTitle("Reims", "tonight")).toBe("Ce soir à Reims");
    expect(resolveFeedEveningEventsTitle("Reims", "upcoming-evening")).toBe(
      "Prochaines soirées à Reims",
    );
    expect(resolveFeedEveningEventsTitle("Reims", "upcoming")).toBe("À venir à Reims");
  });

  it("formate le libellé d'intérêt", () => {
    expect(formatFeedEventInterestLabel(1)).toBe("1 intéressé");
    expect(formatFeedEventInterestLabel(32)).toBe("32 intéressés");
  });

  it("formate la date et l'heure complètes pour la carte à la une", () => {
    const label = formatFeedFeaturedEventScheduleLabel({
      starts_at: "2026-10-24T17:42:00+02:00",
      timezone: "Europe/Paris",
    });

    expect(label).toMatch(/^Samedi 24 octobre, 17:42$/);
  });
});
