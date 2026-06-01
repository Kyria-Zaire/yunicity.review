import { describe, expect, it } from "vitest";

import {
  buildSettingsAccountStatus,
  buildSettingsDisplayName,
  buildSettingsHubGroups,
  buildSettingsVerificationView,
  detectWebClientLabel,
  formatSettingsDate,
  settingsSectionDomId,
} from "./settings-portal";

describe("settings-portal", () => {
  it("buildSettingsHubGroups exposes account and preferences sections", () => {
    const groups = buildSettingsHubGroups();
    expect(groups).toHaveLength(3);
    expect(groups[0]?.rows.some((row) => row.id === "personal")).toBe(true);
    expect(groups[1]?.rows.some((row) => row.id === "notifications")).toBe(true);
    expect(groups[0]?.rows.find((row) => row.id === "security")?.available).toBe(false);
  });

  it("buildSettingsDisplayName prefers profile display name", () => {
    expect(
      buildSettingsDisplayName(
        {
          id: "1",
          user_id: "u1",
          username: "kevin",
          display_name: "Kevin M.",
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
          created_at: "2024-01-12T00:00:00Z",
          updated_at: "2024-01-12T00:00:00Z",
        },
        {
          id: "u1",
          email: "kevin@yunicity.com",
          full_name: "Kevin Martin",
          city: "Reims",
          is_active: true,
          is_verified: true,
          roles: ["USER"],
          permissions: [],
          created_at: "2024-01-12T00:00:00Z",
          updated_at: "2024-01-12T00:00:00Z",
        },
      ),
    ).toBe("Kevin M.");
  });

  it("buildSettingsVerificationView reflects auth and onboarding", () => {
    const view = buildSettingsVerificationView(
      {
        id: "u1",
        email: "a@b.com",
        full_name: "A",
        city: null,
        is_active: true,
        is_verified: false,
        roles: ["USER"],
        permissions: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "1",
        user_id: "u1",
        username: "a",
        display_name: null,
        bio: null,
        avatar_url: null,
        banner_url: null,
        city: null,
        interests: [],
        visibility: "public",
        onboarding_completed: false,
        onboarding_step: null,
        preferred_language: null,
        notification_preferences: {},
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    );
    expect(view.verified).toBe(false);
    expect(view.onboardingCompleted).toBe(false);
  });

  it("buildSettingsAccountStatus uses real user timestamps", () => {
    const status = buildSettingsAccountStatus(
      {
        id: "u1",
        email: "a@b.com",
        full_name: "A",
        city: null,
        is_active: true,
        is_verified: true,
        roles: ["USER"],
        permissions: [],
        created_at: "2024-01-12T00:00:00Z",
        updated_at: "2024-05-28T07:41:00Z",
      },
      [],
      "macOS • Safari",
    );
    expect(status?.memberSinceLabel).toContain("2024");
    expect(status?.currentDeviceLabel).toBe("macOS • Safari");
    expect(status?.pushDeviceCount).toBe(0);
  });

  it("detectWebClientLabel parses common browsers", () => {
    expect(
      detectWebClientLabel(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      ),
    ).toContain("Safari");
  });

  it("formatSettingsDate returns french label", () => {
    expect(formatSettingsDate("2024-01-12T00:00:00Z")).toMatch(/2024/);
  });

  it("settingsSectionDomId is stable", () => {
    expect(settingsSectionDomId("personal")).toBe("settings-personal");
  });
});
