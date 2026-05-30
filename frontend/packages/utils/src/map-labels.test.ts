import { describe, expect, it } from "vitest";

import type { TransitDeparture } from "@yunicity/types";

import {
  MAP_TRANSIT_CONTEXT_MAX_MINUTES,
  MAP_TRANSIT_NEARBY_MINUTES,
  buildTransitCarouselItems,
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

  it("filtre les départs >6h et dates lointaines sans minutes", () => {
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

  it("affiche HH:mm dans la fenêtre 6h même si le jour calendaire change", () => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(3, 43, 0, 0);
    const label = formatContextualTransitTime(
      departure({
        minutes: 274,
        scheduled_at: tomorrow.toISOString(),
      }),
    );
    expect(label).toMatch(/^\d{2}:\d{2}$/);
  });

  it("filtre les départs aberrants dans les groupes de routes", () => {
    const groups = groupTransitDeparturesByRoute([
      departure({ route_short_name: "A", minutes: 1000 }),
      departure({ route_short_name: "B", minutes: 8 }),
    ]);
    expect(groups.has("tram:A")).toBe(false);
    expect(groups.has("tram:B")).toBe(true);
  });

  it("aplatit les arrêts en items carrousel", () => {
    const items = buildTransitCarouselItems([
      {
        stop_id: "s1",
        name: "Opéra",
        distance_meters: 120,
        departures: [
          departure({ route_short_name: "A", minutes: 6 }),
          departure({ route_short_name: "B", minutes: 12 }),
        ],
      },
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]?.stopName).toBe("Opéra");
    expect(items[0]?.departureLabel).toBe("6 min");
  });
});
