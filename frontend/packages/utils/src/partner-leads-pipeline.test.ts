import { describe, expect, it } from "vitest";

import type { PartnerLead } from "@yunicity/types";

import {
  buildPartnerLeadInsights,
  buildPartnerLeadPilotMomentum,
  buildPartnerLeadPipeline,
  buildPartnerLeadRecommendedAction,
  buildPartnerLeadSignal,
  partnerLeadDueFollowups,
  partnerLeadEmptyStateCopy,
  partnerLeadFocusKpiCards,
  partnerLeadInsightsEmptyCopy,
  partnerLeadPilotMomentumMicrocopy,
  partnerLeadPilotMomentumProgress,
  partnerLeadPipelineColumnEmptyNarrative,
  partnerLeadQualifiedCount,
  partnerLeadStatusLabel,
} from "./partner-leads-pipeline";

const NOW = new Date("2026-06-04T12:00:00Z");

function lead(overrides: Partial<PartnerLead> = {}): PartnerLead {
  return {
    id: overrides.id ?? "lead-1",
    name: overrides.name ?? "Café du Parc",
    organization_type: overrides.organization_type ?? "commerce",
    contact_name: null,
    email: null,
    phone: null,
    website: null,
    instagram: null,
    city: overrides.city ?? "Reims",
    address: null,
    source: overrides.source ?? "physical_prospecting",
    status: overrides.status ?? "new",
    interested_passport: false,
    interested_events: false,
    interested_creator_program: false,
    interested_offers: false,
    interested_business_passport: false,
    tags: [],
    notes: null,
    internal_rating: null,
    last_contacted_at: null,
    next_followup_at: overrides.next_followup_at ?? null,
    converted_organization_id: null,
    converted_at: overrides.converted_at ?? null,
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
    ...overrides,
  };
}

describe("partnerLeadStatusLabel", () => {
  it("retourne le libellé français", () => {
    expect(partnerLeadStatusLabel("meeting_scheduled")).toBe("RDV planifié");
  });
});

describe("buildPartnerLeadSignal", () => {
  it("signale un pipeline vide", () => {
    const signal = buildPartnerLeadSignal([], "Reims", NOW);
    expect(signal.type).toBe("empty");
    expect(signal.description).toContain("Reims");
  });

  it("priorise les relances", () => {
    const signal = buildPartnerLeadSignal(
      [
        lead({
          id: "a",
          next_followup_at: "2026-06-03T10:00:00Z",
          status: "contacted",
        }),
        lead({ id: "b", status: "signed" }),
      ],
      "Reims",
      NOW,
    );
    expect(signal.type).toBe("followup");
    expect(signal.description).toContain("relancé");
  });

  it("signale une conversion proche", () => {
    const signal = buildPartnerLeadSignal(
      [lead({ status: "signed" })],
      "Reims",
      NOW,
    );
    expect(signal.type).toBe("conversion");
  });

  it("signale un pipeline actif", () => {
    const signal = buildPartnerLeadSignal(
      [lead({ status: "new" })],
      "Reims",
      NOW,
    );
    expect(signal.type).toBe("active");
    expect(signal.title).toContain("construit");
  });
});

describe("buildPartnerLeadPipeline", () => {
  it("compte par statut et prévisualise 2 prospects", () => {
    const leads = [
      lead({ id: "1", status: "new", name: "A" }),
      lead({ id: "2", status: "new", name: "B" }),
      lead({ id: "3", status: "new", name: "C" }),
      lead({ id: "4", status: "new", name: "D" }),
      lead({ id: "5", status: "contacted", name: "E" }),
    ];
    const pipeline = buildPartnerLeadPipeline(leads, "Reims");
    const nouveau = pipeline.columns.find((c) => c.status === "new");
    expect(nouveau?.count).toBe(4);
    expect(nouveau?.preview).toHaveLength(2);
    expect(nouveau?.shortLabel).toBe("Nouveau");
    expect(nouveau?.filterHref).toContain("status=new");
    expect(nouveau?.filterHref).toContain("city=Reims");
  });

  it("expose une narration vide distincte par colonne", () => {
    const pipeline = buildPartnerLeadPipeline([], "Reims");
    const contacted = pipeline.columns.find((c) => c.status === "contacted");
    const converted = pipeline.columns.find((c) => c.status === "converted");
    expect(contacted?.emptyNarrative).toContain("premiers échanges");
    expect(converted?.emptyNarrative).toContain("partenaires intégrés");
    expect(partnerLeadPipelineColumnEmptyNarrative("interested")).toContain("opportunités");
  });
});

describe("partnerLeadFocusKpiCards", () => {
  it("affiche 4 KPI focus avec hints honnêtes", () => {
    const cards = partnerLeadFocusKpiCards([]);
    expect(cards).toHaveLength(4);
    expect(cards.find((c) => c.id === "total")?.hint).toBe("Pipeline vide");
    expect(cards.find((c) => c.id === "followup")?.hint).toBe("Aucune relance");
    expect(cards.find((c) => c.id === "hot")?.hint).toBe("À révéler");
    expect(cards.find((c) => c.id === "converted")?.hint).toBe("Impact à venir");
  });
});

describe("buildPartnerLeadRecommendedAction", () => {
  it("priorise la relance", () => {
    const action = buildPartnerLeadRecommendedAction(
      [
        lead({
          id: "due",
          name: "Boulangerie",
          next_followup_at: "2026-06-03T08:00:00Z",
          status: "contacted",
        }),
        lead({ id: "hot", status: "interested", name: "Galerie" }),
      ],
      "Reims",
      NOW,
    );
    expect(action.id).toBe("followup");
    expect(action.href).toBe("/partner-leads/due");
  });

  it("invite à ajouter un prospect sur pipeline vide", () => {
    const action = buildPartnerLeadRecommendedAction([], "Reims", NOW);
    expect(action.title).toBe("Le territoire attend son premier contact.");
    expect(action.ctaLabel).toBe("Ajouter un prospect");
  });

  it("utilise le microcopy conversion proche", () => {
    const action = buildPartnerLeadRecommendedAction(
      [lead({ id: "hot", status: "interested", name: "Galerie" })],
      "Reims",
      NOW,
    );
    expect(action.title).toBe("Des prospects sont proches de rejoindre le réseau.");
    expect(action.ctaLabel).toBe("Finaliser");
  });
});

describe("partnerLeadEmptyStateCopy", () => {
  it("utilise le microcopy terrain premium", () => {
    const copy = partnerLeadEmptyStateCopy("Reims", false);
    expect(copy.title).toContain("terrain est prêt");
    expect(copy.message).toContain("Reims");
  });

  it("gère les filtres actifs", () => {
    const copy = partnerLeadEmptyStateCopy("Reims", true);
    expect(copy.title).toContain("critères");
  });
});

describe("partnerLeadDueFollowups", () => {
  it("ignore les prospects convertis", () => {
    const due = partnerLeadDueFollowups(
      [
        lead({
          status: "converted",
          next_followup_at: "2026-06-01T10:00:00Z",
        }),
      ],
      NOW,
    );
    expect(due).toHaveLength(0);
  });
});

describe("buildPartnerLeadInsights", () => {
  it("agrège sources et prospects chauds", () => {
    const insights = buildPartnerLeadInsights([
      lead({ source: "event", status: "interested" }),
      lead({ id: "2", source: "event", status: "new" }),
      lead({ id: "3", source: "referral", status: "signed" }),
    ]);
    expect(insights.topSources[0]?.source).toBe("event");
    expect(insights.hotProspects.length).toBeGreaterThan(0);
    expect(insights.hasData).toBe(true);
  });
});

describe("partnerLeadPilotMomentum", () => {
  it("compte les prospects qualifiés hors statut new", () => {
    expect(
      partnerLeadQualifiedCount([
        lead({ status: "new" }),
        lead({ id: "2", status: "contacted" }),
        lead({ id: "3", status: "interested" }),
      ]),
    ).toBe(2);
  });

  it("calcule la progression pilote", () => {
    expect(partnerLeadPilotMomentumProgress(0)).toBe(0);
    expect(partnerLeadPilotMomentumProgress(3)).toBe(12);
    expect(partnerLeadPilotMomentumProgress(12)).toBe(48);
    expect(partnerLeadPilotMomentumProgress(25)).toBe(100);
    expect(partnerLeadPilotMomentumProgress(30)).toBe(100);
  });

  it("adapte la microcopy momentum", () => {
    expect(partnerLeadPilotMomentumMicrocopy(0)).toContain("premiers échanges");
    expect(partnerLeadPilotMomentumMicrocopy(5)).toContain("prend forme");
    expect(partnerLeadPilotMomentumMicrocopy(15)).toContain("opportunités");
    expect(partnerLeadPilotMomentumMicrocopy(25)).toContain("base solide");
  });

  it("construit le bloc momentum complet", () => {
    const momentum = buildPartnerLeadPilotMomentum(
      [lead({ status: "contacted" }), lead({ id: "2", status: "signed" })],
      "Reims",
    );
    expect(momentum.qualifiedCount).toBe(2);
    expect(momentum.goal).toBe(25);
    expect(momentum.progressPercent).toBe(8);
    expect(momentum.description).toContain("Reims");
  });
});

describe("partnerLeadInsightsEmptyCopy", () => {
  it("oriente la promesse produit intelligence terrain", () => {
    const copy = partnerLeadInsightsEmptyCopy();
    expect(copy.title).toBe("Intelligence terrain");
    expect(copy.promises).toHaveLength(3);
    expect(copy.footnote).toContain("premiers échanges");
  });
});
