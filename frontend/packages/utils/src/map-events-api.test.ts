import { describe, expect, it } from "vitest";

import { buildMapEventsQuery } from "./map-events-api";
import { hasBboxChangedSignificantly } from "./map-labels";

describe("buildMapEventsQuery", () => {
  it("inclut bbox, city et limit", () => {
    const qs = buildMapEventsQuery({
      lat_min: 49.2,
      lon_min: 3.9,
      lat_max: 49.3,
      lon_max: 4.1,
      city: "Reims",
      limit: 100,
    });
    expect(qs).toContain("lat_min=49.2");
    expect(qs).toContain("city=Reims");
    expect(qs).toContain("limit=100");
  });
});

describe("hasBboxChangedSignificantly", () => {
  const base = { lat_min: 49.2, lon_min: 3.9, lat_max: 49.3, lon_max: 4.1 };

  it("retourne true sans bbox précédente", () => {
    expect(hasBboxChangedSignificantly(null, base)).toBe(true);
  });

  it("retourne false si changement sous la tolérance", () => {
    const next = { ...base, lat_min: 49.205 };
    expect(hasBboxChangedSignificantly(base, next)).toBe(false);
  });

  it("retourne true si changement au-delà de la tolérance", () => {
    const next = { ...base, lat_min: 49.22 };
    expect(hasBboxChangedSignificantly(base, next)).toBe(true);
  });
});
