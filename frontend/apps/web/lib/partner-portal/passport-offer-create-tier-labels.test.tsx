// @vitest-environment jsdom
/**
 * PARTNER-OFFER-TIER-LABELS-01 — champ « Niveaux éligibles » du formulaire partenaire,
 * aux trois variantes (desktop, medium, mobile) : libellés de tiers contractuels, aucun
 * nom de badge, et chaque option renvoie toujours le MÊME code qu'avant.
 */
import { PassportOfferCreateDesktopForm } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-form";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import type { OrganizationMeItem } from "@yunicity/types";
import { createEmptyPassportOfferCreateDraft } from "@yunicity/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/culture/cultural-image", () => ({
  CulturalImage: () => null,
}));

const ORGANIZATION: OrganizationMeItem = {
  id: "org-fictive",
  slug: "cafe-fictif",
  name: "Café Fictif",
  type: "commerce",
  city: "Reims",
  verification_status: "verified",
  visibility: "public",
  onboarding_completed: true,
  member_role: "owner",
  member_status: "active",
};

const EXPECTED: Array<[string, "all" | "basic" | "silver"]> = [
  ["Tous les niveaux actifs", "all"],
  ["Citoyen·ne, Silver et Gold", "basic"],
  ["Silver et Gold", "silver"],
];

afterEach(cleanup);

describe.each(["desktop", "medium", "mobile"] as const)("formulaire partenaire, variante %s", (variant) => {
  function renderEligibility() {
    const onChange = vi.fn();
    const { container } = render(
      <PassportOfferCreateDesktopForm
        variant={variant}
        draft={createEmptyPassportOfferCreateDraft(ORGANIZATION.id)}
        organization={ORGANIZATION}
        partner={null}
        onChange={onChange}
      />,
    );
    const section = container.querySelector<HTMLElement>("#passport-offer-create-eligibility");
    if (!section) throw new Error("section « Éligibilité » introuvable");
    return { section, onChange };
  }

  it("affiche les tiers contractuels, sans nom de badge", () => {
    const { section } = renderEligibility();
    for (const [label] of EXPECTED) {
      expect(within(section).getByRole("button", { name: label })).toBeTruthy();
    }
    expect(section.textContent).not.toMatch(/Explorateur|Ambassadeur/);
  });

  it.each(EXPECTED)("« %s » sélectionne toujours le code %s", (label, code) => {
    const { section, onChange } = renderEligibility();
    fireEvent.click(within(section).getByRole("button", { name: label }));
    expect(onChange).toHaveBeenCalledWith({ tierScope: code });
  });
});
