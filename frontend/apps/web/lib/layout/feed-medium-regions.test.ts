import { describe, expect, it } from "vitest";

import {
  FEED_MEDIUM_REGIONS,
  FEED_MEDIUM_REGION_CONTENT,
  feedMediumRegionOrder,
  isFeedMediumRegionSequenceValid,
} from "@/lib/layout/feed-medium-regions";

describe("régions éditoriales du Feed medium", () => {
  it("expose exactement quatre régions, dans l'ordre éditorial", () => {
    expect([...FEED_MEDIUM_REGIONS]).toEqual([
      "stories",
      "composer",
      "stream",
      "context",
    ]);
  });

  it("n'expose aucun doublon ni région mobile/desktop inventée", () => {
    expect(new Set(FEED_MEDIUM_REGIONS).size).toBe(FEED_MEDIUM_REGIONS.length);
    expect(FEED_MEDIUM_REGIONS).not.toContain("aside");
    expect(FEED_MEDIUM_REGIONS).not.toContain("rail");
    expect(FEED_MEDIUM_REGIONS).not.toContain("header");
  });

  it("documente le contenu de chaque région", () => {
    for (const region of FEED_MEDIUM_REGIONS) {
      expect(FEED_MEDIUM_REGION_CONTENT[region].length).toBeGreaterThan(0);
    }
    expect(FEED_MEDIUM_REGION_CONTENT.stream).toContain("filtré");
  });

  it("ordonne les régions de manière stricte et croissante", () => {
    const rangs = FEED_MEDIUM_REGIONS.map((r) => feedMediumRegionOrder(r));
    expect(rangs).toEqual([0, 1, 2, 3]);
  });

  it("valide la séquence attendue et rejette toute autre", () => {
    expect(isFeedMediumRegionSequenceValid([...FEED_MEDIUM_REGIONS])).toBe(true);
    expect(
      isFeedMediumRegionSequenceValid(["composer", "stories", "stream", "context"]),
      "ordre inversé accepté à tort",
    ).toBe(false);
    expect(
      isFeedMediumRegionSequenceValid(["stories", "composer", "stream"]),
      "région manquante acceptée à tort",
    ).toBe(false);
    expect(
      isFeedMediumRegionSequenceValid(["stories", "stories", "stream", "context"]),
      "doublon accepté à tort",
    ).toBe(false);
  });
});
