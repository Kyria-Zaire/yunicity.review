import { describe, expect, it } from "vitest";

import {
  FEED_WEATHER_NOTRE_DAME_IMAGE_URL,
  resolveFeedCityHighlightImage,
} from "./feed-city-highlight";

describe("resolveFeedCityHighlightImage", () => {
  it("retourne l'image Notre-Dame pour Reims", () => {
    expect(resolveFeedCityHighlightImage("Reims")).toBe(FEED_WEATHER_NOTRE_DAME_IMAGE_URL);
    expect(resolveFeedCityHighlightImage("reims")).toBe(FEED_WEATHER_NOTRE_DAME_IMAGE_URL);
  });

  it("utilise l'asset local notre-dame.png", () => {
    const url = resolveFeedCityHighlightImage("Reims");
    expect(url).toBe("/feed/notre-dame.png");
  });

  it("retourne null pour une ville inconnue", () => {
    expect(resolveFeedCityHighlightImage("Lyon")).toBeNull();
    expect(resolveFeedCityHighlightImage("")).toBeNull();
  });
});
