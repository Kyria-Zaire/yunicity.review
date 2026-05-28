import { describe, expect, it } from "vitest";

import type { TransitDeparture } from "@yunicity/types";

import {
  MAP_TRANSIT_CONTEXT_MAX_MINUTES,
  MAP_TRANSIT_NEARBY_MINUTES,
  formatContextualTransitTime,
  formatTransitDepartureMinutes,
  groupTransitDeparturesByRoute,
} from "./map-labels";

function departure(overrides: Partial<TransitDeparture> = {}): TransitDeparture {
  return {
    route_short_name: "A",
    route_type: "tram",
    headsign: "Centre",
    scheduled_at: new Date().toISOString(),
    minutes: 5,
    realtime: false,
    ...overrides,
  };
}

describe("map-labels transit formatting", () => {
  it("affiche les départs proches en minutes (<=45)", () => {
    const label = formatTransitDepartureMinutes([departure({ minutes: 5 })]);
    expect(label).toBe("5 min");
  });

  it("affiche une heure HH:mm pour un passage plus tard aujourd'hui", () => {
    const label = formatContextualTransitTime(
      departure({
        minutes: MAP_TRANSIT_NEARBY_MINUTES + 20,
        scheduled_at: new Date().toISOString(),
      }),
    );
    expect(label).toMatch(/^\d{2}:\d{2}$/);
  });

  it("filtre les départs demain et >6h", () => {
    expect(
      formatContextualTransitTime(
        departure({
          minutes: MAP_TRANSIT_CONTEXT_MAX_MINUTES + 1,
          scheduled_at: new Date().toISOString(),
        }),
      ),
    ).toBeNull();
    expect(
      formatContextualTransitTime(
        departure({
          minutes: undefined,
          scheduled_at: "2035-01-01T08:00:00.000Z",
        }),
      ),
    ).toBeNull();
  });

  it("filtre les départs aberrants dans les groupes de routes", () => {
    const groups = groupTransitDeparturesByRoute([
      departure({ route_short_name: "A", minutes: 1000 }),
      departure({ route_short_name: "B", minutes: 8 }),
    ]);
    expect(groups.has("tram:A")).toBe(false);
    expect(groups.has("tram:B")).toBe(true);
  });
});
