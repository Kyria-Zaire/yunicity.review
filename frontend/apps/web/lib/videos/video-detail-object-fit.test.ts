import { describe, expect, it } from "vitest";

import { isPortraitMediumDetail, resolveMobileDetailObjectFit } from "./video-detail-object-fit";

describe("resolveMobileDetailObjectFit", () => {
  it("portrait medium detail → object-contain", () => {
    expect(resolveMobileDetailObjectFit(720, 1328, true)).toBe("object-contain");
  });

  it("landscape medium detail → object-cover (comportement conservé)", () => {
    expect(resolveMobileDetailObjectFit(1280, 720, true)).toBe("object-cover");
  });

  it("sans portraitContain → object-cover", () => {
    expect(resolveMobileDetailObjectFit(720, 1328, false)).toBe("object-cover");
  });

  it("dimensions carrées → object-cover", () => {
    expect(resolveMobileDetailObjectFit(1080, 1080, true)).toBe("object-cover");
  });
});

describe("isPortraitMediumDetail — poster vs frame medium", () => {
  it("portrait 720×1328 → poster dédié object-contain", () => {
    expect(isPortraitMediumDetail(720, 1328, true)).toBe(true);
  });

  it("frame portrait medium → object-contain", () => {
    expect(resolveMobileDetailObjectFit(720, 1328, true)).toBe("object-contain");
  });

  it("paysage medium inchangé → pas de poster dédié portrait", () => {
    expect(isPortraitMediumDetail(1280, 720, true)).toBe(false);
    expect(resolveMobileDetailObjectFit(1280, 720, true)).toBe("object-cover");
  });

  it("mobile/desktop sans portraitContain → pas de poster dédié", () => {
    expect(isPortraitMediumDetail(720, 1328, false)).toBe(false);
  });
});
