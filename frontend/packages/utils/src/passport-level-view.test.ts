/**
 * PASSPORT-LEVEL-SCALE-01 — le niveau affiché EST le tier Passport.
 *
 * Décision de Kyria (27/10, rappelée le 11/11) : « Niveau actuel » = tier avec son
 * libellé contractuel ; prochain niveau selon les règles existantes (backend
 * `build_progression_hint`) ; au niveau Gold, aucun niveau supérieur inventé ;
 * l'échelle front à cinq paliers disparaît ; aucun calcul depuis les points.
 */
import { describe, expect, it } from "vitest";

import type { PassportMe, PassportTierCode } from "@yunicity/types";

type PassportProgressionHint = NonNullable<PassportMe["progression"]>;

import {
  buildPassportLevel,
  buildPassportLevelFromSummaryTier,
  buildUnavailablePassportLevel,
  isPassportTierCode,
} from "./passport-dashboard";
import { PASSPORT_LEVEL_UNAVAILABLE_LABEL, PASSPORT_TIER_LABELS } from "./passport-level-labels";

/** Progression telle que le backend la renvoie pour chaque tier. */
const BACKEND_PROGRESSION: Record<PassportTierCode, Pick<PassportProgressionHint, "next_tier_code" | "next_tier_label">> = {
  basic: { next_tier_code: "silver", next_tier_label: "Silver" },
  silver: { next_tier_code: "gold", next_tier_label: "Gold" },
  gold: { next_tier_code: null, next_tier_label: null },
  neo_arrivant: { next_tier_code: "silver", next_tier_label: "Silver" },
  press_creator: { next_tier_code: null, next_tier_label: null },
  business: { next_tier_code: null, next_tier_label: null },
};

function passport(
  code: PassportTierCode,
  overrides: { reputation_score?: number; progression?: PassportMe["progression"] } = {},
): PassportMe {
  const reputation = overrides.reputation_score ?? 50;
  return {
    id: "p1",
    user_id: "u1",
    city: "Reims",
    passport_number: "RMS-000001",
    qr_token: "fictif",
    status: "active",
    tier: { id: `t-${code}`, code, name: code, description: null, display_order: 1, flags: {} },
    stats: { stamps_count: 0, redemptions_count: 0, last_stamp_at: null },
    reputation_score: reputation,
    progression:
      overrides.progression === undefined
        ? { ...BACKEND_PROGRESSION[code], hint: null, reputation_score: reputation, points_to_next: null }
        : overrides.progression,
    tier_unlocked_at: null,
    onboarding_completed: true,
    onboarding_step: null,
    activated_at: null,
    created_at: "2026-11-11T10:00:00Z",
    updated_at: "2026-11-11T10:00:00Z",
  };
}

const BADGE_OR_SCALE_NAMES = [
  "Habitant",
  "Contributeur local",
  "Explorateur",
  "Explorateur local",
  "Ambassadeur",
  "Ambassadeur local",
  "Référent local",
];

describe("échelle d'engagement Basic → Silver → Gold", () => {
  it("Basic : « Citoyen·ne », prochain niveau Silver", () => {
    expect(buildPassportLevel(passport("basic"))).toEqual({
      tierCode: "basic",
      currentLabel: "Citoyen·ne",
      nextLabel: "Silver",
    });
  });

  it("Silver : « Silver », prochain niveau Gold — même à 50 points (ex-« Ambassadeur local »)", () => {
    expect(buildPassportLevel(passport("silver", { reputation_score: 50 }))).toEqual({
      tierCode: "silver",
      currentLabel: "Silver",
      nextLabel: "Gold",
    });
  });

  it("Gold : « Gold », AUCUN niveau supérieur", () => {
    expect(buildPassportLevel(passport("gold", { reputation_score: 999 }))).toEqual({
      tierCode: "gold",
      currentLabel: "Gold",
      nextLabel: null,
    });
  });

  it("Gold : aucun niveau inventé même si la progression reçue en propose un", () => {
    const incoherent = passport("gold", {
      progression: { next_tier_code: "silver", next_tier_label: "Silver", hint: null, reputation_score: 80, points_to_next: 5 },
    });
    expect(buildPassportLevel(incoherent).nextLabel).toBeNull();
  });
});

describe("statuts particuliers — règles existantes, pas forcés dans l'échelle", () => {
  it("Néo-arrivant : son libellé, prochain niveau Silver (passerelle backend)", () => {
    expect(buildPassportLevel(passport("neo_arrivant"))).toEqual({
      tierCode: "neo_arrivant",
      currentLabel: "Néo-arrivant",
      nextLabel: "Silver",
    });
  });

  it.each(["press_creator", "business"] as const)("%s : son libellé, aucun prochain niveau", (code) => {
    expect(buildPassportLevel(passport(code))).toEqual({
      tierCode: code,
      currentLabel: PASSPORT_TIER_LABELS[code],
      nextLabel: null,
    });
  });
});

describe("le niveau ne dépend d'aucun score", () => {
  it.each([0, 15, 25, 50, 70, 999])("Silver à %i points reste « Silver »", (score) => {
    expect(buildPassportLevel(passport("silver", { reputation_score: score })).currentLabel).toBe("Silver");
  });

  it("progression absente : libellé du tier, pas de prochain niveau inventé", () => {
    expect(buildPassportLevel(passport("silver", { progression: null }))).toEqual({
      tierCode: "silver",
      currentLabel: "Silver",
      nextLabel: null,
    });
  });

  it.each([
    ["basic", "gold"],
    ["basic", "neo_arrivant"],
    ["silver", "basic"],
    ["silver", "silver"],
    ["neo_arrivant", "gold"],
    ["neo_arrivant", "basic"],
    ["gold", "gold"],
    ["press_creator", "silver"],
    ["press_creator", "gold"],
    ["business", "silver"],
    ["business", "gold"],
  ] as const)("transition incohérente %s → %s : aucun prochain niveau", (current, next) => {
    const odd = passport(current, {
      progression: { next_tier_code: next, next_tier_label: next, hint: null, reputation_score: 10, points_to_next: 5 },
    });
    expect(buildPassportLevel(odd).nextLabel).toBeNull();
    expect(buildPassportLevel(odd).currentLabel).toBe(PASSPORT_TIER_LABELS[current]);
  });

  it("seules transitions affichées : Basic → Silver, Silver → Gold, Néo-arrivant → Silver", () => {
    expect(buildPassportLevel(passport("basic")).nextLabel).toBe("Silver");
    expect(buildPassportLevel(passport("silver")).nextLabel).toBe("Gold");
    expect(buildPassportLevel(passport("neo_arrivant")).nextLabel).toBe("Silver");
    for (const code of ["gold", "press_creator", "business"] as const) {
      expect(buildPassportLevel(passport(code)).nextLabel).toBeNull();
    }
  });

  it("prochain niveau non reconnu par le contrat : ignoré", () => {
    const odd = passport("basic", {
      progression: {
        next_tier_code: "platine" as unknown as PassportTierCode,
        next_tier_label: "Platine",
        hint: null,
        reputation_score: 10,
        points_to_next: 5,
      },
    });
    expect(buildPassportLevel(odd).nextLabel).toBeNull();
  });

  it("aucun libellé de badge ou de l'ancienne échelle, quel que soit le tier", () => {
    for (const code of Object.keys(BACKEND_PROGRESSION) as PassportTierCode[]) {
      const view = buildPassportLevel(passport(code, { reputation_score: 50 }));
      expect(BADGE_OR_SCALE_NAMES).not.toContain(view.currentLabel);
      expect(BADGE_OR_SCALE_NAMES).not.toContain(view.nextLabel);
    }
  });
});

describe("données indisponibles et repli (décision D3)", () => {
  it("tier du passport non reconnu : « Niveau indisponible »", () => {
    const unknown = passport("basic");
    unknown.tier = { ...unknown.tier, code: "inconnu" as unknown as PassportTierCode };
    expect(buildPassportLevel(unknown)).toEqual(buildUnavailablePassportLevel());
  });

  it("repli sur summary.passport_tier reconnu : son libellé, SANS prochain niveau", () => {
    expect(buildPassportLevelFromSummaryTier("silver")).toEqual({
      tierCode: "silver",
      currentLabel: "Silver",
      nextLabel: null,
    });
  });

  it.each([null, undefined, "", "Silver", "Citoyen", "inconnu"])(
    "repli sur summary.passport_tier non reconnu (%s) : « Niveau indisponible »",
    (value) => {
      expect(buildPassportLevelFromSummaryTier(value)).toEqual(buildUnavailablePassportLevel());
    },
  );

  it("« Niveau indisponible » : aucun tier, aucun prochain niveau", () => {
    expect(buildUnavailablePassportLevel()).toEqual({
      tierCode: null,
      currentLabel: PASSPORT_LEVEL_UNAVAILABLE_LABEL,
      nextLabel: null,
    });
    expect(PASSPORT_LEVEL_UNAVAILABLE_LABEL).toBe("Niveau indisponible");
  });

  it("isPassportTierCode ne reconnaît que les six codes du contrat", () => {
    for (const code of Object.keys(PASSPORT_TIER_LABELS)) expect(isPassportTierCode(code)).toBe(true);
    for (const value of ["Silver", "platine", "", null, undefined, 3]) expect(isPassportTierCode(value)).toBe(false);
  });
});
