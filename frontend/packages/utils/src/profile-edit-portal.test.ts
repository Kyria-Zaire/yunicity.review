import { describe, expect, it } from "vitest";

import type { ProfileMe } from "@yunicity/types";

import {
  buildProfileEditCompletion,
  buildProfileEditDraft,
  buildProfileEditSavePayload,
  joinDisplayName,
  splitDisplayName,
} from "./profile-edit-portal";

function baseProfile(overrides: Partial<ProfileMe> = {}): ProfileMe {
  return {
    id: "p1",
    user_id: "u1",
    username: "kyria_d",
    display_name: "Kyria D.",
    bio: "Bio test",
    avatar_url: "https://cdn.example/a.jpg",
    banner_url: null,
    city: "Reims",
    interests: ["culture"],
    visibility: "public",
    onboarding_completed: true,
    onboarding_step: "done",
    preferred_language: "fr",
    notification_preferences: {},
    has_active_passport: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("splitDisplayName", () => {
  it("splits first and last name", () => {
    expect(splitDisplayName("Kyria D.")).toEqual({
      firstName: "Kyria",
      lastName: "D.",
    });
  });

  it("handles single token", () => {
    expect(splitDisplayName("Kyria")).toEqual({ firstName: "Kyria", lastName: "" });
  });
});

describe("joinDisplayName", () => {
  it("joins trimmed parts", () => {
    expect(joinDisplayName("Kyria", "D.")).toBe("Kyria D.");
  });
});

describe("buildProfileEditCompletion", () => {
  it("computes percent from filled fields", () => {
    const result = buildProfileEditCompletion(baseProfile({ banner_url: null }));
    expect(result.percent).toBe(80);
    expect(result.items.find((item) => item.id === "banner")?.done).toBe(false);
  });
});

describe("buildProfileEditDraft", () => {
  it("round-trips display name", () => {
    const draft = buildProfileEditDraft(baseProfile());
    expect(draft.firstName).toBe("Kyria");
    expect(draft.lastName).toBe("D.");
  });
});

describe("buildProfileEditSavePayload", () => {
  it("maps draft to API payload", () => {
    const profile = baseProfile();
    const draft = buildProfileEditDraft(profile);
    draft.bio = "  Nouvelle bio  ";
    const payload = buildProfileEditSavePayload(profile, draft);
    expect(payload.bio).toBe("Nouvelle bio");
    expect(payload.display_name).toBe("Kyria D.");
  });
});
