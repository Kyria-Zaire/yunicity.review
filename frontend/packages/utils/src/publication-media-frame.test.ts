import { describe, expect, it } from "vitest";

import {
  classifyMediaOrientation,
  defaultFeedOrientation,
  feedAspectRatioForOrientation,
  feedObjectFitForKind,
  publicationMediaGridLayout,
  slicePublicationMediaForGrid,
  viewerObjectFit,
} from "./publication-media-frame";

describe("MEDIA-02 — classifyMediaOrientation", () => {
  it("portrait 9:16", () => {
    expect(classifyMediaOrientation(1080, 1920)).toBe("portrait");
  });

  it("portrait 3:4", () => {
    expect(classifyMediaOrientation(900, 1200)).toBe("portrait");
  });

  it("carré 1:1", () => {
    expect(classifyMediaOrientation(1080, 1080)).toBe("square");
  });

  it("paysage 4:3", () => {
    expect(classifyMediaOrientation(1600, 1200)).toBe("landscape");
  });

  it("paysage 16:9", () => {
    expect(classifyMediaOrientation(1920, 1080)).toBe("landscape");
  });

  it("ultra-large", () => {
    expect(classifyMediaOrientation(3200, 900)).toBe("landscape");
  });

  it("refuse dimensions invalides", () => {
    expect(classifyMediaOrientation(0, 100)).toBeNull();
    expect(classifyMediaOrientation(100, -1)).toBeNull();
    expect(classifyMediaOrientation(Number.NaN, 10)).toBeNull();
  });

  it("ne déduit jamais depuis une extension (API pure dimensions)", () => {
    // Contrôle de régression : la classification ignore tout contexte hors w/h.
    expect(classifyMediaOrientation(100, 200)).toBe("portrait");
    expect(classifyMediaOrientation(200, 100)).toBe("landscape");
  });
});

describe("MEDIA-02 — ratios feed", () => {
  it("portrait → 4:5, carré → 1:1, paysage → 16:9", () => {
    expect(feedAspectRatioForOrientation("portrait")).toBe("4 / 5");
    expect(feedAspectRatioForOrientation("square")).toBe("1 / 1");
    expect(feedAspectRatioForOrientation("landscape")).toBe("16 / 9");
  });

  it("défaut feed avant mesures = portrait (plafond le plus haut)", () => {
    expect(defaultFeedOrientation()).toBe("portrait");
  });

  it("images cover, vidéos contain, viewer contain", () => {
    expect(feedObjectFitForKind("image")).toBe("cover");
    expect(feedObjectFitForKind("video")).toBe("contain");
    expect(viewerObjectFit()).toBe("contain");
  });
});

describe("MEDIA-02 — grille multi-médias", () => {
  it("2 / 3 / 4 / 5+ médias", () => {
    expect(publicationMediaGridLayout(2)).toBe("pair");
    expect(publicationMediaGridLayout(3)).toBe("triple");
    expect(publicationMediaGridLayout(4)).toBe("quad");
    const five = slicePublicationMediaForGrid(["a", "b", "c", "d", "e"]);
    expect(five.visible).toEqual(["a", "b", "c", "d"]);
    expect(five.overflowCount).toBe(1);
    expect(publicationMediaGridLayout(five.visible.length)).toBe("quad");
  });

  it("conserve l'ordre de publication", () => {
    const items = ["m1", "m2", "m3", "m4", "m5"];
    expect(slicePublicationMediaForGrid(items).visible).toEqual(["m1", "m2", "m3", "m4"]);
  });
});
