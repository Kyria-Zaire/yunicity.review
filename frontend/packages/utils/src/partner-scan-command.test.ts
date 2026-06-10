import { describe, expect, it } from "vitest";

import {
  buildPartnerScanKpiCards,
  buildPartnerScanNextAction,
  buildPartnerScanSessionKpis,
  buildPartnerScanSignal,
  derivePartnerScanPhase,
  formatPartnerScanLastValidation,
} from "./partner-scan-command";

describe("derivePartnerScanPhase", () => {
  it("prioritizes resolving", () => {
    expect(
      derivePartnerScanPhase({
        isResolving: true,
        passportResolved: true,
        redeemSuccess: false,
        hasBlockingError: false,
      }),
    ).toBe("resolving");
  });

  it("shows redeemed after success", () => {
    expect(
      derivePartnerScanPhase({
        isResolving: false,
        passportResolved: true,
        redeemSuccess: true,
        hasBlockingError: false,
      }),
    ).toBe("redeemed");
  });

  it("shows error when resolve failed", () => {
    expect(
      derivePartnerScanPhase({
        isResolving: false,
        passportResolved: false,
        redeemSuccess: false,
        hasBlockingError: true,
      }),
    ).toBe("error");
  });

  it("shows resolved when passport found", () => {
    expect(
      derivePartnerScanPhase({
        isResolving: false,
        passportResolved: true,
        redeemSuccess: false,
        hasBlockingError: false,
      }),
    ).toBe("resolved");
  });
});

describe("buildPartnerScanSignal", () => {
  it("maps idle scanner ready copy", () => {
    const signal = buildPartnerScanSignal("idle");
    expect(signal.title).toContain("prêt");
  });

  it("surfaces API error on error phase", () => {
    const signal = buildPartnerScanSignal("error", "Code invalide");
    expect(signal.description).toBe("Code invalide");
  });
});

describe("buildPartnerScanNextAction", () => {
  it("routes redeemed to new scan", () => {
    expect(buildPartnerScanNextAction("redeemed", false).action).toBe("new-scan");
  });

  it("requires offer selection when cannot redeem", () => {
    expect(buildPartnerScanNextAction("resolved", false).ctaLabel).toContain("offre");
  });
});

describe("buildPartnerScanSessionKpis", () => {
  it("uses session-only last validation", () => {
    const cards = buildPartnerScanSessionKpis({
      phase: "idle",
      inputMode: "manual",
      lastValidationAt: null,
    });
    expect(cards.find((c) => c.id === "last")?.value).toBe("—");
  });

  it("reflects resolved status in session KPIs", () => {
    const cards = buildPartnerScanSessionKpis({
      phase: "resolved",
      inputMode: "manual",
      lastValidationAt: null,
    });
    expect(cards.find((c) => c.id === "status")?.value).toBe("Résolu");
    expect(cards.find((c) => c.id === "mode")?.value).toBe("Saisie manuelle");
  });

  it("aliases buildPartnerScanKpiCards", () => {
    const input = {
      phase: "redeemed" as const,
      inputMode: "manual" as const,
      lastValidationAt: "2026-06-10T12:00:00.000Z",
    };
    expect(buildPartnerScanKpiCards(input)).toEqual(buildPartnerScanSessionKpis(input));
  });
});

describe("formatPartnerScanLastValidation", () => {
  it("formats locale timestamp", () => {
    expect(formatPartnerScanLastValidation("2026-06-10T12:00:00.000Z")).not.toBe("—");
  });
});
