import { describe, expect, it } from "vitest";

import type { AdminPassportListItem } from "@yunicity/types";

import {
  buildPassportOpsEngagedCitizens,
  buildPassportOpsKpiCards,
  buildPassportOpsMetricsFromCockpit,
  buildPassportOpsMetricsFromList,
  buildPassportOpsMomentum,
  buildPassportOpsRecommendedAction,
  buildPassportOpsSignal,
  passportOpsMomentumMicrocopy,
} from "./passport-ops-command";

function listItem(overrides: Partial<AdminPassportListItem> = {}): AdminPassportListItem {
  return {
    id: "p-1",
    passport_number: "YC-0001",
    city: "Reims",
    status: "active",
    tier_code: "bronze",
    user: { id: "u-1", email: "citoyen@mail.fr", display_name: "Alice Martin" },
    stamps_count: 0,
    redemptions_count: 0,
    activated_at: null,
    suspended_at: null,
    created_at: "2026-06-01T10:00:00Z",
    ...overrides,
  };
}

describe("buildPassportOpsSignal", () => {
  it("signale un programme vide", () => {
    const signal = buildPassportOpsSignal(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 0,
          stamps_total: 0,
          qr_stamps: 0,
          partner_stamps: 0,
          redemptions_total: 0,
          redemptions_completed: 0,
        },
        0,
      ),
    );
    expect(signal.type).toBe("empty");
    expect(signal.description).toContain("Reims");
  });

  it("priorise les suspensions", () => {
    const signal = buildPassportOpsSignal(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 5,
          stamps_total: 2,
          qr_stamps: 1,
          partner_stamps: 1,
          redemptions_total: 1,
          redemptions_completed: 1,
        },
        2,
      ),
    );
    expect(signal.type).toBe("attention");
  });
});

describe("buildPassportOpsRecommendedAction", () => {
  it("propose le scan quand aucun passport", () => {
    const action = buildPassportOpsRecommendedAction(
      buildPassportOpsMetricsFromList("Reims", 0, [], false),
    );
    expect(action.ctaLabel).toBe("Scanner un Passport");
  });

  it("propose les partenaires sans rédemption", () => {
    const action = buildPassportOpsRecommendedAction(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 3,
          stamps_total: 4,
          qr_stamps: 2,
          partner_stamps: 2,
          redemptions_total: 0,
          redemptions_completed: 0,
        },
        0,
      ),
    );
    expect(action.href).toBe("/partners");
  });
});

describe("buildPassportOpsKpiCards", () => {
  it("retourne 4 KPI narratifs", () => {
    const cards = buildPassportOpsKpiCards(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 2,
          stamps_total: 5,
          qr_stamps: 2,
          partner_stamps: 3,
          redemptions_total: 1,
          redemptions_completed: 1,
        },
        0,
      ),
    );
    expect(cards).toHaveLength(4);
    expect(cards[0]?.label).toBe("Passport actifs");
  });
});

describe("buildPassportOpsMomentum", () => {
  it("calcule la progression pilote", () => {
    const momentum = buildPassportOpsMomentum(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 10,
          stamps_total: 1,
          qr_stamps: 1,
          partner_stamps: 0,
          redemptions_total: 0,
          redemptions_completed: 0,
        },
        0,
      ),
    );
    expect(momentum.progressPercent).toBe(20);
    expect(passportOpsMomentumMicrocopy(10)).toContain("communauté");
  });
});

describe("buildPassportOpsEngagedCitizens", () => {
  it("retourne le top 5 réel de la page", () => {
    const citizens = buildPassportOpsEngagedCitizens(
      [
        listItem({ id: "1", stamps_count: 1 }),
        listItem({ id: "2", stamps_count: 5, user: { id: "u2", email: "b@x.fr", display_name: "Bob" } }),
      ],
      (code) => code,
      (id) => `/passport-ops/${id}`,
    );
    expect(citizens[0]?.name).toBe("Bob");
    expect(citizens).toHaveLength(2);
  });
});
