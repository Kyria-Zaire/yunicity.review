import { describe, expect, it } from "vitest";

import type { PartnerLead } from "@yunicity/types";

import { AuthError } from "./auth/auth-errors";
import {
  PARTNER_LEAD_CONVERSION_READINESS_TITLE,
  buildPartnerLeadConversionReadiness,
  buildPartnerLeadConversionSuccessCopy,
  partnerLeadConversionReadinessMicrocopy,
  partnerLeadConversionSteps,
  partnerLeadConvertErrorMessage,
  partnerLeadGuidedCanConvert,
  partnerLeadGuidedConvertDisabledReason,
} from "./partner-lead-guided-conversion";

function lead(overrides: Partial<PartnerLead> = {}): PartnerLead {
  return {
    id: "lead-1",
    name: "Café du Parc",
    organization_type: "commerce",
    contact_name: null,
    email: "contact@cafe.fr",
    phone: "+33600000000",
    website: null,
    instagram: null,
    city: "Reims",
    address: null,
    source: "physical_prospecting",
    status: "new",
    interested_passport: false,
    interested_events: false,
    interested_creator_program: false,
    interested_offers: false,
    interested_business_passport: false,
    tags: [],
    notes: null,
    internal_rating: null,
    last_contacted_at: null,
    next_followup_at: null,
    converted_organization_id: null,
    converted_at: null,
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
    ...overrides,
  };
}

describe("buildPartnerLeadConversionReadiness", () => {
  it("affiche la checklist à partir de meeting_scheduled", () => {
    const readiness = buildPartnerLeadConversionReadiness(
      lead({ status: "meeting_scheduled" }),
    );
    expect(readiness.showChecklist).toBe(true);
    expect(readiness.steps.filter((s) => s.reached)).toHaveLength(3);
    expect(readiness.microcopy).toContain("prérequis");
  });

  it("coche les quatre étapes pour un prospect signé", () => {
    const readiness = buildPartnerLeadConversionReadiness(lead({ status: "signed" }));
    expect(readiness.title).toBe(PARTNER_LEAD_CONVERSION_READINESS_TITLE);
    expect(readiness.steps.every((s) => s.reached)).toBe(true);
    expect(readiness.isNetworkReady).toBe(true);
    expect(readiness.microcopy).toContain("prérequis");
    expect(readiness.footer).toContain("activé");
  });

  it("footer converted pour un partenaire actif", () => {
    const readiness = buildPartnerLeadConversionReadiness(lead({ status: "converted" }));
    expect(readiness.footer).toContain("actif");
  });

  it("adapte la microcopy par statut hors checklist", () => {
    expect(partnerLeadConversionReadinessMicrocopy("new")).toContain("découverte");
    expect(partnerLeadConversionReadinessMicrocopy("interested")).toContain("intérêt");
  });
});

describe("partnerLeadConversionSteps", () => {
  it("ne coche que la qualification pour contacted", () => {
    const steps = partnerLeadConversionSteps("contacted");
    expect(steps.find((s) => s.id === "qualification")?.reached).toBe(true);
    expect(steps.find((s) => s.id === "interest")?.reached).toBe(false);
  });
});

describe("partnerLeadGuidedCanConvert", () => {
  it("exige le statut signé", () => {
    expect(partnerLeadGuidedCanConvert(lead({ status: "interested" }))).toBe(false);
    expect(partnerLeadGuidedConvertDisabledReason(lead({ status: "interested" }))).toContain(
      "signé",
    );
  });

  it("autorise un prospect signé avec ville", () => {
    expect(partnerLeadGuidedCanConvert(lead({ status: "signed" }))).toBe(true);
  });

  it("refuse sans ville", () => {
    expect(partnerLeadGuidedCanConvert(lead({ status: "signed", city: null }))).toBe(false);
  });
});

describe("buildPartnerLeadConversionSuccessCopy", () => {
  it("personnalise le message de bienvenue", () => {
    const copy = buildPartnerLeadConversionSuccessCopy(lead({ status: "signed" }));
    expect(copy.title).toContain("Bienvenue");
    expect(copy.subtitle).toContain("Café du Parc");
    expect(copy.subtitle).toContain("Reims");
    expect(copy.partnersCta).toContain("partenaires");
  });
});

describe("partnerLeadConvertErrorMessage", () => {
  it("humanise les erreurs backend connues", () => {
    expect(
      partnerLeadConvertErrorMessage(
        new AuthError("OWNER_USER_NOT_FOUND", "Utilisateur propriétaire introuvable.", 404),
      ),
    ).toContain("responsable");
  });

  it("retourne le message par défaut", () => {
    expect(partnerLeadConvertErrorMessage(new Error(""))).toContain("Impossible");
  });
});
