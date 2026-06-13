import { describe, expect, it } from "vitest";

import type { NeighborhoodContributionMeItem } from "@yunicity/types";

import {
  PROFILE_MEMORIES_EMPTY_CTA,
  PROFILE_MEMORIES_EMPTY_HREF,
  PROFILE_MEMORIES_EMPTY_TITLE,
  PROFILE_MEMORY_STATUS_BADGE,
  PROFILE_MEMORY_STATUS_COPY,
  buildProfileMemoryCardSections,
  groupProfileMemoriesByStatus,
  resolveProfileMemoryStatusMessage,
  sortProfileMemoriesDescending,
} from "./profile-memories-presenter";
import { contributionHasVisibleTitle } from "./neighborhood-contribution-presenter";

const BASE_ITEM: NeighborhoodContributionMeItem = {
  id: "c1",
  neighborhood: { id: "n1", slug: "boulingrin", display_name: "Boulingrin" },
  title: "Notre rituel",
  body: "Les halles du samedi matin, c'est notre rendez-vous en famille depuis des années.",
  status: "pending",
  submitted_at: "2026-06-10T10:00:00.000Z",
  approved_at: null,
  reviewed_at: null,
  display_identity_label: "Camille R.",
  display_identity_type: "PSEUDO",
  passport_verified_snapshot: false,
  rejection_reason_code: null,
  rejection_message: null,
};

describe("profile-memories-presenter", () => {
  it("exposes empty state copy and explorer CTA", () => {
    expect(PROFILE_MEMORIES_EMPTY_TITLE).toContain("aucun souvenir");
    expect(PROFILE_MEMORIES_EMPTY_CTA).toBe("Explorer les quartiers");
    expect(PROFILE_MEMORIES_EMPTY_HREF).toBe("/neighborhoods");
  });

  it("maps pending badge and copy", () => {
    expect(PROFILE_MEMORY_STATUS_BADGE.pending).toBe("En relecture");
    expect(PROFILE_MEMORY_STATUS_COPY.pending).toContain("relu");
    expect(resolveProfileMemoryStatusMessage(BASE_ITEM)).toBe(PROFILE_MEMORY_STATUS_COPY.pending);
  });

  it("maps approved badge and copy", () => {
    const approved = { ...BASE_ITEM, status: "approved" as const, approved_at: "2026-06-12T10:00:00.000Z" };
    expect(PROFILE_MEMORY_STATUS_BADGE.approved).toBe("Partagé");
    expect(resolveProfileMemoryStatusMessage(approved)).toContain("mémoire");
  });

  it("uses pedagogical rejection_message and never Refusé", () => {
    const rejected: NeighborhoodContributionMeItem = {
      ...BASE_ITEM,
      status: "rejected",
      reviewed_at: "2026-06-11T10:00:00.000Z",
      rejection_reason_code: "NOT_A_MEMORY",
      rejection_message: "Cela ressemblait davantage à un avis qu'à un souvenir personnel.",
    };
    expect(PROFILE_MEMORY_STATUS_BADGE.rejected).toBe("Non publié");
    expect(PROFILE_MEMORY_STATUS_BADGE.rejected).not.toBe("Refusé");
    expect(resolveProfileMemoryStatusMessage(rejected)).toBe(rejected.rejection_message);
  });

  it("hides title when null or blank", () => {
    const sections = buildProfileMemoryCardSections({ ...BASE_ITEM, title: null });
    expect(sections.title).toBeNull();
    expect(contributionHasVisibleTitle("   ")).toBe(false);
  });

  it("sorts memories by submitted_at descending", () => {
    const older = { ...BASE_ITEM, id: "old", submitted_at: "2026-06-01T10:00:00.000Z" };
    const newer = { ...BASE_ITEM, id: "new", submitted_at: "2026-06-12T10:00:00.000Z" };
    expect(sortProfileMemoriesDescending([older, newer]).map((item) => item.id)).toEqual([
      "new",
      "old",
    ]);
  });

  it("groups pending before approved before rejected", () => {
    const pending = { ...BASE_ITEM, id: "p1", status: "pending" as const };
    const approved = {
      ...BASE_ITEM,
      id: "a1",
      status: "approved" as const,
      approved_at: "2026-06-12T10:00:00.000Z",
    };
    const rejected = {
      ...BASE_ITEM,
      id: "r1",
      status: "rejected" as const,
      rejection_message: "Message pédagogique.",
    };
    const groups = groupProfileMemoriesByStatus([rejected, approved, pending]);
    expect(groups.map((group) => group.status)).toEqual(["pending", "approved", "rejected"]);
  });

  it("builds card sections with neighborhood, body and status", () => {
    const sections = buildProfileMemoryCardSections(BASE_ITEM, "Reims", new Date("2026-06-13T10:00:00Z"));
    expect(sections.neighborhoodName).toBe("Boulingrin");
    expect(sections.neighborhoodHref).toContain("/neighborhoods/boulingrin");
    expect(sections.title).toBe("Notre rituel");
    expect(sections.body).toContain("halles");
    expect(sections.statusBadge).toBe("En relecture");
    expect(sections.dateLabel).toBeTruthy();
  });
});
