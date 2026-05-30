import { describe, expect, it } from "vitest";

import { buildPublicPlaceHref } from "./place-routing";

describe("place-routing", () => {
  it("builds /places/{slug} with optional city query", () => {
    expect(buildPublicPlaceHref("pittaya", "Reims")).toBe("/places/pittaya?city=Reims");
    expect(buildPublicPlaceHref("cathedrale-notre-dame", "")).toBe(
      "/places/cathedrale-notre-dame",
    );
  });

  /**
   * Résolution runtime (usePlaceDetail) : cultural_place prioritaire sur partner
   * en cas de collision de slug — voir place-routing.ts.
   */
  it("documents cultural_place priority over partner on slug collision", () => {
    expect(buildPublicPlaceHref("shared-slug", "Reims")).toContain("/places/shared-slug");
  });
});
