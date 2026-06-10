import { describe, expect, it } from "vitest";

import type { AdminPassportListItem } from "@yunicity/types";

import {
  buildPassportOpsConseilMessage,
  buildPassportOpsDashboardKpisFromCockpit,
  buildPassportOpsDashboardKpisFromList,
  buildPassportOpsEngagedCitizens,
  buildPassportOpsKpiCards,
  buildPassportOpsMetricsFromCockpit,
  buildPassportOpsMetricsFromList,
  buildPassportOpsMomentum,
  buildPassportOpsNextAction,
  buildPassportOpsRecommendedAction,
  buildPassportOpsSignal,
  passportOpsActivePassportCount,
  passportOpsCitizenInitials,
  passportOpsLastActivityAt,
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
    expect(signal.title).toBe("Programme en attente");
    expect(signal.description).toContain("Aucun citoyen");
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
    expect(signal.title).toBe("Vigilance requise");
    expect(signal.description).toContain("2");
  });

  it("signale un programme lancé", () => {
    const signal = buildPassportOpsSignal(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 3,
          stamps_total: 1,
          qr_stamps: 1,
          partner_stamps: 0,
          redemptions_total: 0,
          redemptions_completed: 0,
        },
        0,
      ),
    );
    expect(signal.type).toBe("active");
    expect(signal.description).toContain("Reims");
  });
});

describe("buildPassportOpsNextAction", () => {
  it("priorise les suspensions", () => {
    const action = buildPassportOpsNextAction(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 4,
          stamps_total: 2,
          qr_stamps: 1,
          partner_stamps: 1,
          redemptions_total: 0,
          redemptions_completed: 0,
        },
        1,
      ),
    );
    expect(action.ctaLabel).toBe("Voir les suspensions");
    expect(action.href).toContain("status=suspended");
  });

  it("propose le scan sans tampon", () => {
    const action = buildPassportOpsNextAction(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 2,
          stamps_total: 0,
          qr_stamps: 0,
          partner_stamps: 0,
          redemptions_total: 0,
          redemptions_completed: 0,
        },
        0,
      ),
    );
    expect(action.href).toBe("/partner-scan");
  });

  it("propose les partenaires sous l'objectif pilote", () => {
    const action = buildPassportOpsNextAction(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 10,
          stamps_total: 3,
          qr_stamps: 2,
          partner_stamps: 1,
          redemptions_total: 0,
          redemptions_completed: 0,
        },
        0,
      ),
    );
    expect(action.href).toBe("/partners");
  });
});

describe("buildPassportOpsConseilMessage", () => {
  it("invite au premier tampon", () => {
    const message = buildPassportOpsConseilMessage(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 2,
          stamps_total: 0,
          qr_stamps: 0,
          partner_stamps: 0,
          redemptions_total: 0,
          redemptions_completed: 0,
        },
        0,
      ),
    );
    expect(message).toContain("première interaction");
  });

  it("félicite l'objectif pilote atteint", () => {
    const message = buildPassportOpsConseilMessage(
      buildPassportOpsMetricsFromCockpit(
        "Reims",
        {
          passports_total: 50,
          stamps_total: 10,
          qr_stamps: 5,
          partner_stamps: 5,
          redemptions_total: 2,
          redemptions_completed: 2,
        },
        0,
      ),
    );
    expect(message).toContain("base solide");
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
    expect(passportOpsMomentumMicrocopy(10)).toContain("territoire");
  });

  it("utilise les Passport actifs hors suspensions", () => {
    const metrics = buildPassportOpsMetricsFromCockpit(
      "Reims",
      {
        passports_total: 10,
        stamps_total: 1,
        qr_stamps: 1,
        partner_stamps: 0,
        redemptions_total: 0,
        redemptions_completed: 0,
      },
      2,
    );
    expect(passportOpsActivePassportCount(metrics)).toBe(8);
    expect(buildPassportOpsMomentum(metrics).activeCount).toBe(8);
  });
});

describe("buildPassportOpsDashboardKpisFromCockpit", () => {
  it("retourne 5 KPI cockpit avec tendances réelles", () => {
    const kpis = buildPassportOpsDashboardKpisFromCockpit(
      {
        passports_total: 10,
        stamps_total: 4,
        qr_stamps: 2,
        partner_stamps: 2,
        redemptions_total: 3,
        redemptions_completed: 2,
      },
      {
        offers_published: 0,
        stamps_today: 1,
        redemptions_today: 1,
        passports_last_7_days: 2,
        events_upcoming: 0,
        top_stamp_partner: { organization_id: null, name: null, stamps_count: 0 },
      },
      1,
    );
    expect(kpis).toHaveLength(5);
    expect(kpis[0]?.value).toBe(10);
    expect(kpis[1]?.value).toBe(9);
    expect(kpis[0]?.trend).toContain("cette semaine");
  });
});

describe("buildPassportOpsDashboardKpisFromList", () => {
  it("indique une vue filtrée", () => {
    const kpis = buildPassportOpsDashboardKpisFromList(
      buildPassportOpsMetricsFromList("Reims", 3, [listItem()], true),
    );
    expect(kpis[0]?.label).toBe("Passports (résultats)");
    expect(kpis[0]?.trend).toBe("Vue filtrée");
  });
});

describe("passportOpsCitizenInitials", () => {
  it("dérive les initiales du nom ou de l'email", () => {
    expect(passportOpsCitizenInitials("Alice Martin", "a@x.fr")).toBe("AM");
    expect(passportOpsCitizenInitials(null, "admin@yunicity.dev")).toBe("AD");
  });
});

describe("passportOpsLastActivityAt", () => {
  it("privilégie activated_at", () => {
    expect(
      passportOpsLastActivityAt(
        listItem({ activated_at: "2026-06-09T10:00:00Z", created_at: "2026-06-01T10:00:00Z" }),
      ),
    ).toBe("2026-06-09T10:00:00Z");
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
