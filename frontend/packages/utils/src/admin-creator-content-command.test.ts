import { describe, expect, it } from "vitest";

import {
  buildCreatorContentEditorialConseilMessage,
  buildCreatorContentEditorialKpiCards,
  buildCreatorContentEditorialMetricsFromSummary,
  buildCreatorContentEditorialMomentum,
  buildCreatorContentEditorialNextAction,
  buildCreatorContentEditorialSignal,
  creatorContentEditorialMomentumMicrocopy,
  creatorContentEditorialMomentumProgress,
} from "./admin-creator-content-command";

function summary(overrides: Partial<ReturnType<typeof baseSummary>> = {}) {
  return { ...baseSummary(), ...overrides };
}

function baseSummary() {
  return {
    city: "Reims",
    generated_at: "2026-06-10T12:00:00Z",
    total: 0,
    pending_review: 0,
    published: 0,
    rejected: 0,
    archived: 0,
    draft: 0,
    contributing_partners: 0,
  };
}

describe("buildCreatorContentEditorialSignal", () => {
  it("prioritizes pending over rejected and approved", () => {
    const metrics = buildCreatorContentEditorialMetricsFromSummary(
      summary({ pending_review: 2, rejected: 1, published: 3 }),
    );
    expect(buildCreatorContentEditorialSignal(metrics).type).toBe("pending");
  });

  it("shows rejected when no pending", () => {
    const metrics = buildCreatorContentEditorialMetricsFromSummary(
      summary({ rejected: 1, published: 2 }),
    );
    expect(buildCreatorContentEditorialSignal(metrics).type).toBe("rejected");
  });

  it("shows approved when only published content exists", () => {
    const metrics = buildCreatorContentEditorialMetricsFromSummary(summary({ published: 2 }));
    expect(buildCreatorContentEditorialSignal(metrics).type).toBe("approved");
  });

  it("shows empty when no content", () => {
    const metrics = buildCreatorContentEditorialMetricsFromSummary(summary());
    expect(buildCreatorContentEditorialSignal(metrics).type).toBe("empty");
  });
});

describe("buildCreatorContentEditorialNextAction", () => {
  it("routes empty file to partners", () => {
    const metrics = buildCreatorContentEditorialMetricsFromSummary(summary());
    const action = buildCreatorContentEditorialNextAction(metrics);
    expect(action.href).toBe("/partners");
  });

  it("routes pending to validation filter", () => {
    const metrics = buildCreatorContentEditorialMetricsFromSummary(
      summary({ total: 3, pending_review: 1 }),
    );
    const action = buildCreatorContentEditorialNextAction(metrics);
    expect(action.href).toContain("pending_review");
  });
});

describe("buildCreatorContentEditorialKpiCards", () => {
  it("returns five narrative KPI cards", () => {
    const metrics = buildCreatorContentEditorialMetricsFromSummary(
      summary({ total: 5, pending_review: 1, published: 2, contributing_partners: 3 }),
    );
    const cards = buildCreatorContentEditorialKpiCards(metrics);
    expect(cards).toHaveLength(5);
    expect(cards.map((c) => c.id)).toEqual([
      "total",
      "pending",
      "approved",
      "contributors",
      "rejected",
    ]);
  });
});

describe("creator content editorial momentum", () => {
  it("caps progress at 100%", () => {
    expect(creatorContentEditorialMomentumProgress(12, 10)).toBe(100);
  });

  it("uses pilot microcopy thresholds", () => {
    expect(creatorContentEditorialMomentumMicrocopy(0)).toContain("premiers récits");
    expect(creatorContentEditorialMomentumMicrocopy(2)).toContain("voix");
    expect(creatorContentEditorialMomentumMicrocopy(7)).toContain("attractive");
    expect(creatorContentEditorialMomentumMicrocopy(10)).toContain("base solide");
  });

  it("builds momentum from approved count", () => {
    const metrics = buildCreatorContentEditorialMetricsFromSummary(summary({ published: 4 }));
    const momentum = buildCreatorContentEditorialMomentum(metrics);
    expect(momentum.approvedCount).toBe(4);
    expect(momentum.goal).toBe(10);
  });
});

describe("buildCreatorContentEditorialConseilMessage", () => {
  it("advises validation when pending", () => {
    const metrics = buildCreatorContentEditorialMetricsFromSummary(
      summary({ total: 4, pending_review: 2 }),
    );
    expect(buildCreatorContentEditorialConseilMessage(metrics)).toContain("Validez rapidement");
  });
});
