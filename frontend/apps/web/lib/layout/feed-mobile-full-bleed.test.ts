import { describe, expect, it } from "vitest";

import {
  FEED_MOBILE_CARD_PADDING_CLASS,
  FEED_MOBILE_CONTENT_PADDING_CLASS,
  FEED_MOBILE_GUTTER_STEP,
  FEED_MOBILE_MEDIA_BLEED_CLASS,
  feedMobileCardPaddingClass,
  feedMobileContentPaddingClass,
  feedMobileMediaBleedClass,
} from "@/lib/layout/feed-mobile-full-bleed";

/**
 * C3.1-R1D — invariant de la gouttière mobile du fil.
 *
 * Le média d'une publication est bord à bord alors que la carte qui le contient
 * garde un padding interne : le média doit donc annuler EXACTEMENT ce padding.
 * Ces deux valeurs vivent dans deux composants différents (`FeedCardShell` et
 * `FeedMobileMedia`) ; si elles divergent, le média cesse silencieusement d'être
 * bord à bord. Ce test verrouille la dérivation depuis une gouttière unique.
 */
describe("gouttière mobile du fil (C3.1-R1D)", () => {
  it("dérive padding contenu, padding carte et échappement média de la même gouttière", () => {
    expect(feedMobileContentPaddingClass()).toBe(`px-${FEED_MOBILE_GUTTER_STEP}`);
    expect(feedMobileCardPaddingClass()).toBe(`p-${FEED_MOBILE_GUTTER_STEP}`);
    expect(feedMobileMediaBleedClass()).toBe(`-mx-${FEED_MOBILE_GUTTER_STEP}`);
  });

  it("expose les constantes consommées par les composants", () => {
    expect(FEED_MOBILE_CONTENT_PADDING_CLASS).toBe(feedMobileContentPaddingClass());
    expect(FEED_MOBILE_CARD_PADDING_CLASS).toBe(feedMobileCardPaddingClass());
    expect(FEED_MOBILE_MEDIA_BLEED_CLASS).toBe(feedMobileMediaBleedClass());
  });

  it("fait annuler au média le padding exact de la carte, quelle que soit la gouttière", () => {
    for (const gutter of [2, 3, 4, 5, 6]) {
      const padding = feedMobileCardPaddingClass(gutter);
      const bleed = feedMobileMediaBleedClass(gutter);
      expect(bleed).toBe(`-mx-${padding.slice("p-".length)}`);
    }
  });

  it("refuse une gouttière non entière ou négative", () => {
    expect(() => feedMobileContentPaddingClass(-1)).toThrow();
    expect(() => feedMobileCardPaddingClass(1.5)).toThrow();
    expect(() => feedMobileMediaBleedClass(Number.NaN)).toThrow();
  });
});
