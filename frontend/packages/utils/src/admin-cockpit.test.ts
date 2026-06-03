import { describe, expect, it } from "vitest";

import {
  cockpitAttentionLabel,
  cockpitAttentionSeverity,
  formatAdminMetric,
  formatGeneratedAt,
} from "./admin-cockpit";

describe("admin-cockpit helpers", () => {
  it("formats metrics in fr-FR", () => {
    expect(formatAdminMetric(1234)).toBe("1\u202f234");
  });

  it("formats generated_at", () => {
    const formatted = formatGeneratedAt("2026-06-03T10:00:00.000Z");
    expect(formatted.length).toBeGreaterThan(5);
  });

  it("returns attention labels", () => {
    expect(cockpitAttentionLabel("offers_pending")).toBe("Offres en attente");
  });

  it("maps severity from count", () => {
    expect(cockpitAttentionSeverity(0)).toBe("none");
    expect(cockpitAttentionSeverity(1)).toBe("low");
    expect(cockpitAttentionSeverity(5)).toBe("medium");
    expect(cockpitAttentionSeverity(12)).toBe("high");
  });
});
