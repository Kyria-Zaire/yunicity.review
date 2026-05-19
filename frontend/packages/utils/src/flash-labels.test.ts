import { describe, expect, it } from "vitest";

import { FLASH_BADGE_LABEL, formatFlashTimerLabel } from "./flash-labels";

describe("formatFlashTimerLabel", () => {
  it("retourne null si pas flash", () => {
    expect(formatFlashTimerLabel({ is_flash: false })).toBeNull();
  });

  it("formate les heures et minutes", () => {
    expect(
      formatFlashTimerLabel({ is_flash: true, remaining_hours: 2, remaining_minutes: 15 }),
    ).toBe("Se termine dans 2h 15m");
  });

  it("utilise le libellé journée pour longues fenêtres", () => {
    expect(
      formatFlashTimerLabel({ is_flash: true, remaining_hours: 10, remaining_minutes: 0 }),
    ).toBe("Disponible encore aujourd'hui");
  });

  it("gère les minutes seules", () => {
    expect(
      formatFlashTimerLabel({ is_flash: true, remaining_hours: 0, remaining_minutes: 45 }),
    ).toBe("Encore 45 min");
  });
});

describe("FLASH_BADGE_LABEL", () => {
  it("reste sobre", () => {
    expect(FLASH_BADGE_LABEL).toBe("Flash");
  });
});
