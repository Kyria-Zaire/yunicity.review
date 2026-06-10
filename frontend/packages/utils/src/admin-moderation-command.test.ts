import { describe, expect, it } from "vitest";

import {
  MODERATION_ATTENTION_THRESHOLD,
  buildModerationTrustSafetyConseilMessage,
  buildModerationTrustSafetyKpiCards,
  buildModerationTrustSafetyMetricsFromSummary,
  buildModerationTrustSafetyMomentum,
  buildModerationTrustSafetyNextAction,
  buildModerationTrustSafetyRecommendedAction,
  buildModerationTrustSafetySignal,
  moderationHasActiveFilters,
  moderationTrustSafetyMomentumMicrocopy,
} from "./admin-moderation-command";

const baseSummary = {
  generated_at: "2026-06-04T10:00:00.000Z",
  total: 0,
  pending: 0,
  resolved: 0,
  dismissed: 0,
  dominant_reason: null,
} as const;

describe("buildModerationTrustSafetySignal", () => {
  it("prioritizes attention when pending reaches threshold", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary({
      ...baseSummary,
      total: 8,
      pending: MODERATION_ATTENTION_THRESHOLD,
    });
    const signal = buildModerationTrustSafetySignal(metrics);
    expect(signal.type).toBe("attention");
    expect(signal.title).toContain("Attention");
  });

  it("shows pending signal below threshold", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary({
      ...baseSummary,
      total: 2,
      pending: 2,
    });
    expect(buildModerationTrustSafetySignal(metrics).type).toBe("pending");
  });

  it("shows controlled when resolved and no pending", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary({
      ...baseSummary,
      total: 3,
      resolved: 2,
      dismissed: 1,
    });
    expect(buildModerationTrustSafetySignal(metrics).type).toBe("controlled");
  });

  it("shows empty when no reports", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary(baseSummary);
    expect(buildModerationTrustSafetySignal(metrics).type).toBe("empty");
  });
});

describe("buildModerationTrustSafetyNextAction", () => {
  it("routes empty file to creator content", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary(baseSummary);
    const action = buildModerationTrustSafetyNextAction(metrics);
    expect(action.href).toBe("/creator-content");
  });

  it("routes pending queue to pending filter", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary({
      ...baseSummary,
      total: 4,
      pending: 3,
    });
    const action = buildModerationTrustSafetyNextAction(metrics);
    expect(action.href).toContain("status=pending");
    expect(action.title).toContain("Examinez");
  });

  it("routes controlled file to all reports", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary({
      ...baseSummary,
      total: 5,
      resolved: 5,
    });
    const action = buildModerationTrustSafetyNextAction(metrics);
    expect(action.href).toContain("status=all");
  });
});

describe("buildModerationTrustSafetyKpiCards", () => {
  it("includes dominant reason label", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary({
      ...baseSummary,
      total: 10,
      pending: 2,
      dominant_reason: "spam",
    });
    const cards = buildModerationTrustSafetyKpiCards(metrics);
    const dominant = cards.find((card) => card.id === "dominant_reason");
    expect(dominant?.displayValue).toBe("Spam");
    expect(dominant?.hint).toBe("Motif principal");
  });

  it("shows dash when no dominant reason", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary(baseSummary);
    const dominant = buildModerationTrustSafetyKpiCards(metrics).find(
      (card) => card.id === "dominant_reason",
    );
    expect(dominant?.displayValue).toBe("—");
  });
});

describe("buildModerationTrustSafetyMomentum", () => {
  it("caps progress at threshold", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary({
      ...baseSummary,
      pending: 12,
    });
    const momentum = buildModerationTrustSafetyMomentum(metrics);
    expect(momentum.progressRatio).toBe(1);
    expect(momentum.progressPercent).toBe(100);
    expect(momentum.microcopy).toContain("revue rapide");
  });

  it("describes manageable queue", () => {
    expect(moderationTrustSafetyMomentumMicrocopy(2)).toContain("maîtrisable");
  });
});

describe("buildModerationTrustSafetyConseilMessage", () => {
  it("warns when threshold exceeded", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary({
      ...baseSummary,
      total: MODERATION_ATTENTION_THRESHOLD,
      pending: MODERATION_ATTENTION_THRESHOLD,
    });
    expect(buildModerationTrustSafetyConseilMessage(metrics)).toContain("seuil");
  });
});

describe("moderationHasActiveFilters", () => {
  it("detects non-default filters", () => {
    expect(
      moderationHasActiveFilters({ status: "pending", reason: "", page: 1 }),
    ).toBe(false);
    expect(
      moderationHasActiveFilters({ status: "all", reason: "", page: 1 }),
    ).toBe(true);
    expect(
      moderationHasActiveFilters({ status: "pending", reason: "spam", page: 1 }),
    ).toBe(true);
  });
});

describe("buildModerationTrustSafetyRecommendedAction", () => {
  it("aligns with pending queue", () => {
    const metrics = buildModerationTrustSafetyMetricsFromSummary({
      ...baseSummary,
      total: 2,
      pending: 1,
    });
    expect(buildModerationTrustSafetyRecommendedAction(metrics).href).toContain(
      "status=pending",
    );
  });
});
