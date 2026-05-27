import { describe, expect, it } from "vitest";

import {
  EVENTS_RAIL_PLANNING_CTA,
  EVENTS_RAIL_PLANNING_CTA_LOGIN,
  EVENTS_RAIL_PLANNING_VISITOR,
} from "./events-agenda-labels";
import { buildCityPulseLine } from "./events-agenda";

describe("visitor planning copy", () => {
  it("exposes login CTAs without fake metrics", () => {
    expect(EVENTS_RAIL_PLANNING_VISITOR).toContain("Connectez-vous");
    expect(EVENTS_RAIL_PLANNING_CTA_LOGIN).toBe("Se connecter");
    expect(EVENTS_RAIL_PLANNING_CTA).toBe("Créer mon planning");
    expect(EVENTS_RAIL_PLANNING_VISITOR).not.toMatch(/trending|populaire/i);
  });
});

describe("buildCityPulseLine polish", () => {
  it("uses calm editorial tone", () => {
    expect(
      buildCityPulseLine({
        city: "Reims",
        eventsTonight: 0,
        eventsThisWeek: 0,
        weatherCalm: true,
      }),
    ).toBe("La ville est calme aujourd’hui.");
    expect(
      buildCityPulseLine({
        city: "Reims",
        eventsTonight: 0,
        eventsThisWeek: 3,
      }),
    ).toBe("Quelques sorties sont prévues cette semaine.");
    expect(
      buildCityPulseLine({
        city: "Reims",
        eventsTonight: 2,
        eventsThisWeek: 5,
      }),
    ).toBe("Les quartiers commencent à s’animer ce soir.");
  });
});
