// @vitest-environment jsdom

/**
 * PASSPORT-HISTORY-COPY-01 (PAS-15) — page de détail d'une offre Passport.
 *
 * Deux textes promettaient un « historique » des avantages utilisés. Il n'existe pas :
 * le panneau « Activité récente » ne liste que des tampons, et la validation d'un
 * avantage n'y ajoute un tampon qu'au premier passage chez le partenaire.
 * Décision de Kyria (2026-11-22) : retirer la promesse, garder une confirmation
 * fidèle à l'action réussie. Le texte affiché sous 640 px ne change pas.
 *
 * Le besoin d'un historique des avantages (PASSPORT-HISTORY-REDEMPTIONS-01) reste
 * distinct : ce test ne le couvre pas.
 */
import type { PartnerOfferPublic } from "@yunicity/types";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { PassportOfferDesktopBody } from "@/components/passport/offer-detail/passport-offer-desktop-body";
import { PassportOfferValidationCard } from "@/components/passport/offer-detail/passport-offer-validation-card";

const OFFER: PartnerOfferPublic = {
  id: "offer-test",
  title: "Avantage de démonstration",
  slug: "avantage-demonstration",
  description: null,
  value_label: null,
  offer_type: "custom",
  conditions: null,
  valid_from: null,
  valid_until: null,
  is_featured: false,
  tier_code_required: null,
  partner: {
    name: "Partenaire Démo",
    slug: "partenaire-demo",
    logo_url: null,
    cover_image_url: null,
    category: null,
    city: "Reims",
    is_verified: true,
    partner_status: "active",
  },
};

const T1 = "L'avantage est alors compté comme utilisé.";
const T2 = "L'avantage est enregistré seulement après validation par le partenaire.";

afterEach(cleanup);

describe("PASSPORT-HISTORY-COPY-01 — « Comment utiliser cette offre »", () => {
  it("l'étape 3 confirme l'utilisation sans promettre d'historique", () => {
    render(<PassportOfferDesktopBody offer={OFFER} about="" conditions={[]} city="Reims" />);
    const step = screen.getByText("Faites valider l'avantage").closest("li");
    expect(step).not.toBeNull();
    expect(step?.textContent).toContain(T1);
  });
});

describe("PASSPORT-HISTORY-COPY-01 — « Une validation transparente »", () => {
  it("le texte à partir de 640 px est celui retenu", () => {
    const { container } = render(<PassportOfferValidationCard />);
    const desktop = container.querySelector(".passport-offer-validation-body-desktop");
    expect(desktop?.textContent).toBe(T2);
  });

  it("le texte sous 640 px reste inchangé", () => {
    const { container } = render(<PassportOfferValidationCard />);
    const mobile = container.querySelector(".passport-offer-validation-body-mobile");
    expect(mobile?.textContent).toBe(T2);
  });
});

describe("PASSPORT-HISTORY-COPY-01 — aucune promesse d'historique", () => {
  it("ni les étapes ni la carte de validation ne parlent d'historique", () => {
    const { container } = render(
      <>
        <PassportOfferDesktopBody offer={OFFER} about="" conditions={[]} city="Reims" />
        <PassportOfferValidationCard />
      </>,
    );
    expect(container.textContent ?? "").not.toMatch(/historique/i);
  });
});
