import { describe, expect, it } from "vitest";

import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";

import {
  buildPartnerNetworkSignal,
  partnerEmptyStateCopy,
  partnerNetworkActiveTotal,
  partnerNetworkLaunchStatus,
  partnerPilotMomentumObjectiveCopy,
  partnerPilotMomentumProgress,
  partnerPilotMomentumProgressLabel,
  partnerPipelineSteps,
  partnerPriorityActions,
  partnerRecommendedAction,
  partnersNetworkSignal,
  partnerTabLabel,
  partnerTerrainKpiCards,
  partnerTerrainTableEmptyState,
  shouldShowPartnerEvolutionChart,
} from "./partners-network";

function emptySummary(
  overrides: Partial<AdminPartnersWorkspaceSummary> = {},
): AdminPartnersWorkspaceSummary {
  return {
    generated_at: "2026-06-04T10:00:00Z",
    city: "Reims",
    leads_total: 0,
    leads_open: 0,
    organizations_pending_review: 0,
    partners_total: 0,
    partners_active: 0,
    partners_signed: 0,
    partners_premium: 0,
    partners_founding: 0,
    partners_verified: 0,
    partners_public: 0,
    partners_private: 0,
    partners_inactive: 0,
    partners_new_this_month: 0,
    activation_waves_open: 0,
    activation_items_total: 0,
    activation_items_ready: 0,
    activation_items_activated: 0,
    category_breakdown: [],
    top_active_partners: [],
    pending_requests: [],
    map_pins: [],
    evolution_30d: [],
    ...overrides,
  };
}

describe("partnerTabLabel", () => {
  it("renomme les onglets en libellés produit", () => {
    expect(partnerTabLabel("leads")).toBe("Prospects");
    expect(partnerTabLabel("partners")).toBe("Réseau actif");
  });
});

describe("buildPartnerNetworkSignal", () => {
  it("signale un réseau en préparation quand tout est vide", () => {
    const signal = buildPartnerNetworkSignal(emptySummary());
    expect(signal.level).toBe("preparing");
    expect(signal.title).toContain("préparation");
  });

  it("signale des actions quand des files sont ouvertes", () => {
    const signal = buildPartnerNetworkSignal(
      emptySummary({ leads_total: 2, leads_open: 2 }),
    );
    expect(signal.level).toBe("action");
    expect(signal.title).toContain("traiter");
  });

  it("signale un réseau actif sans file ouverte", () => {
    const signal = buildPartnerNetworkSignal(
      emptySummary({
        partners_total: 3,
        partners_active: 2,
        partners_premium: 1,
      }),
    );
    expect(signal.level).toBe("active");
    expect(signal.message).toContain("3 partenaires actifs");
  });
});

describe("partnersNetworkSignal", () => {
  it("success quand le pilote est vide et prêt", () => {
    const signal = partnersNetworkSignal(emptySummary());
    expect(signal.type).toBe("success");
    expect(signal.title).toContain("Reims");
    expect(signal.title).toContain("premiers partenaires");
  });

  it("warning quand des candidatures sont en cours", () => {
    const signal = partnersNetworkSignal(
      emptySummary({ organizations_pending_review: 2, partners_total: 0 }),
    );
    expect(signal.type).toBe("warning");
    expect(signal.title).toContain("prend forme");
  });

  it("warning quand le réseau compte moins de 10 partenaires", () => {
    const signal = partnersNetworkSignal(
      emptySummary({ partners_total: 4, partners_active: 4 }),
    );
    expect(signal.type).toBe("warning");
  });

  it("critical quand la file d'attente est sous tension", () => {
    const signal = partnersNetworkSignal(
      emptySummary({ organizations_pending_review: 6 }),
    );
    expect(signal.type).toBe("critical");
    expect(signal.title).toContain("attention particulière");
  });

  it("critical prioritaire sur warning", () => {
    const signal = partnersNetworkSignal(
      emptySummary({
        organizations_pending_review: 6,
        partners_total: 3,
      }),
    );
    expect(signal.type).toBe("critical");
  });

  it("critical via activations prêtes", () => {
    const signal = partnersNetworkSignal(
      emptySummary({ activation_items_ready: 5, partners_total: 12 }),
    );
    expect(signal.type).toBe("critical");
  });
});

describe("partnerPipelineSteps", () => {
  it("expose les compteurs réels du summary", () => {
    const steps = partnerPipelineSteps(
      emptySummary({
        leads_open: 4,
        organizations_pending_review: 2,
        activation_items_ready: 1,
        partners_active: 5,
        partners_premium: 1,
      }),
    );
    expect(steps.map((step) => step.count)).toEqual([4, 2, 1, 6]);
  });
});

describe("partnerPriorityActions", () => {
  it("liste uniquement les actions avec compteur positif", () => {
    const actions = partnerPriorityActions(
      emptySummary({
        leads_open: 3,
        organizations_pending_review: 0,
        activation_items_ready: 2,
      }),
    );
    expect(actions).toHaveLength(2);
    expect(actions[0]?.label).toContain("Prospects");
  });
});

describe("partnerEmptyStateCopy", () => {
  it("fournit un empty state premium par onglet", () => {
    const copy = partnerEmptyStateCopy("leads", "Reims");
    expect(copy.title).toContain("prospect");
    expect(copy.message).toContain("Reims");
  });
});

describe("partnerNetworkActiveTotal", () => {
  it("additionne actifs, premium et fondateurs", () => {
    expect(
      partnerNetworkActiveTotal(
        emptySummary({
          partners_active: 2,
          partners_premium: 1,
          partners_founding: 1,
        }),
      ),
    ).toBe(4);
  });
});

describe("partnerTerrainKpiCards", () => {
  it("contextualise les hints quand le réseau est vide", () => {
    const cards = partnerTerrainKpiCards(emptySummary());
    expect(cards.find((c) => c.id === "total")?.hint).toBe("Pilote prêt à démarrer");
    expect(cards.find((c) => c.id === "active")?.hint).toBe("À développer");
    expect(cards.find((c) => c.id === "pending")?.hint).toBe("Aucune candidature");
    expect(cards.find((c) => c.id === "city")?.hint).toBe("Territoire pilote");
    expect(cards.find((c) => c.id === "verified")?.hint).toBe("Confiance à bâtir");
  });

  it("affiche les pourcentages quand le réseau est actif", () => {
    const cards = partnerTerrainKpiCards(
      emptySummary({
        partners_total: 10,
        partners_active: 5,
        partners_verified: 2,
        organizations_pending_review: 1,
      }),
    );
    expect(cards.find((c) => c.id === "active")?.hint).toContain("% du réseau");
    expect(cards.find((c) => c.id === "pending")?.hint).toBe("À valider");
  });
});

describe("shouldShowPartnerEvolutionChart", () => {
  it("masque le graphe tant que le réseau est trop petit", () => {
    expect(shouldShowPartnerEvolutionChart(emptySummary({ partners_total: 0 }))).toBe(false);
    expect(shouldShowPartnerEvolutionChart(emptySummary({ partners_total: 4 }))).toBe(false);
    expect(shouldShowPartnerEvolutionChart(emptySummary({ partners_total: 5 }))).toBe(true);
  });
});

describe("partnerNetworkLaunchStatus", () => {
  it("marque le pilote prêt et le réseau à développer", () => {
    const items = partnerNetworkLaunchStatus(emptySummary());
    expect(items[0]?.done).toBe(true);
    expect(items[0]?.label).toBe("Prêt pour le pilote");
    expect(items[1]?.done).toBe(false);
    expect(items[1]?.label).toBe("Réseau à développer");
  });

  it("affiche les vraies valeurs quand elles existent", () => {
    const items = partnerNetworkLaunchStatus(
      emptySummary({
        partners_active: 8,
        organizations_pending_review: 2,
        partners_inactive: 1,
      }),
    );
    expect(items[1]?.label).toBe("Actifs : 8");
    expect(items[2]?.label).toBe("Demandes : 2");
    expect(items[3]?.label).toBe("Inactifs : 1");
  });
});

describe("partnerPilotMomentumProgress", () => {
  it("calcule la progression vers 10 actifs", () => {
    expect(partnerPilotMomentumProgress(emptySummary()).percent).toBe(0);
    expect(
      partnerPilotMomentumProgress(emptySummary({ partners_active: 5 })).percent,
    ).toBe(50);
    expect(
      partnerPilotMomentumProgress(
        emptySummary({ partners_active: 10, partners_premium: 2 }),
      ).percent,
    ).toBe(100);
  });
});

describe("partnerPilotMomentumObjectiveCopy", () => {
  it("adapte le sous-texte au stade du pilote", () => {
    expect(partnerPilotMomentumObjectiveCopy(emptySummary())).toContain("premiers partenaires");
    expect(
      partnerPilotMomentumObjectiveCopy(emptySummary({ partners_total: 4 })),
    ).toContain("prend forme");
    expect(
      partnerPilotMomentumObjectiveCopy(emptySummary({ partners_total: 12 })),
    ).toContain("pilote est lancé");
  });
});

describe("partnerPilotMomentumProgressLabel", () => {
  it("libelle les étapes de progression", () => {
    expect(partnerPilotMomentumProgressLabel(0)).toContain("premiers partenaires");
    expect(partnerPilotMomentumProgressLabel(3)).toContain("se construit");
    expect(partnerPilotMomentumProgressLabel(10)).toBe("Objectif atteint.");
  });
});

describe("partnerRecommendedAction", () => {
  it("priorise la vérification", () => {
    const action = partnerRecommendedAction(
      emptySummary({ organizations_pending_review: 2 }),
    );
    expect(action.title).toContain("Vérifier");
  });

  it("propose les activations ensuite", () => {
    const action = partnerRecommendedAction(
      emptySummary({ activation_items_ready: 1 }),
    );
    expect(action.title).toContain("activations");
  });

  it("invite à ajouter un partenaire sur pilote vide", () => {
    const action = partnerRecommendedAction(emptySummary());
    expect(action.title).toContain("Ajouter");
    expect(action.description).toContain("Reims");
  });

  it("suggère le scan quand le réseau existe", () => {
    const action = partnerRecommendedAction(
      emptySummary({ partners_total: 3, partners_active: 2 }),
    );
    expect(action.title).toContain("Scanner");
  });
});

describe("partnerTerrainTableEmptyState", () => {
  it("raconte le lancement territorial sans filtre", () => {
    const copy = partnerTerrainTableEmptyState(false, "Reims");
    expect(copy.title).toContain("Reims");
    expect(copy.title).toContain("premiers partenaires");
  });

  it("propose de réinitialiser les filtres", () => {
    const copy = partnerTerrainTableEmptyState(true, "Reims");
    expect(copy.title).toContain("critères");
  });
});
