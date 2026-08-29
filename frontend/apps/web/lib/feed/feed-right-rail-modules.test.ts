import type { LocalEvent, Tribe } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import {
  selectFeedRightRailEveningEvents,
  selectMemberTribes,
  selectTonightEvents,
  selectUpcomingEveningEvents,
  tribeInitials,
} from "./feed-right-rail-modules";

const PARIS = "Europe/Paris";

function event(overrides: Partial<LocalEvent> & { id: string; starts_at: string }): LocalEvent {
  return {
    organization_id: null,
    title: `Event ${overrides.id}`,
    description: null,
    event_type: null,
    city: "Reims",
    district: null,
    ends_at: null,
    timezone: PARIS,
    location_name: "Boulingrin",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    organization: null,
    created_at: "2026-08-27T00:00:00Z",
    ...overrides,
  } as LocalEvent;
}

function tribe(overrides: Partial<Tribe> & { id: string; slug: string; name: string }): Tribe {
  return {
    description: "",
    city: "Reims",
    category: "sport_local",
    visibility: "public",
    persistence_kind: "permanent",
    cover_image_url: null,
    is_featured: false,
    member_limit: 100,
    active_member_count: 12,
    is_archived: false,
    viewer_is_member: true,
    viewer_role: "member",
    viewer_notifications_muted: false,
    viewer_has_pending_join_request: false,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  } as Tribe;
}

/** 27 aout 2026, 16:00 a Paris (UTC+2 en ete) = 14:00Z. */
const NOW_AFTERNOON = new Date("2026-08-27T14:00:00Z");
/** 27 aout 2026, 20:00 a Paris = 18:00Z. */
const NOW_EVENING = new Date("2026-08-27T18:00:00Z");

describe("selectTonightEvents", () => {
  it("garde un evenement de ce soir vu depuis l'apres-midi", () => {
    const tonight = event({ id: "a", starts_at: "2026-08-27T17:00:00Z" }); // 19:00 Paris
    expect(selectTonightEvents([tonight], NOW_AFTERNOON).map((e) => e.id)).toEqual(["a"]);
  });

  it("exclut un evenement avant 18:00 locales", () => {
    const afternoon = event({ id: "a", starts_at: "2026-08-27T15:00:00Z" }); // 17:00 Paris
    expect(selectTonightEvents([afternoon], NOW_AFTERNOON)).toEqual([]);
  });

  it("garde un evenement a exactement 18:00 locales", () => {
    const sharp = event({ id: "a", starts_at: "2026-08-27T16:00:00Z" }); // 18:00 Paris
    expect(selectTonightEvents([sharp], NOW_AFTERNOON).map((e) => e.id)).toEqual(["a"]);
  });

  it("garde un evenement a 23:59 locales", () => {
    const late = event({ id: "a", starts_at: "2026-08-27T21:59:00Z" }); // 23:59 Paris
    expect(selectTonightEvents([late], NOW_AFTERNOON).map((e) => e.id)).toEqual(["a"]);
  });

  it("exclut minuit, qui appartient au lendemain local", () => {
    const midnight = event({ id: "a", starts_at: "2026-08-27T22:00:00Z" }); // 00:00 le 28 a Paris
    expect(selectTonightEvents([midnight], NOW_AFTERNOON)).toEqual([]);
  });

  it("apres 18:00, ne garde que les evenements non commences", () => {
    const started = event({ id: "past", starts_at: "2026-08-27T17:00:00Z" }); // 19:00, deja passe
    const upcoming = event({ id: "next", starts_at: "2026-08-27T19:30:00Z" }); // 21:30
    expect(selectTonightEvents([started, upcoming], NOW_EVENING).map((e) => e.id)).toEqual(["next"]);
  });

  it("exclut un evenement annule", () => {
    const cancelled = event({ id: "a", starts_at: "2026-08-27T17:00:00Z", is_cancelled: true });
    expect(selectTonightEvents([cancelled], NOW_AFTERNOON)).toEqual([]);
  });

  it("exclut le lendemain", () => {
    const tomorrow = event({ id: "a", starts_at: "2026-08-28T17:00:00Z" });
    expect(selectTonightEvents([tomorrow], NOW_AFTERNOON)).toEqual([]);
  });

  it("trie par heure de debut croissante", () => {
    const late = event({ id: "late", starts_at: "2026-08-27T19:00:00Z" });
    const early = event({ id: "early", starts_at: "2026-08-27T17:00:00Z" });
    expect(selectTonightEvents([late, early], NOW_AFTERNOON).map((e) => e.id)).toEqual([
      "early",
      "late",
    ]);
  });

  it("plafonne a trois evenements", () => {
    const events = ["a", "b", "c", "d"].map((id, index) =>
      event({ id, starts_at: `2026-08-27T1${7 + index}:00:00Z` }),
    );
    expect(selectTonightEvents(events, NOW_AFTERNOON)).toHaveLength(3);
  });

  it("respecte la timezone propre de l'evenement", () => {
    // 20:00 a Paris, mais l'evenement declare Tokyo : il y est 03:00 le lendemain.
    const tokyo = event({ id: "a", starts_at: "2026-08-27T18:00:00Z", timezone: "Asia/Tokyo" });
    expect(selectTonightEvents([tokyo], NOW_EVENING)).toEqual([]);
  });

  it("retombe sur la timezone du lecteur si celle de l'evenement est invalide", () => {
    const broken = event({ id: "a", starts_at: "2026-08-27T17:00:00Z", timezone: "Not/AZone" });
    expect(() => selectTonightEvents([broken], NOW_AFTERNOON)).not.toThrow();
  });

  it("ignore une date de debut invalide", () => {
    const broken = event({ id: "a", starts_at: "pas-une-date" });
    expect(selectTonightEvents([broken], NOW_AFTERNOON)).toEqual([]);
  });

  it("accepte un evenement sans champs optionnels", () => {
    const bare = event({
      id: "a",
      starts_at: "2026-08-27T17:00:00Z",
      cover_image_url: null,
    });
    const [selected] = selectTonightEvents([bare], NOW_AFTERNOON);
    expect(selected?.cover_image_url).toBeNull();
    expect(selected?.interest_count).toBeUndefined();
  });
});

describe("selectUpcomingEveningEvents", () => {
  it("garde un evenement futur en soiree meme si ce n'est pas aujourd'hui", () => {
    const future = event({ id: "a", starts_at: "2026-09-04T17:00:00Z" }); // 19:00 Paris
    expect(selectUpcomingEveningEvents([future], NOW_AFTERNOON).map((e) => e.id)).toEqual(["a"]);
  });

  it("exclut un evenement de journee", () => {
    const afternoon = event({ id: "a", starts_at: "2026-09-04T12:00:00Z" });
    expect(selectUpcomingEveningEvents([afternoon], NOW_AFTERNOON)).toEqual([]);
  });
});

describe("selectFeedRightRailEveningEvents", () => {
  it("prefere ce soir aux prochains evenements", () => {
    const tonight = event({ id: "a", starts_at: "2026-08-27T17:00:00Z" });
    const future = event({ id: "b", starts_at: "2026-09-04T17:00:00Z" });
    const result = selectFeedRightRailEveningEvents([future, tonight], NOW_AFTERNOON);
    expect(result.mode).toBe("tonight");
    expect(result.events.map((e) => e.id)).toEqual(["a"]);
  });

  it("retombe sur les prochains evenements futurs", () => {
    const futureMorning = event({ id: "a", starts_at: "2026-09-04T10:00:00Z" });
    const result = selectFeedRightRailEveningEvents([futureMorning], NOW_AFTERNOON);
    expect(result.mode).toBe("upcoming");
    expect(result.events.map((e) => e.id)).toEqual(["a"]);
  });
});

describe("selectMemberTribes", () => {
  it("ne garde que les tribus dont l'utilisateur est membre", () => {
    const mine = tribe({ id: "1", slug: "a", name: "Alpha" });
    const other = tribe({ id: "2", slug: "b", name: "Beta", viewer_is_member: false });
    expect(selectMemberTribes([mine, other]).map((t) => t.slug)).toEqual(["a"]);
  });

  it("conserve une tribu privee dont l'utilisateur est membre", () => {
    const priv = tribe({ id: "1", slug: "a", name: "Alpha", visibility: "private_invite" });
    expect(selectMemberTribes([priv])).toHaveLength(1);
  });

  it("exclut une tribu archivee", () => {
    const archived = tribe({ id: "1", slug: "a", name: "Alpha", is_archived: true });
    expect(selectMemberTribes([archived])).toEqual([]);
  });

  it("preserve l'ordre de la source, sans notion d'activite", () => {
    const first = tribe({ id: "1", slug: "zeta", name: "Zeta" });
    const second = tribe({ id: "2", slug: "alpha", name: "Alpha" });
    expect(selectMemberTribes([first, second]).map((t) => t.slug)).toEqual(["zeta", "alpha"]);
  });

  it("plafonne a trois tribus", () => {
    const tribes = ["a", "b", "c", "d"].map((slug, i) =>
      tribe({ id: String(i), slug, name: slug.toUpperCase() }),
    );
    expect(selectMemberTribes(tribes)).toHaveLength(3);
  });

  it("expose le compte de membres reel sans le remplacer", () => {
    const t = tribe({ id: "1", slug: "a", name: "Alpha", active_member_count: 0 });
    expect(selectMemberTribes([t])[0]?.active_member_count).toBe(0);
  });
});

describe("tribeInitials", () => {
  it("derive deux initiales deterministes", () => {
    expect(tribeInitials("Rando Reims")).toBe("RR");
  });

  it("gere un nom en un seul mot", () => {
    expect(tribeInitials("Photo")).toBe("P");
  });

  it("gere un nom vide", () => {
    expect(tribeInitials("   ")).toBe("?");
  });

  it("est stable sur plusieurs appels", () => {
    expect(tribeInitials("Cafés du Coin")).toBe(tribeInitials("Cafés du Coin"));
  });
});
