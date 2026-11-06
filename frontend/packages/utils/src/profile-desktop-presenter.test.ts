import { describe, expect, it } from "vitest";

import type { LocalEvent, Tribe } from "@yunicity/types";

import type { PassportLevelView } from "./passport-dashboard";
import { PASSPORT_JOURNEY_LEVELS } from "./passport-dashboard";
import {
  buildProfileDesktopTribeRailItems,
  buildProfilePublicTribeRailItems,
  formatProfileDesktopMemberSince,
  resolveProfileDesktopNextOuting,
  resolveProfileDesktopPassportSteps,
  resolveProfileDesktopVisibilityLabel,
} from "./profile-desktop-presenter";

function tribe(partial: Partial<Tribe> & Pick<Tribe, "id" | "slug" | "name">): Tribe {
  return {
    description: "",
    city: "Reims",
    category: "other",
    visibility: "public",
    persistence_kind: "persistent",
    cover_image_url: null,
    is_featured: false,
    member_limit: 100,
    active_member_count: 10,
    is_archived: false,
    viewer_is_member: false,
    viewer_role: null,
    viewer_notifications_muted: false,
    viewer_has_pending_join_request: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("profile-desktop-presenter", () => {
  it("formatProfileDesktopMemberSince formats French month year", () => {
    expect(formatProfileDesktopMemberSince("2026-05-10T12:00:00.000Z")).toMatch(/Membre depuis/i);
  });

  it("resolveProfileDesktopVisibilityLabel maps visibility", () => {
    expect(resolveProfileDesktopVisibilityLabel("public")).toBe("Profil public");
    expect(resolveProfileDesktopVisibilityLabel("private")).toBe("Profil privé");
  });

  it("resolveProfileDesktopPassportSteps uses journey levels", () => {
    const levelView: PassportLevelView = {
      level: PASSPORT_JOURNEY_LEVELS[2]!,
      points: 30,
      nextLevel: PASSPORT_JOURNEY_LEVELS[3]!,
      nextLevelLabel: PASSPORT_JOURNEY_LEVELS[3]!.label,
      pointsToNext: 20,
      progressPercent: 40,
      backendTierLabel: "Explorateur",
    };
    const steps = resolveProfileDesktopPassportSteps(levelView);
    expect(steps.total).toBe(5);
    expect(steps.done).toBe(3);
    expect(steps.levelLabel).toBe("Explorateur");
  });

  it("buildProfilePublicTribeRailItems maps public tribes as member", () => {
    const items = buildProfilePublicTribeRailItems({
      city: "Reims",
      tribes: [
        tribe({ id: "1", slug: "photo", name: "Photo Reims", visibility: "public" }),
        tribe({ id: "2", slug: "secret", name: "Privée", visibility: "private_invite" }),
      ],
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("Photo Reims");
    expect(items[0]?.status).toBe("member");
    expect(items[0]?.href).toContain("/tribes/photo");
  });

  it("buildProfileDesktopTribeRailItems includes member and pending", () => {
    const items = buildProfileDesktopTribeRailItems({
      city: "Reims",
      tribes: [
        tribe({ id: "1", slug: "createurs", name: "Créateurs", viewer_is_member: true }),
        tribe({
          id: "2",
          slug: "etudiants",
          name: "Étudiants",
          viewer_has_pending_join_request: true,
        }),
        tribe({ id: "3", slug: "other", name: "Other" }),
      ],
    });
    expect(items).toHaveLength(2);
    expect(items[0]?.status).toBe("member");
    expect(items[1]?.status).toBe("pending");
  });

  it("resolveProfileDesktopNextOuting picks soonest upcoming saved event", () => {
    const now = new Date("2026-05-01T10:00:00.000Z");
    const outing = resolveProfileDesktopNextOuting(
      [
        {
          id: "e2",
          title: "Marché",
          starts_at: "2026-05-10T10:00:00.000Z",
          is_cancelled: false,
        } as LocalEvent,
        {
          id: "e1",
          title: "Concert",
          starts_at: "2026-05-03T18:00:00.000Z",
          is_cancelled: false,
        } as LocalEvent,
      ],
      now,
    );
    expect(outing?.title).toBe("Concert");
    expect(outing?.href).toContain("/events/e1");
  });
});
