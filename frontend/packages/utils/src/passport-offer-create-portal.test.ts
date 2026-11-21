import { describe, expect, it } from "vitest";

import {
  PASSPORT_OFFER_CREATE_TIER_OPTIONS,
  buildPassportOfferCreatePayload,
  createEmptyPassportOfferCreateDraft,
  type PassportOfferCreateTierScope,
} from "./passport-offer-create-portal";

/**
 * PARTNER-OFFER-TIER-LABELS-01 — champ « Niveaux éligibles » du formulaire partenaire.
 * Les codes, l'ordre et la liste des options sont un CONTRAT : seuls les libellés changent.
 */
describe("options « Niveaux éligibles »", () => {
  it("garde les codes et l'ordre : all, basic, silver — pas de Gold ajouté", () => {
    expect(PASSPORT_OFFER_CREATE_TIER_OPTIONS.map((option) => option.value)).toEqual([
      "all",
      "basic",
      "silver",
    ]);
  });

  it("énumère les tiers contractuels qui accèdent réellement à l'offre (tier_can_access)", () => {
    expect(PASSPORT_OFFER_CREATE_TIER_OPTIONS.map((option) => option.label)).toEqual([
      "Tous les niveaux actifs",
      "Citoyen·ne, Silver et Gold",
      "Silver et Gold",
    ]);
  });

  it("n'emploie aucun nom de badge comme niveau (PRD-301 §8.2)", () => {
    for (const option of PASSPORT_OFFER_CREATE_TIER_OPTIONS) {
      expect(option.label).not.toMatch(/Explorateur|Ambassadeur/);
    }
  });
});

describe("code envoyé tier_code_required", () => {
  it.each<[PassportOfferCreateTierScope, string | null]>([
    ["all", null],
    ["basic", "basic"],
    ["silver", "silver"],
  ])("tierScope %s → %s", (tierScope, expected) => {
    const draft = { ...createEmptyPassportOfferCreateDraft("org-fictive"), tierScope };
    expect(buildPassportOfferCreatePayload(draft).tier_code_required).toBe(expected);
  });
});
