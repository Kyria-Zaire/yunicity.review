import { describe, expect, it } from "vitest";

import type { PassportMe, PassportStamp, Tribe } from "@yunicity/types";

import {
  buildPassportAchievements,
  buildPassportLevel,
  buildPassportRecentBadges,
  formatPassportPoints,
  passportDashboardHasNoFakeMetrics,
} from "./passport-dashboard";

function passport(overrides: Partial<PassportMe> = {}): PassportMe {
  return {
    id: "p1",
    user_id: "u1",
    city: "Reims",
    passport_number: "YC-REIMS-001",
    qr_token: "token",
    status: "active",
    tier: {
      id: "t1",
      code: "basic",
      name: "Basic",
      description: null,
      display_order: 1,
      flags: {},
    },
    stats: {
      stamps_count: 2,
      redemptions_count: 1,
      last_stamp_at: null,
    },
    reputation_score: 18,
    progression: {
      next_tier_code: "silver",
      next_tier_label: "Silver",
      hint: null,
      reputation_score: 18,
      points_to_next: 7,
    },
    onboarding_completed: true,
    onboarding_step: null,
    activated_at: "2025-01-01T00:00:00Z",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("passport-dashboard", () => {
  it("formate les points sans inventer", () => {
    expect(formatPassportPoints(350)).toBe("350 pts");
    expect(formatPassportPoints(null)).toBe("0 pts");
  });

  it("affiche le tier, pas un palier calculé sur la réputation (PASSPORT-LEVEL-SCALE-01)", () => {
    const level = buildPassportLevel(
      passport({
        reputation_score: 18,
        progression: {
          next_tier_code: "silver",
          next_tier_label: "Silver",
          hint: null,
          reputation_score: 18,
          points_to_next: 7,
        },
      }),
    );
    expect(level).toEqual({ tierCode: "basic", currentLabel: "Citoyen·ne", nextLabel: "Silver" });
  });

  it("fallback accomplissements sans posts inventés", () => {
    const cards = buildPassportAchievements({
      passport: passport(),
      stamps: [{ id: "s1", kind: "visit", stamped_at: "2025-02-01T00:00:00Z", slug: "centre-ville" } as PassportStamp],
      tribes: [],
      savedEventsCount: 2,
      postsCount: null,
    });
    const moments = cards.find((card) => card.id === "moments");
    expect(moments?.unavailable).toBe(true);
    expect(moments?.valueLabel).toBe("—");
    const neighborhoods = cards.find((card) => card.id === "neighborhoods");
    expect(neighborhoods?.value).toBe(1);
  });

  it("badges dérivés sans date inventée", () => {
    const badges = buildPassportRecentBadges({
      passport: passport({ stats: { stamps_count: 0, redemptions_count: 0, last_stamp_at: null } }),
      stamps: [],
      tribes: [{ id: "t1", slug: "run", name: "Run", viewer_is_member: true } as Tribe],
      savedEventsCount: 0,
      postsCount: null,
    });
    const supporter = badges.find((badge) => badge.id === "local_supporter");
    expect(supporter?.earned).toBe(true);
    expect(supporter?.earnedAt).toBeNull();
    const curious = badges.find((badge) => badge.id === "curious_explorer");
    expect(curious?.earned).toBe(false);
  });

  it("refuse copy type leaderboard", () => {
    expect(passportDashboardHasNoFakeMetrics(["Top 10 sur Reims"])).toBe(false);
    expect(passportDashboardHasNoFakeMetrics(["Citoyen·ne"])).toBe(true);
  });
});
