import { describe, expect, it } from "vitest";

import { homeGreeting, homeComposerPlaceholder, isEventWithinDays } from "./home-labels";

describe("homeGreeting", () => {
  it("uses Remois for Reims", () => {
    expect(homeGreeting("Reims")).toBe("Bonjour, Rémois");
    expect(homeGreeting("reims")).toBe("Bonjour, Rémois");
  });

  it("uses city name otherwise", () => {
    expect(homeGreeting("Lyon")).toBe("Bonjour, Lyon");
  });
});

describe("homeComposerPlaceholder", () => {
  it("includes city", () => {
    expect(homeComposerPlaceholder("Reims")).toContain("Reims");
  });
});

describe("isEventWithinDays", () => {
  it("returns true for event within window", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isEventWithinDays(tomorrow.toISOString(), 7)).toBe(true);
  });
});
