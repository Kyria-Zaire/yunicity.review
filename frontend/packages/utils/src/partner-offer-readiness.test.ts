import { describe, expect, it } from "vitest";

import {
  isPartnerOfferPlaceholder,
  partnerOfferHumanDescription,
  partnerOfferReadiness,
  partnerOfferValueCategoryLabel,
} from "./partner-offer-readiness";

describe("partnerOfferReadiness", () => {
  it("marque une offre complète comme prête", () => {
    const result = partnerOfferReadiness({
      title: "Entrée offerte",
      description: "Découvrez la cuisine thaï avec une entrée offerte pour les porteurs Passport.",
      value_label: "Entrée au choix offerte",
      conditions: "Sur présentation du Passport, une fois par personne.",
      offer_type: "gift",
      offer_status: "published",
      is_active: true,
      partner_status: "active",
      org_visibility: "public",
      org_verified: true,
    });
    expect(result.readiness).toBe("ready");
    expect(result.is_passport_eligible).toBe(true);
  });

  it("détecte une offre placeholder", () => {
    expect(
      isPartnerOfferPlaceholder({
        title: "Accueil Passport",
        description: "Présentez votre Passport Yunicity pour découvrir les avantages proposés.",
        value_label: "Avantage membre",
        conditions: "Offre pilote, modalités confirmées sur place.",
      }),
    ).toBe(true);
  });

  it("retourne partielle sans conditions", () => {
    const result = partnerOfferReadiness({
      title: "Entrée offerte",
      description: "Découvrez la cuisine thaï avec une entrée offerte pour les porteurs Passport.",
      value_label: "Entrée au choix offerte",
      conditions: "",
      offer_type: "gift",
      offer_status: "draft",
      is_active: false,
      partner_status: "active",
      org_verified: true,
    });
    expect(result.readiness).toBe("partial");
    expect(result.is_passport_eligible).toBe(false);
  });

  it("formate une description humaine", () => {
    const text = partnerOfferHumanDescription({
      title: "Première bière",
      value_label: "-15 %",
      offer_type: "discount",
      conditions: "Une fois par personne.",
    });
    expect(text).toContain("Réduction");
    expect(text).toContain("-15 %");
    expect(partnerOfferValueCategoryLabel("percent_discount")).toBe("Réduction");
  });
});
