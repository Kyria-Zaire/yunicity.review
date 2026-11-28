// @vitest-environment jsdom
/**
 * PARTNER-OFFER-CREATE-DESKTOP-LAYOUT-01 — corrections locales de lisibilité de la page
 * partenaire de création d'offre :
 *  1. la carte « Aperçu citoyen » n'est plus `sticky` au desktop (elle recouvrait la
 *     checklist en défilant) — l'ordre des cartes de la colonne est conservé ;
 *  2. « Mode de validation » reste NON modifiable, garde sa valeur, porte un nom
 *     accessible et peut passer à la ligne (le rendu entier est vérifié en navigateur).
 */
import { PassportOfferCreateDesktopForm } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-form";
import { PassportOfferCreateDesktopPreview } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-preview";
import { PassportOfferCreateDesktopScreen } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-screen";
import {
  OFFER_CREATE_TEST_ORGANIZATION,
  buildOfferCreateTestContext,
} from "@/lib/partner-portal/passport-offer-create-test-fixtures";
import { cleanup, render, within } from "@testing-library/react";
import {
  PASSPORT_OFFER_CREATE_FIELD_VALIDATION,
  PASSPORT_OFFER_CREATE_VALIDATION_QR,
  createEmptyPassportOfferCreateDraft,
} from "@yunicity/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/culture/cultural-image", () => ({
  CulturalImage: () => null,
}));

afterEach(cleanup);

describe("carte « Aperçu citoyen »", () => {
  it.each(["desktop", "medium"] as const)("n'est pas sticky (%s)", (variant) => {
    const { container } = render(
      <PassportOfferCreateDesktopPreview
        variant={variant}
        draft={createEmptyPassportOfferCreateDraft(OFFER_CREATE_TEST_ORGANIZATION.id)}
        organization={OFFER_CREATE_TEST_ORGANIZATION}
        partner={null}
      />,
    );
    const preview = container.querySelector<HTMLElement>("[data-passport-offer-create-preview]");
    expect(preview).not.toBeNull();
    expect(preview?.className).not.toMatch(/(^|\s|:)sticky(\s|$)/);
  });

  it("reste la première carte de la colonne droite desktop, avant la checklist", () => {
    const { container } = render(<PassportOfferCreateDesktopScreen ctx={buildOfferCreateTestContext()} />);
    const preview = container.querySelector<HTMLElement>("[data-passport-offer-create-preview]");
    const column = preview?.parentElement;
    expect(column?.firstElementChild).toBe(preview);
    expect(column?.children[1]?.textContent).toContain("Checklist avant envoi");
  });
});

describe.each(["desktop", "medium", "mobile"] as const)("« Mode de validation », variante %s", (variant) => {
  function renderMode() {
    const { container } = render(
      <PassportOfferCreateDesktopForm
        variant={variant}
        draft={createEmptyPassportOfferCreateDraft(OFFER_CREATE_TEST_ORGANIZATION.id)}
        organization={OFFER_CREATE_TEST_ORGANIZATION}
        partner={null}
        onChange={vi.fn()}
      />,
    );
    const section = container.querySelector<HTMLElement>("#passport-offer-create-eligibility");
    if (!section) throw new Error("section « Éligibilité » introuvable");
    return within(section).getByRole("textbox", { name: new RegExp(PASSPORT_OFFER_CREATE_FIELD_VALIDATION) });
  }

  it("porte un nom accessible et sa valeur entière", () => {
    const field = renderMode();
    expect(field.textContent?.trim()).toBe(PASSPORT_OFFER_CREATE_VALIDATION_QR);
  });

  it("reste non modifiable", () => {
    const field = renderMode();
    expect(field.getAttribute("aria-readonly")).toBe("true");
    expect(field.hasAttribute("contenteditable")).toBe(false);
    expect(field.tagName).not.toBe("INPUT");
  });

  it("peut passer à la ligne au lieu d'être tronqué", () => {
    const field = renderMode();
    expect(field.className).toMatch(/(^|\s)break-words(\s|$)/);
    expect(field.className).not.toMatch(/(^|\s)(truncate|whitespace-nowrap)(\s|$)/);
  });
});
