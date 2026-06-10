import { describe, expect, it } from "vitest";

import type { PartnerLead } from "@yunicity/types";

import {
  buildPartnerLead360Action,
  buildPartnerLeadRelationSignal,
  buildPartnerLeadTimeline,
  partnerLeadCanConvert,
  partnerLeadConvertDisabledReason,
  partnerLeadReadiness,
  partnerLeadTimelineEmptyCopy,
  partnerLeadTimelineIsEmpty,
} from "./partner-lead-360";

const NOW = new Date("2026-06-04T12:00:00Z");

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

describe("buildPartnerLeadRelationSignal", () => {
  it("mappe le statut new", () => {
    const signal = buildPartnerLeadRelationSignal(lead({ status: "new" }));
    expect(signal.title).toBe("Nouveau contact");
  });

  it("mappe le statut signed", () => {
    const signal = buildPartnerLeadRelationSignal(lead({ status: "signed" }));
    expect(signal.title).toBe("Prêt à rejoindre le réseau");
  });
});

describe("partnerLeadReadiness", () => {
  it("retourne 75 % pour RDV planifié", () => {
    expect(partnerLeadReadiness(lead({ status: "meeting_scheduled" })).percent).toBe(75);
  });

  it("retourne 0 % pour rejeté", () => {
    expect(partnerLeadReadiness(lead({ status: "rejected" })).percent).toBe(0);
  });
});

describe("buildPartnerLead360Action", () => {
  it("priorise une relance échue", () => {
    const action = buildPartnerLead360Action(
      lead({
        status: "contacted",
        next_followup_at: "2026-06-03T08:00:00Z",
      }),
      NOW,
    );
    expect(action.id).toBe("followup");
    expect(action.action).toBe("edit");
  });

  it("propose la conversion pour signé", () => {
    const action = buildPartnerLead360Action(lead({ status: "signed" }), NOW);
    expect(action.ctaLabel).toBe("Convertir");
    expect(action.action).toBe("convert");
  });

  it("pointe vers le partenaire si converti", () => {
    const action = buildPartnerLead360Action(
      lead({
        status: "converted",
        converted_organization_id: "org-1",
        converted_at: "2026-06-02T10:00:00Z",
      }),
      NOW,
    );
    expect(action.href).toContain("org-1");
  });
});

describe("partnerLeadCanConvert", () => {
  it("refuse sans ville", () => {
    expect(partnerLeadCanConvert(lead({ city: null, status: "signed" }))).toBe(false);
    expect(partnerLeadConvertDisabledReason(lead({ city: null, status: "signed" }))).toContain(
      "ville",
    );
  });

  it("refuse si déjà converti", () => {
    expect(
      partnerLeadCanConvert(
        lead({ status: "converted", converted_organization_id: "org-1" }),
      ),
    ).toBe(false);
  });
});

describe("buildPartnerLeadTimeline", () => {
  it("n'invente pas de dates", () => {
    const events = buildPartnerLeadTimeline(lead());
    expect(events.some((e) => e.kind === "contact")).toBe(false);
    expect(events.some((e) => e.kind === "creation")).toBe(true);
  });

  it("inclut les événements réels disponibles", () => {
    const events = buildPartnerLeadTimeline(
      lead({
        last_contacted_at: "2026-06-02T10:00:00Z",
        notes: "Intéressé par Passport.",
        updated_at: "2026-06-03T10:00:00Z",
      }),
    );
    expect(events.some((e) => e.kind === "contact")).toBe(true);
    expect(events.some((e) => e.kind === "notes")).toBe(true);
  });
});

describe("partnerLeadTimelineIsEmpty", () => {
  it("détecte un historique minimal", () => {
    expect(partnerLeadTimelineIsEmpty(lead())).toBe(true);
    expect(partnerLeadTimelineEmptyCopy().message).toContain("historique");
  });
});
