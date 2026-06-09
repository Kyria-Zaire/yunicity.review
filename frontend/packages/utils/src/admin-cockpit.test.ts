import { describe, expect, it } from "vitest";

import {
  buildCockpitYunicitySignal,
  cockpitAttentionLabel,
  cockpitAttentionSeverity,
  cockpitTerritoryPulseIsSparse,
  cockpitUserGreetingName,
  cockpitYunicitySignalLevel,
  formatAdminMetric,
  formatCockpitLastCheckTime,
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

  it("formats last check time as HH:mm", () => {
    const formatted = formatCockpitLastCheckTime("2026-06-03T14:30:00.000Z");
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
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

  it("greets bootstrap admin from email local-part", () => {
    expect(
      cockpitUserGreetingName("Yunicity Bootstrap Admin", "admin@yunicity.dev"),
    ).toBe("Admin");
  });

  it("greets real first name when not system bootstrap", () => {
    expect(cockpitUserGreetingName("Rodolphe Martin", "rodolphe@example.com")).toBe("Rodolphe");
  });

  it("maps yunicity signal levels from pending total", () => {
    expect(cockpitYunicitySignalLevel(0)).toBe("serene");
    expect(cockpitYunicitySignalLevel(3)).toBe("vigilance");
    expect(cockpitYunicitySignalLevel(8)).toBe("intervention");
  });

  it("builds serene yunicity signal copy", () => {
    const signal = buildCockpitYunicitySignal({
      city: "Reims",
      usersActive: 5,
      attention: {
        offers_pending: 0,
        creator_contents_pending: 0,
        events_pending: 0,
        reports_pending: 0,
        partner_leads_open: 0,
        organizations_pending_review: 0,
      },
    });
    expect(signal.level).toBe("serene");
    expect(signal.title).toBe("Territoire serein");
    expect(signal.headline).toContain("Reims");
  });

  it("detects sparse territory pulse", () => {
    expect(
      cockpitTerritoryPulseIsSparse(
        { active: 0 } as Parameters<typeof cockpitTerritoryPulseIsSparse>[0],
        {
          events_upcoming: 0,
          stamps_today: 0,
          redemptions_today: 0,
          offers_published: 0,
          top_stamp_partner: { stamps_count: 0, name: null, organization_id: null },
        } as Parameters<typeof cockpitTerritoryPulseIsSparse>[1],
        { partner_leads_open: 0 } as Parameters<typeof cockpitTerritoryPulseIsSparse>[2],
      ),
    ).toBe(true);
  });
});
