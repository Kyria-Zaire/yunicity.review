import { describe, expect, it } from "vitest";

import {
  buildMapEventUrl,
  buildMapPlaceUrl,
  buildSearchUrl,
  parseMapParams,
  parseSearchParams,
} from "./explorer-links";

describe("buildSearchUrl", () => {
  it("builds URL with tab/query/city", () => {
    expect(buildSearchUrl({ q: "cathedrale", city: "Reims", tab: "organization" })).toBe(
      "/search?q=cathedrale&city=Reims&tab=lieux",
    );
  });

  it("omits invalid short query and default tab", () => {
    expect(buildSearchUrl({ q: "a", city: "Reims", tab: "all" })).toBe("/search?city=Reims");
  });
});

describe("parseSearchParams", () => {
  it("maps params into normalized search state", () => {
    const parsed = parseSearchParams(new URLSearchParams("q=cafe&city=Reims&tab=tribus"));
    expect(parsed).toEqual({ q: "cafe", city: "Reims", tab: "tribe" });
  });

  it("falls back to all for invalid tab", () => {
    const parsed = parseSearchParams(new URLSearchParams("tab=unknown"));
    expect(parsed.tab).toBe("all");
  });
});

describe("map deep links", () => {
  it("builds place URL", () => {
    expect(buildMapPlaceUrl("cathedrale-notre-dame", { city: "Reims" })).toBe(
      "/map?place=cathedrale-notre-dame&city=Reims",
    );
  });

  it("builds event URL with route mode", () => {
    expect(buildMapEventUrl("ev-1", { route: true })).toBe("/map?event=ev-1&route=1");
  });

  it("parses map params with route flag", () => {
    const parsed = parseMapParams(new URLSearchParams("place=opera&route=1&city=Reims"));
    expect(parsed).toEqual({ city: "Reims", place: "opera", event: "", route: true });
  });
});
