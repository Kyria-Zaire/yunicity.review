import { describe, expect, it } from "vitest";

import { mapMarkerKey, resolveActiveMapMarkerKeys } from "./map-marker-keys";

const EMPTY = {
  selection: null,
  focusedEventId: null,
  selectedCulturalSlug: null,
  selectedPartnerSlug: null,
};

describe("mapMarkerKey", () => {
  it("compose une clé kind:id", () => {
    expect(mapMarkerKey("place", "le-manege")).toBe("place:le-manege");
    expect(mapMarkerKey("event", "evt-1")).toBe("event:evt-1");
  });
});

describe("resolveActiveMapMarkerKeys", () => {
  it("aucune sélection => ensemble vide", () => {
    expect(resolveActiveMapMarkerKeys(EMPTY).size).toBe(0);
  });

  it("sélection event via id", () => {
    const keys = resolveActiveMapMarkerKeys({ ...EMPTY, selection: { kind: "event", id: "e1" } });
    expect(keys).toEqual(new Set(["event:e1"]));
  });

  it("sélection place / quartier / tribu via slug", () => {
    expect(resolveActiveMapMarkerKeys({ ...EMPTY, selection: { kind: "place", slug: "frac" } })).toEqual(
      new Set(["place:frac"]),
    );
    expect(
      resolveActiveMapMarkerKeys({ ...EMPTY, selection: { kind: "neighborhood", slug: "murigny" } }),
    ).toEqual(new Set(["neighborhood:murigny"]));
    expect(resolveActiveMapMarkerKeys({ ...EMPTY, selection: { kind: "tribe", slug: "vtt" } })).toEqual(
      new Set(["tribe:vtt"]),
    );
  });

  it("focus event + place culturelle + partenaire s'ajoutent", () => {
    const keys = resolveActiveMapMarkerKeys({
      selection: null,
      focusedEventId: "e2",
      selectedCulturalSlug: "opera",
      selectedPartnerSlug: "cafe-bleu",
    });
    expect(keys).toEqual(new Set(["event:e2", "place:opera", "partner:cafe-bleu"]));
  });

  it("cumule sélection et focus sans doublon", () => {
    const keys = resolveActiveMapMarkerKeys({
      selection: { kind: "event", id: "e3" },
      focusedEventId: "e3",
      selectedCulturalSlug: null,
      selectedPartnerSlug: null,
    });
    expect(keys).toEqual(new Set(["event:e3"]));
  });
});
