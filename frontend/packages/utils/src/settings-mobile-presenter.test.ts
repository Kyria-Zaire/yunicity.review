import { describe, expect, it } from "vitest";

import {
  SETTINGS_MOBILE_CATEGORIES,
  settingsMobileSectionDomId,
  settingsMobileSessionsLabel,
} from "./settings-mobile-presenter";

describe("settings-mobile-presenter", () => {
  it("expose 5 catégories", () => {
    expect(SETTINGS_MOBILE_CATEGORIES).toHaveLength(5);
  });

  it("préfixe les ancres mobile", () => {
    expect(settingsMobileSectionDomId("account")).toBe("settings-mobile-account");
  });

  it("formate le label sessions", () => {
    expect(settingsMobileSessionsLabel(1)).toBe("Sessions actives · 1");
  });
});
