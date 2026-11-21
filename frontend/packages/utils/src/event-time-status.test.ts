/**
 * EVENTS-PAST-01 — règle temporelle unique (statut et actions de la fiche).
 * Fin effective : `ends_at` valide, sinon max(début + 2 h, minuit suivant à Paris).
 */
import { describe, expect, it } from "vitest";

import { formatEventCountdownLabel, nextEventCountdownLabelChangeMs } from "./event-detail-desktop";
import {
  nextEventTimeTransitionMs,
  nextLocalMidnightMs,
  resolveEventEffectiveEndMs,
  resolveEventTimeStatus,
} from "./event-time-status";

const ms = (iso: string) => Date.parse(iso);
const H = 3_600_000;

describe("nextLocalMidnightMs — minuit suivant à Paris, calculé comme date locale", () => {
  it("heure d'hiver : 10:00 → minuit du soir (23:00Z)", () => {
    expect(nextLocalMidnightMs(ms("2026-11-12T10:00:00+01:00"))).toBe(ms("2026-11-12T23:00:00Z"));
  });

  it("heure d'été : 10:00 → minuit du soir (22:00Z)", () => {
    expect(nextLocalMidnightMs(ms("2026-07-14T10:00:00+02:00"))).toBe(ms("2026-07-14T22:00:00Z"));
  });

  it("passage à l'heure d'été (29/03/2026) : la journée dure 23 h", () => {
    const debutDuJour = ms("2026-03-29T00:00:00+01:00");
    const minuit = nextLocalMidnightMs(debutDuJour);
    expect(minuit).toBe(ms("2026-03-30T00:00:00+02:00"));
    expect(minuit! - debutDuJour).toBe(23 * H);
  });

  it("passage à l'heure d'hiver (25/10/2026) : la journée dure 25 h", () => {
    const debutDuJour = ms("2026-10-25T00:00:00+02:00");
    const minuit = nextLocalMidnightMs(debutDuJour);
    expect(minuit).toBe(ms("2026-10-26T00:00:00+01:00"));
    expect(minuit! - debutDuJour).toBe(25 * H);
  });

  it("veille du changement d'heure, 23:30 → minuit encore à +01:00", () => {
    expect(nextLocalMidnightMs(ms("2026-03-28T23:30:00+01:00"))).toBe(ms("2026-03-29T00:00:00+01:00"));
  });

  it("début à 00:00 pile → minuit du jour SUIVANT", () => {
    expect(nextLocalMidnightMs(ms("2026-11-13T00:00:00+01:00"))).toBe(ms("2026-11-14T00:00:00+01:00"));
  });

  it("fin de mois et fin d'année", () => {
    expect(nextLocalMidnightMs(ms("2026-11-30T20:00:00+01:00"))).toBe(ms("2026-12-01T00:00:00+01:00"));
    expect(nextLocalMidnightMs(ms("2026-12-31T20:00:00+01:00"))).toBe(ms("2027-01-01T00:00:00+01:00"));
  });

  it("instant illisible → null", () => {
    expect(nextLocalMidnightMs(Number.NaN)).toBeNull();
  });
});

describe("resolveEventEffectiveEndMs — convention D1-F2", () => {
  it("fin renseignée et valide : elle est utilisée telle quelle", () => {
    expect(resolveEventEffectiveEndMs("2026-11-12T10:00:00+01:00", "2026-11-12T11:00:00+01:00")).toBe(
      ms("2026-11-12T11:00:00+01:00"),
    );
  });

  it("fin égale au début : valide", () => {
    expect(resolveEventEffectiveEndMs("2026-11-12T10:00:00Z", "2026-11-12T10:00:00Z")).toBe(ms("2026-11-12T10:00:00Z"));
  });

  it("sans fin, journée : le minuit suivant l'emporte sur début + 2 h", () => {
    expect(resolveEventEffectiveEndMs("2026-11-12T10:00:00+01:00", null)).toBe(ms("2026-11-13T00:00:00+01:00"));
  });

  it("sans fin, début 22:00 : début + 2 h = minuit", () => {
    expect(resolveEventEffectiveEndMs("2026-11-12T22:00:00+01:00", null)).toBe(ms("2026-11-13T00:00:00+01:00"));
  });

  it("sans fin, début 22:59 : début + 2 h l'emporte (00:59)", () => {
    expect(resolveEventEffectiveEndMs("2026-11-12T22:59:00+01:00", null)).toBe(ms("2026-11-13T00:59:00+01:00"));
  });

  it("sans fin, début 23:30 : début + 2 h l'emporte (01:30)", () => {
    expect(resolveEventEffectiveEndMs("2026-11-12T23:30:00+01:00", null)).toBe(ms("2026-11-13T01:30:00+01:00"));
  });

  it("sans fin, début 23:30 la veille du passage à l'heure d'été : 2 h réelles", () => {
    expect(resolveEventEffectiveEndMs("2026-03-28T23:30:00+01:00", null)).toBe(ms("2026-03-29T01:30:00+01:00"));
  });

  it("sans fin, début 23:30 le jour du passage à l'heure d'hiver", () => {
    const start = "2026-10-25T23:30:00+01:00";
    expect(resolveEventEffectiveEndMs(start, null)).toBe(ms(start) + 2 * H);
  });

  it("sans fin, 10:00 le jour du passage à l'heure d'été : minuit à +02:00", () => {
    expect(resolveEventEffectiveEndMs("2026-03-29T10:00:00+02:00", null)).toBe(ms("2026-03-30T00:00:00+02:00"));
  });

  it("fin antérieure au début : traitée comme absente", () => {
    expect(resolveEventEffectiveEndMs("2026-11-12T10:00:00+01:00", "2026-11-12T09:00:00+01:00")).toBe(
      ms("2026-11-13T00:00:00+01:00"),
    );
  });

  it("fin illisible : traitée comme absente", () => {
    expect(resolveEventEffectiveEndMs("2026-11-12T10:00:00+01:00", "pas une date")).toBe(
      ms("2026-11-13T00:00:00+01:00"),
    );
  });

  it("écriture Z ou +01:00 : même instant, même fin", () => {
    expect(resolveEventEffectiveEndMs("2026-11-12T09:00:00Z", null)).toBe(
      resolveEventEffectiveEndMs("2026-11-12T10:00:00+01:00", null),
    );
  });

  it("début illisible → null", () => {
    expect(resolveEventEffectiveEndMs("", null)).toBeNull();
  });
});

describe("resolveEventTimeStatus — limites exactes", () => {
  const start = "2026-11-12T18:00:00Z";
  const end = "2026-11-12T20:00:00Z";
  const at = (iso: string, delta = 0) => new Date(ms(iso) + delta);

  it("1 ms avant le début : à venir", () => {
    expect(resolveEventTimeStatus(start, end, at(start, -1))).toBe("upcoming");
  });
  it("au début : en cours", () => {
    expect(resolveEventTimeStatus(start, end, at(start))).toBe("ongoing");
  });
  it("1 ms avant la fin : en cours", () => {
    expect(resolveEventTimeStatus(start, end, at(end, -1))).toBe("ongoing");
  });
  it("à la fin pile : terminé", () => {
    expect(resolveEventTimeStatus(start, end, at(end))).toBe("ended");
  });
  it("sans fin, 10:00 → en cours à 12:00 et à 23:59:59.999, terminé à minuit (Paris)", () => {
    const debut = "2026-11-12T10:00:00+01:00";
    expect(resolveEventTimeStatus(debut, null, at("2026-11-12T12:00:00+01:00"))).toBe("ongoing");
    expect(resolveEventTimeStatus(debut, null, at("2026-11-13T00:00:00+01:00", -1))).toBe("ongoing");
    expect(resolveEventTimeStatus(debut, null, at("2026-11-13T00:00:00+01:00"))).toBe("ended");
  });
  it("début illisible : inconnu", () => {
    expect(resolveEventTimeStatus("??", null, at(start))).toBe("unknown");
  });
});

describe("nextEventTimeTransitionMs", () => {
  const start = "2026-11-12T18:00:00Z";
  const end = "2026-11-12T20:00:00Z";
  it("à venir → le début ; en cours → la fin ; terminé → aucune", () => {
    expect(nextEventTimeTransitionMs(start, end, new Date(ms(start) - 1))).toBe(ms(start));
    expect(nextEventTimeTransitionMs(start, end, new Date(ms(start)))).toBe(ms(end));
    expect(nextEventTimeTransitionMs(start, end, new Date(ms(end)))).toBeNull();
  });
});

describe("formatEventCountdownLabel — même règle que les actions", () => {
  it("sans fin, début 10:00 : « En cours » à 12:00 (l'ancien repli disait « Terminé »)", () => {
    expect(
      formatEventCountdownLabel("2026-11-12T10:00:00+01:00", null, new Date(ms("2026-11-12T12:00:00+01:00"))),
    ).toBe("En cours");
  });
  it("sans fin : « Terminé » au minuit suivant", () => {
    expect(
      formatEventCountdownLabel("2026-11-12T10:00:00+01:00", null, new Date(ms("2026-11-13T00:00:00+01:00"))),
    ).toBe("Terminé");
  });
  it("fin renseignée : « Terminé » à la fin pile, « En cours » 1 ms avant", () => {
    const s = "2026-11-12T18:00:00Z";
    const e = "2026-11-12T20:00:00Z";
    expect(formatEventCountdownLabel(s, e, new Date(ms(e)))).toBe("Terminé");
    expect(formatEventCountdownLabel(s, e, new Date(ms(e) - 1))).toBe("En cours");
  });
  it("à venir : compte à rebours inchangé", () => {
    expect(formatEventCountdownLabel("2026-11-12T18:00:00Z", null, new Date(ms("2026-11-12T15:30:00Z")))).toBe(
      "Commence dans 2 h 30 min",
    );
  });
  it("début illisible : aucun libellé", () => {
    expect(formatEventCountdownLabel("??", null)).toBeNull();
  });
});

describe("nextEventCountdownLabelChangeMs — le compte à rebours reste vivant avant le début", () => {
  const start = "2026-11-12T18:00:00Z";
  const end = "2026-11-12T20:00:00Z";
  const label = (t: number) => formatEventCountdownLabel(start, end, new Date(t));

  it("à 2 h 30 du début : change 30 s + 1 ms plus tard, pas avant", () => {
    const now = ms(start) - 150 * 60_000;
    const next = nextEventCountdownLabelChangeMs(start, end, new Date(now))!;
    expect(next).toBe(now + 30_001);
    expect(label(next - 1)).toBe("Commence dans 2 h 30 min");
    expect(label(next)).toBe("Commence dans 2 h 29 min");
  });

  it("chaque échéance donne un texte nouveau, jusqu'au début", () => {
    let t = ms(start) - 5 * 60_000 - 12_345;
    const vus: string[] = [];
    for (let i = 0; i < 20 && t < ms(start); i += 1) {
      vus.push(label(t)!);
      t = nextEventCountdownLabelChangeMs(start, end, new Date(t))!;
    }
    expect(t).toBe(ms(start));
    expect(new Set(vus).size).toBe(vus.length);
    expect(label(t)).toBe("En cours");
  });

  it("en cours → la fin ; terminé → aucune échéance", () => {
    expect(nextEventCountdownLabelChangeMs(start, end, new Date(ms(start)))).toBe(ms(end));
    expect(nextEventCountdownLabelChangeMs(start, end, new Date(ms(end)))).toBeNull();
  });

  it("événement à 4 mois : prochaine échéance dans moins d'une minute", () => {
    const now = ms(start) - 120 * 24 * H;
    const next = nextEventCountdownLabelChangeMs(start, end, new Date(now))!;
    expect(next - now).toBeGreaterThan(0);
    expect(next - now).toBeLessThanOrEqual(60_000);
  });
});

describe("bilan F2 — la fin estimée est le MAXIMUM, pas toujours minuit", () => {
  it.each([
    ["10:00", "2026-11-12T10:00:00+01:00", "2026-11-13T00:00:00+01:00"],
    ["21:30", "2026-11-12T21:30:00+01:00", "2026-11-13T00:00:00+01:00"],
    ["22:00 (égalité)", "2026-11-12T22:00:00+01:00", "2026-11-13T00:00:00+01:00"],
    ["22:59", "2026-11-12T22:59:00+01:00", "2026-11-13T00:59:00+01:00"],
    ["23:30", "2026-11-12T23:30:00+01:00", "2026-11-13T01:30:00+01:00"],
  ])("début %s → fin estimée", (_nom, debut, fin) => {
    expect(resolveEventEffectiveEndMs(debut, null)).toBe(ms(fin));
  });
});
