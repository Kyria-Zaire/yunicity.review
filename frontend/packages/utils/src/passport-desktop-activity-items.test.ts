import { describe, expect, it } from "vitest";

import type { PassportStamp } from "@yunicity/types";

import { buildPassportDesktopActivityItems } from "./passport-desktop-presenter";
import { formatPassportMobileActivityDate } from "./passport-mobile-presenter";

const VISIT_TITLE = "Lieu partenaire découvert";
const MEMORY_FALLBACK_TITLE = "Souvenir enregistré";
const POSITIONAL_TITLES = ["Avantage utilisé", "Participation enregistrée"];

/** Newest first: D0 is the most recent date. */
const DATES = ["2026-10-03T10:00:00Z", "2026-10-02T10:00:00Z", "2026-10-01T10:00:00Z"] as const;
const [D0, D1, D2] = DATES;

function visit(id: string, stampedAt: string, orgName = `Partenaire ${id}`): PassportStamp {
  return {
    id,
    kind: "visit",
    stamped_at: stampedAt,
    stamp_source: "qr",
    organization: { id: `org-${id}`, slug: `org-${id}`, name: orgName, city: "Reims", logo_url: null },
  };
}

function memory(id: string, stampedAt: string, humanLine: string | null): PassportStamp {
  return {
    id,
    kind: "memory",
    stamped_at: stampedAt,
    title: `Souvenir ${id}`,
    description: null,
    human_line: humanLine,
    organization: null,
  };
}

describe("PASSPORT-ACTIVITY-TITLES-01 — titres d'« Activité récente »", () => {
  it("trois visites gardent toutes le titre de visite, jamais un titre par position", () => {
    const items = buildPassportDesktopActivityItems([visit("a", D0), visit("b", D1), visit("c", D2)]);

    expect(items.map((item) => item.title)).toEqual([VISIT_TITLE, VISIT_TITLE, VISIT_TITLE]);
    for (const item of items) {
      expect(POSITIONAL_TITLES).not.toContain(item.title);
    }
  });

  it("une visite en troisième position garde son titre de visite", () => {
    const items = buildPassportDesktopActivityItems([
      memory("m1", D0, "Premier café découvert à Reims."),
      memory("m2", D1, "Balade du centre à Reims."),
      visit("v", D2),
    ]);

    expect(items[2]).toMatchObject({ id: "v", title: VISIT_TITLE });
  });

  it("déplacer une même entrée ne change ni son titre ni son icône", () => {
    const movedEntries: Array<(date: string) => PassportStamp> = [
      (date) => visit("x", date),
      (date) => memory("x", date, "Premier café découvert à Reims."),
    ];

    for (const moved of movedEntries) {
      const seen = DATES.map((date, rank) => {
        const others = DATES.filter((_, other) => other !== rank).map((otherDate, n) =>
          visit(`o${n}`, otherDate),
        );
        const items = buildPassportDesktopActivityItems([...others, moved(date)]);
        expect(items[rank]?.id).toBe("x");
        return `${items[rank]?.title} | ${items[rank]?.tone}`;
      });

      expect(new Set(seen).size).toBe(1);
    }
  });

  it("toutes les entrées portent l'icône épingle, quelle que soit leur position", () => {
    const items = buildPassportDesktopActivityItems([
      visit("a", D0),
      memory("m", D1, "Balade du centre à Reims."),
      visit("c", D2),
    ]);

    expect(items.map((item) => item.tone)).toEqual(["blue", "blue", "blue"]);
  });

  it("conserve human_line (rogné) en priorité, puis « Souvenir enregistré » pour un souvenir", () => {
    const items = buildPassportDesktopActivityItems([
      memory("m1", D0, "  Premier café découvert à Reims.  "),
      memory("m2", D1, "   "),
      { ...visit("v", D2), human_line: "Passage chez Belga Queen." },
    ]);

    expect(items.map((item) => item.title)).toEqual([
      "Premier café découvert à Reims.",
      MEMORY_FALLBACK_TITLE,
      "Passage chez Belga Queen.",
    ]);
  });
});

describe("PASSPORT-ACTIVITY-TITLES-01 — comportement inchangé", () => {
  it("trie du plus récent au plus ancien et garde trois entrées par défaut", () => {
    const items = buildPassportDesktopActivityItems([
      visit("old", "2026-09-01T10:00:00Z"),
      visit("newest", "2026-10-05T10:00:00Z"),
      visit("mid", "2026-09-20T10:00:00Z"),
      visit("recent", "2026-10-01T10:00:00Z"),
    ]);

    expect(items.map((item) => item.id)).toEqual(["newest", "recent", "mid"]);
  });

  it("respecte une limite explicite", () => {
    const stamps = [visit("a", D0), visit("b", D1), visit("c", D2)];

    expect(buildPassportDesktopActivityItems(stamps, 2).map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("garde les sous-titres et les dates", () => {
    const items = buildPassportDesktopActivityItems([
      visit("v", D0, "  Belga Queen  "),
      memory("m", D1, "Balade du centre à Reims."),
      { id: "bare", kind: "visit", stamped_at: D2 },
    ]);

    expect(items.map((item) => item.subtitle)).toEqual([
      "Belga Queen",
      "Souvenir m",
      "Passage enregistré",
    ]);
    expect(items.map((item) => item.dateLabel)).toEqual(
      DATES.map((date) => formatPassportMobileActivityDate(date)),
    );
  });
});
