import { describe, expect, it } from "vitest";

import type { LocalEventAdminSummaryResponse } from "@yunicity/types";

import {
  buildEventsAgendaConseilMessage,
  buildEventsAgendaKpiCards,
  buildEventsAgendaMetricsFromSummary,
  buildEventsAgendaMomentum,
  buildEventsAgendaNextAction,
  buildEventsAgendaSignal,
  eventsAgendaMomentumMicrocopy,
  eventsHasActiveFilters,
} from "./admin-events-command";

function summary(
  overrides: Partial<LocalEventAdminSummaryResponse> = {},
): LocalEventAdminSummaryResponse {
  return {
    city: "Reims",
    generated_at: "2026-06-01T10:00:00Z",
    total: 0,
    pending_review: 0,
    published: 0,
    upcoming_published: 0,
    cancelled_or_archived: 0,
    rejected: 0,
    ...overrides,
  };
}

describe("buildEventsAgendaSignal", () => {
  it("priorise les événements en attente", () => {
    const signal = buildEventsAgendaSignal(
      buildEventsAgendaMetricsFromSummary(summary({ total: 3, pending_review: 2 })),
    );
    expect(signal.type).toBe("pending");
    expect(signal.description).toContain("2");
  });

  it("signale les annulations avant l'agenda actif", () => {
    const signal = buildEventsAgendaSignal(
      buildEventsAgendaMetricsFromSummary(
        summary({ total: 4, cancelled_or_archived: 1, upcoming_published: 2 }),
      ),
    );
    expect(signal.type).toBe("cancelled");
  });
});

describe("buildEventsAgendaNextAction", () => {
  it("oriente vers les partenaires quand l'agenda est vide", () => {
    const action = buildEventsAgendaNextAction(buildEventsAgendaMetricsFromSummary(summary()));
    expect(action.href).toBe("/partners");
  });

  it("oriente vers la validation quand des événements sont en attente", () => {
    const action = buildEventsAgendaNextAction(
      buildEventsAgendaMetricsFromSummary(summary({ total: 2, pending_review: 2 })),
    );
    expect(action.href).toContain("pending_review");
  });
});

describe("buildEventsAgendaKpiCards", () => {
  it("expose 5 cartes narratifs", () => {
    const cards = buildEventsAgendaKpiCards(
      buildEventsAgendaMetricsFromSummary(summary({ total: 5, upcoming_published: 2 })),
    );
    expect(cards).toHaveLength(5);
    expect(cards.find((card) => card.id === "upcoming")?.value).toBe(2);
  });
});

describe("buildEventsAgendaMomentum", () => {
  it("calcule la progression sur 10 événements à venir", () => {
    const momentum = buildEventsAgendaMomentum(
      buildEventsAgendaMetricsFromSummary(summary({ upcoming_published: 5 })),
    );
    expect(momentum.goal).toBe(10);
    expect(momentum.progressPercent).toBe(50);
    expect(eventsAgendaMomentumMicrocopy(0)).toContain("premiers temps forts");
  });
});

describe("buildEventsAgendaConseilMessage", () => {
  it("encourage le pilote quand l'agenda est incomplet", () => {
    const message = buildEventsAgendaConseilMessage(
      buildEventsAgendaMetricsFromSummary(summary({ total: 4, upcoming_published: 3 })),
    );
    expect(message).toContain("10 événements");
  });
});

describe("eventsHasActiveFilters", () => {
  it("détecte recherche et type actifs", () => {
    expect(
      eventsHasActiveFilters({ status: "", city: "Reims", q: "marché", eventType: "" }),
    ).toBe(true);
    expect(
      eventsHasActiveFilters({ status: "", city: "Reims", q: "", eventType: "local_market" }),
    ).toBe(true);
  });
});
