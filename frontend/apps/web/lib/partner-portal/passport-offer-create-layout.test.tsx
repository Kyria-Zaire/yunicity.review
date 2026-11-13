// @vitest-environment jsdom
/**
 * PARTNER-OFFER-CREATE-DESKTOP-LAYOUT-01 — mise en page de la page partenaire de
 * création d'offre, sans effet sur les autres pages de l'espace partenaire :
 *  A. la page de création n'est plus bridée à la largeur `wide` (768 px) ;
 *  B. une seule enveloppe de format est rendue visible à chaque palier — l'autre est
 *     masquée entièrement (fond et hauteur compris ; contrat CSS dans
 *     `passport-offer-create-shell-css.test.ts`) ;
 *  + les champs de période s'empilent quand la place manque (desktop et medium).
 */
import { PassportOfferCreateDesktopForm } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-form";
import { PassportOfferCreateScreen } from "@/components/partner-portal/offer-create/passport-offer-create-screen";
import { resolvePartnerPortalContentWidth } from "@/lib/partner-portal/partner-portal-content-width";
import {
  OFFER_CREATE_TEST_ORGANIZATION,
  buildOfferCreateTestContext,
} from "@/lib/partner-portal/passport-offer-create-test-fixtures";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import {
  buildPartnerPortalCreatorContentHref,
  buildPartnerPortalEventsHref,
  buildPartnerPortalOfferCreateHref,
  buildPartnerPortalOffersHref,
  buildPartnerPortalOverviewHref,
  buildPartnerPortalQrHref,
  createEmptyPassportOfferCreateDraft,
} from "@yunicity/utils";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/culture/cultural-image", () => ({
  CulturalImage: () => null,
}));
vi.mock("@/components/partner-portal/offer-create/mobile/passport-offer-create-mobile-screen", () => ({
  PassportOfferCreateMobileScreen: () => <div data-testid="version-mobile" />,
}));
vi.mock("@/components/partner-portal/offer-create/medium/passport-offer-create-medium-screen", () => ({
  PassportOfferCreateMediumScreen: () => <div data-testid="version-medium" />,
}));
vi.mock("@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-screen", () => ({
  PassportOfferCreateDesktopScreen: () => <div data-testid="version-desktop" />,
}));

const ORGANIZATION = OFFER_CREATE_TEST_ORGANIZATION;
const buildContext = buildOfferCreateTestContext;

afterEach(cleanup);

describe("A — largeur de contenu de l'espace partenaire", () => {
  it("libère la page de création de la largeur `wide`", () => {
    expect(resolvePartnerPortalContentWidth(buildPartnerPortalOfferCreateHref())).toBe("full");
  });

  it.each([
    buildPartnerPortalOverviewHref(),
    buildPartnerPortalOffersHref(),
    buildPartnerPortalEventsHref(),
    buildPartnerPortalCreatorContentHref(),
    buildPartnerPortalQrHref(),
  ])("garde la largeur `wide` sur %s", (pathname) => {
    expect(resolvePartnerPortalContentWidth(pathname)).toBe("wide");
  });

  it("garde la largeur `wide` tant que la route est inconnue", () => {
    expect(resolvePartnerPortalContentWidth(null)).toBe("wide");
  });
});

describe("B — une seule enveloppe de format par palier", () => {
  function shells(container: HTMLElement) {
    return [...container.querySelectorAll<HTMLElement>(".passport-offer-create-shell")];
  }

  it("rattache l'enveloppe mobile au seul palier mobile, l'autre aux paliers medium et desktop", () => {
    const { container } = render(<PassportOfferCreateScreen ctx={buildContext()} />);
    const [mobile, wide, ...rest] = shells(container);
    expect(rest).toHaveLength(0);

    expect(mobile?.classList.contains("web-mobile-passport-offer-create-only")).toBe(true);
    expect(mobile?.classList.contains("web-medium-up-passport-offer-create-only")).toBe(false);
    expect(within(mobile!).queryByTestId("version-mobile")).not.toBeNull();
    expect(within(mobile!).queryByTestId("version-medium")).toBeNull();
    expect(within(mobile!).queryByTestId("version-desktop")).toBeNull();

    expect(wide?.classList.contains("web-medium-up-passport-offer-create-only")).toBe(true);
    expect(wide?.classList.contains("web-mobile-passport-offer-create-only")).toBe(false);
    expect(within(wide!).queryByTestId("version-mobile")).toBeNull();
    expect(within(wide!).queryByTestId("version-medium")).not.toBeNull();
    expect(within(wide!).queryByTestId("version-desktop")).not.toBeNull();
  });

  it("laisse l'état de chargement visible à tous les paliers", () => {
    const { container } = render(<PassportOfferCreateScreen ctx={buildContext({ loading: true })} />);
    const [loading, ...rest] = shells(container);
    expect(rest).toHaveLength(0);
    expect(loading?.className).not.toMatch(/passport-offer-create-only/);
  });
});

describe("champs de période", () => {
  function renderValidity(variant: "desktop" | "medium" | "mobile") {
    const onChange = vi.fn();
    const draft = {
      ...createEmptyPassportOfferCreateDraft(ORGANIZATION.id),
      validFrom: "2026-11-12T09:00",
      validUntil: "2026-11-30T18:00",
      timezone: "Europe/Paris",
    };
    const { container } = render(
      <PassportOfferCreateDesktopForm
        variant={variant}
        draft={draft}
        organization={ORGANIZATION}
        partner={null}
        onChange={onChange}
      />,
    );
    const section = container.querySelector<HTMLElement>("#passport-offer-create-validity");
    if (!section) throw new Error("section « Période de validité » introuvable");
    const grid = () => {
      const el = section.querySelector<HTMLElement>("[data-passport-offer-create-validity-fields]");
      if (!el) throw new Error("grille des champs de période introuvable");
      return el;
    };
    return { section, grid, onChange };
  }

  it.each(["desktop", "medium"] as const)(
    "s'empilent selon la place disponible, pas selon la largeur d'écran (%s)",
    (variant) => {
      const { grid } = renderValidity(variant);
      expect(grid().className).toContain("grid-cols-[repeat(auto-fit,minmax(");
      expect(grid().className).not.toMatch(/(^|\s)md:grid-cols-3(\s|$)/);
    },
  );

  it("restent sur une colonne en mobile", () => {
    const { grid } = renderValidity("mobile");
    expect(grid().className).toMatch(/(^|\s)grid-cols-1(\s|$)/);
  });

  it.each(["desktop", "medium", "mobile"] as const)("conservent valeurs et comportement (%s)", (variant) => {
    const { section, onChange } = renderValidity(variant);
    const [debut, fin] = section.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
    const fuseau = section.querySelector<HTMLSelectElement>("select");
    expect(debut?.value).toBe("2026-11-12T09:00");
    expect(fin?.value).toBe("2026-11-30T18:00");
    expect(fuseau?.value).toBe("Europe/Paris");

    fireEvent.change(debut!, { target: { value: "2026-11-13T10:30" } });
    expect(onChange).toHaveBeenLastCalledWith({ validFrom: "2026-11-13T10:30" });
    fireEvent.change(fin!, { target: { value: "2026-12-01T20:00" } });
    expect(onChange).toHaveBeenLastCalledWith({ validUntil: "2026-12-01T20:00" });
    fireEvent.change(fuseau!, { target: { value: "Europe/Paris" } });
    expect(onChange).toHaveBeenLastCalledWith({ timezone: "Europe/Paris" });
  });
});
