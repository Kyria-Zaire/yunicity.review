import { describe, expect, it } from "vitest";

import type { PassportMe, PassportStamp, Tribe } from "@yunicity/types";

import {
  PASSPORT_JOURNEY_LEVELS,
  buildPassportAchievements,
  buildPassportLevel,
  buildPassportProgression,
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

  it("calcule le niveau à partir de la réputation réelle", () => {
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
    expect(level.level.id).toBe("contributeur");
    expect(level.points).toBe(18);
    expect(level.nextLevel?.id).toBe("explorateur");
  });

  it("marque les paliers progression locked/active/unlocked", () => {
    const steps = buildPassportProgression(
      passport({
        reputation_score: 26,
        progression: {
          next_tier_code: "gold",
          next_tier_label: "Gold",
          hint: null,
          reputation_score: 26,
          points_to_next: 24,
        },
      }),
    );
    const explorateur = steps.find((step) => step.level.id === "explorateur");
    expect(explorateur?.state).toBe("active");
    const habitant = steps.find((step) => step.level.id === "habitant");
    expect(habitant?.state).toBe("unlocked");
    const referent = steps.find((step) => step.level.id === "referent");
    expect(referent?.state).toBe("locked");
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
    expect(passportDashboardHasNoFakeMetrics([PASSPORT_JOURNEY_LEVELS[0]!.label])).toBe(true);
  });
});
