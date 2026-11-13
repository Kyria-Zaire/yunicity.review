import { describe, expect, it } from "vitest";

import {
  formatSettingsDesktopSessionLabel,
  maskSettingsEmail,
  settingsDesktopPrivacySummary,
  settingsDesktopUsername,
} from "./settings-desktop-presenter";
import type { ProfileMe } from "@yunicity/types";

function profile(overrides: Partial<ProfileMe> = {}): ProfileMe {
  return {
    id: "p1",
    user_id: "u1",
    username: "kyria",
    display_name: "Kyria M.",
    bio: null,
    avatar_url: null,
    banner_url: null,
    city: "Reims",
    interests: [],
    visibility: "public",
    onboarding_completed: true,
    onboarding_step: null,
    preferred_language: "fr",
    notification_preferences: {},
    has_active_passport: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("settings-desktop-presenter", () => {
  it("masque l'email", () => {
    expect(maskSettingsEmail("kyria@example.com")).toBe("k••••@example.com");
  });

  it("formate le username", () => {
    expect(settingsDesktopUsername(profile())).toBe("@kyria");
  });

  it("résume la confidentialité publique", () => {
    expect(settingsDesktopPrivacySummary("public").publicProfile).toBe("Activé");
    expect(settingsDesktopPrivacySummary("private").publicProfile).toBe("Désactivé");
  });

  it("formate la session appareil", () => {
    expect(formatSettingsDesktopSessionLabel("Windows • Edge")).toBe("Edge sur Windows");
  });
});
