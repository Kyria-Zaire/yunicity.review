import { describe, expect, it } from "vitest";

import type { Tribe } from "@yunicity/types";

import {
  TRIBE_DETAIL_MEDIUM_TABS,
  buildTribeDetailMediumEssentialRules,
  buildTribeDetailMediumLocationMeta,
} from "./tribe-detail-medium-presenter";
import { formatTribeDetailMediumJoinCardTitle } from "./tribe-detail-medium-labels";

const TRIBE: Tribe = {
  id: "t1",
  slug: "createurs-reims",
  name: "Créateurs de Reims",
  description: "Un espace pour partager ses projets.",
  city: "Reims",
  category: "other",
  visibility: "public",
  persistence_kind: "default",
  cover_image_url: null,
  is_featured: false,
  member_limit: 100,
  active_member_count: 12,
  is_archived: false,
  viewer_is_member: false,
  viewer_role: null,
  viewer_notifications_muted: false,
  viewer_has_pending_join_request: false,
  created_at: "2024-01-12T10:00:00.000Z",
  updated_at: "",
};

describe("tribe-detail-medium-presenter", () => {
  it("expose les onglets medium de la maquette", () => {
    expect(TRIBE_DETAIL_MEDIUM_TABS.map((tab) => tab.id)).toEqual([
      "overview",
      "discussions",
      "events",
      "members",
      "about",
    ]);
  });

  it("buildTribeDetailMediumLocationMeta inclut la ville", () => {
    expect(buildTribeDetailMediumLocationMeta(TRIBE)).toContain("Reims");
  });

  it("formatTribeDetailMediumJoinCardTitle personnalise le titre", () => {
    expect(formatTribeDetailMediumJoinCardTitle("Créateurs de Reims")).toBe(
      "Rejoindre Créateurs de Reims",
    );
  });

  it("buildTribeDetailMediumEssentialRules retourne 3 règles", () => {
    expect(buildTribeDetailMediumEssentialRules()).toHaveLength(3);
  });
});
