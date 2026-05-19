import { describe, expect, it } from "vitest";

import {
  PASSPORT_TIER_LABELS,
  formatPassportProgressionHint,
} from "./passport-level-labels";

describe("passport-level-labels", () => {
  it("has labels for all tiers", () => {
    expect(PASSPORT_TIER_LABELS.silver).toBe("Silver");
    expect(PASSPORT_TIER_LABELS.neo_arrivant).toContain("Néo");
  });

  it("formats progression hint", () => {
    expect(formatPassportProgressionHint("Merci.", null)).toBe("Merci.");
  });
});
