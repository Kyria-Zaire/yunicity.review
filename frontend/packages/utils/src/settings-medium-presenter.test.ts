import { describe, expect, it } from "vitest";

import { SETTINGS_MEDIUM_TABS, settingsMediumSectionDomId } from "./settings-medium-presenter";

describe("settings-medium-presenter", () => {
  it("expose 5 onglets medium", () => {
    expect(SETTINGS_MEDIUM_TABS).toHaveLength(5);
    expect(SETTINGS_MEDIUM_TABS[0]?.id).toBe("general");
  });

  it("préfixe les ancres medium", () => {
    expect(settingsMediumSectionDomId("account")).toBe("settings-medium-account");
  });
});
