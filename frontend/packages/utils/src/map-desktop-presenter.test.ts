import { describe, expect, it } from "vitest";

import {
  MAP_DESKTOP_THREE_COLUMN_MIN_PX,
  mapDesktopShowsPersistentLeftRail,
  mapDesktopShowsPersistentRightRail,
  resolveMapDesktopRightRailMode,
} from "./map-desktop-presenter";

describe("resolveMapDesktopRightRailMode", () => {
  it("returns discovery when no detail rail", () => {
    expect(resolveMapDesktopRightRailMode(false)).toBe("discovery");
  });

  it("returns detail when detail rail active", () => {
    expect(resolveMapDesktopRightRailMode(true)).toBe("detail");
  });
});

describe("mapDesktopShowsPersistentLeftRail", () => {
  it("is false below desktop breakpoint", () => {
    expect(mapDesktopShowsPersistentLeftRail(1023)).toBe(false);
  });

  it("is true at desktop breakpoint", () => {
    expect(mapDesktopShowsPersistentLeftRail(MAP_DESKTOP_THREE_COLUMN_MIN_PX)).toBe(true);
  });
});

describe("mapDesktopShowsPersistentRightRail", () => {
  it("matches left rail breakpoint", () => {
    expect(mapDesktopShowsPersistentRightRail(800)).toBe(false);
    expect(mapDesktopShowsPersistentRightRail(1280)).toBe(true);
  });
});
