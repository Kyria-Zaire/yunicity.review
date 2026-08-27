import { describe, expect, it } from "vitest";

import {
  FEED_CONTEXT_MODULE_FAMILIES,
  FEED_CONTEXT_SLOT_INTERVALS,
  FEED_CONTEXT_SLOT_POSITIONS,
  type FeedContextModuleFamily,
  resolveFeedContextPlacements,
} from "@/lib/feed/feed-context-stream";

/**
 * C3-FEED-UNIFIED-CONTEXT-STREAM-R1 — cadence des modules contextuels.
 *
 * Ce module répond à UNE question : quelle famille occupe quelle position,
 * exprimée en nombre de contenus réels déjà rendus. Il ne sait rien des posts,
 * des vidéos, ni de l'assemblage — c'est `feed-stream` qui compte les contenus
 * et pose les entrées. La séparation évite que la cadence dépende du contenu.
 */

const TOUTES = [...FEED_CONTEXT_MODULE_FAMILIES];

describe("cadence des modules contextuels", () => {
  it("expose quatre familles génériques, dans l'ordre de priorité", () => {
    expect(TOUTES).toEqual(["must-see", "local-privilege", "tribes", "local-now"]);
  });

  it("dérive les positions cumulées des intervalles — une seule source", () => {
    expect([...FEED_CONTEXT_SLOT_INTERVALS]).toEqual([4, 6, 7, 7]);
    expect([...FEED_CONTEXT_SLOT_POSITIONS]).toEqual([4, 10, 17, 24]);
  });

  it("place les quatre familles disponibles sur les quatre positions", () => {
    expect(resolveFeedContextPlacements(TOUTES)).toEqual([
      { family: "must-see", afterRealContentCount: 4 },
      { family: "local-privilege", afterRealContentCount: 10 },
      { family: "tribes", afterRealContentCount: 17 },
      { family: "local-now", afterRealContentCount: 24 },
    ]);
  });

  it("must-see absent : local-privilege AVANCE sur le premier slot", () => {
    const placements = resolveFeedContextPlacements(["local-privilege", "tribes", "local-now"]);
    expect(placements[0]).toEqual({ family: "local-privilege", afterRealContentCount: 4 });
    expect(placements.map((p) => p.afterRealContentCount)).toEqual([4, 10, 17]);
  });

  it("plusieurs familles absentes : aucun trou artificiel", () => {
    expect(resolveFeedContextPlacements(["tribes", "local-now"])).toEqual([
      { family: "tribes", afterRealContentCount: 4 },
      { family: "local-now", afterRealContentCount: 10 },
    ]);
    expect(resolveFeedContextPlacements(["local-now"])).toEqual([
      { family: "local-now", afterRealContentCount: 4 },
    ]);
  });

  it("toutes les familles absentes : aucune insertion", () => {
    expect(resolveFeedContextPlacements([])).toEqual([]);
  });

  it("ignore l'ordre d'arrivée : la priorité fait foi", () => {
    const desordre: FeedContextModuleFamily[] = ["local-now", "tribes", "must-see"];
    expect(resolveFeedContextPlacements(desordre).map((p) => p.family)).toEqual([
      "must-see",
      "tribes",
      "local-now",
    ]);
  });

  it("dédoublonne une famille fournie deux fois", () => {
    expect(resolveFeedContextPlacements(["tribes", "tribes"]).map((p) => p.family)).toEqual([
      "tribes",
    ]);
  });

  it("produit des positions strictement croissantes — deux modules ne se touchent jamais", () => {
    const positions = resolveFeedContextPlacements(TOUTES).map((p) => p.afterRealContentCount);
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i]!).toBeGreaterThan(positions[i - 1]!);
    }
  });

  it("ne mute pas son entrée", () => {
    const entree: FeedContextModuleFamily[] = ["local-now", "must-see"];
    const copie = [...entree];
    resolveFeedContextPlacements(entree);
    expect(entree).toEqual(copie);
  });

  it("est PUR : aucun DOM, aucun window, aucun breakpoint", () => {
    const source = resolveFeedContextPlacements.toString();
    for (const interdit of ["window", "document", "matchMedia", "innerWidth", "React"]) {
      expect(source.includes(interdit), `contrat impur : ${interdit}`).toBe(false);
    }
  });
});
