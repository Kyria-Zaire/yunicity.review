import { describe, expect, it } from "vitest";

import { formatFeedPostEventScheduleBadge } from "./feed-event-badge";

describe("formatFeedPostEventScheduleBadge", () => {
  it("prefixes tonight events with CE SOIR", () => {
    const now = new Date("2026-05-16T14:00:00");
    const badge = formatFeedPostEventScheduleBadge("2026-05-16T20:30:00", now);
    expect(badge).toMatch(/^CE SOIR · /);
  });

  it("prefixes same-day afternoon events with AUJOURD'HUI", () => {
    const now = new Date("2026-05-16T10:00:00");
    const badge = formatFeedPostEventScheduleBadge("2026-05-16T15:00:00", now);
    expect(badge).toMatch(/^AUJOURD'HUI · /);
  });
});
