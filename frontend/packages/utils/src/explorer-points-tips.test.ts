import { describe, expect, it } from "vitest";

import {
  EXPLORER_POINTS_TIPS,
  explorerPointsTipsForCarousel,
} from "./explorer-points-tips";

describe("explorer-points-tips", () => {
  it("expose au moins 8 conseils pour le carrousel", () => {
    expect(explorerPointsTipsForCarousel().length).toBeGreaterThanOrEqual(8);
  });

  it("ne contient pas de métriques inventées", () => {
    const banned = /leaderboard|classement|top\s*\d+|#\d+/i;
    for (const tip of EXPLORER_POINTS_TIPS) {
      expect(tip.title).not.toMatch(banned);
      expect(tip.body).not.toMatch(banned);
      expect(tip.href.startsWith("/")).toBe(true);
    }
  });
});
