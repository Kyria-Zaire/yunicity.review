import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  MAP_VIEWPORT_DESKTOP_MEDIA,
  MAP_VIEWPORT_MEDIUM_MEDIA,
  MAP_VIEWPORT_MOBILE_MEDIA,
  resolveMapViewportTier,
} from "./map-breakpoints";

/**
 * C3-GLOBAL-REFONTE-P0-STABILIZE-01 — contrat de montage de la Carte.
 *
 * 0–639 = arbre Mobile · 640–1023 = arbre Medium · ≥1024 = arbre Desktop.
 * Une seule instance Google Maps active, jamais d'instance dans un arbre masqué.
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");

const screen = read("../../components/map/event-map-screen.tsx");
const tierHook = read("../../hooks/use-map-viewport-tier.ts");
const mapEvents = read("../../hooks/use-map-events.ts");
const culturalPlaces = read("../../hooks/use-map-cultural-places.ts");

const code = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ");

describe("resolveMapViewportTier — paliers exclusifs et totaux", () => {
  it.each([
    [320, "mobile"],
    [390, "mobile"],
    [639, "mobile"],
    [640, "medium"],
    [768, "medium"],
    [1023, "medium"],
    [1024, "desktop"],
    [1366, "desktop"],
    [1920, "desktop"],
  ])("%ipx → %s", (width, tier) => {
    expect(resolveMapViewportTier(width)).toBe(tier);
  });

  it("ne laisse aucune zone morte sur les largeurs fractionnaires", () => {
    // Le chrome mobile a déjà connu une zone morte entre 639 et 639,98 (T6.4-R2) :
    // aucune largeur, entière ou non, ne doit rester sans palier.
    for (const width of [639.01, 639.5, 639.99, 1023.01, 1023.5, 1023.99]) {
      expect(["mobile", "medium", "desktop"]).toContain(resolveMapViewportTier(width));
    }
    expect(resolveMapViewportTier(639.5)).toBe("mobile");
    expect(resolveMapViewportTier(1023.5)).toBe("medium");
  });

  it("aligne ses media queries sur les mêmes bornes, sans recouvrement", () => {
    expect(MAP_VIEWPORT_MOBILE_MEDIA).toBe("(max-width: 639.98px)");
    expect(MAP_VIEWPORT_MEDIUM_MEDIA).toBe("(min-width: 640px) and (max-width: 1023.98px)");
    expect(MAP_VIEWPORT_DESKTOP_MEDIA).toBe("(min-width: 1024px)");
  });
});

describe("useMapViewportTier — cycle de vie, jamais les données", () => {
  it("n'instancie aucune carte avant de connaître le palier réel", () => {
    // `getServerSnapshot` renvoie null : SSR et hydratation comprises, aucun arbre
    // ne reçoit `mapReady` vrai tant que le viewport client n'a pas été lu.
    expect(code(tierHook)).toMatch(/useSyncExternalStore\(subscribe, getTier, \(\) => null\)/);
  });

  it("ne déclenche aucun fetch — il ne connaît ni l'API ni la ville", () => {
    expect(code(tierHook)).not.toMatch(/useYunicityApi|fetch\(|api\./);
  });
});

describe("event-map-screen — une instance Google Maps par palier", () => {
  it("donne à chaque arbre son propre mapReady, exclusif des deux autres", () => {
    const compact = code(screen);
    expect(compact).toContain('mapReady={viewportTier === "mobile"}');
    expect(compact).toContain('mapStage={{ ...mapStageProps, mapReady: viewportTier === "medium" }}');
    expect(compact).toContain(
      'mapStage={{ ...mapStageProps, mapReady: viewportTier === "desktop" }}',
    );
  });

  it("ne partage plus mapReady entre les arbres", () => {
    // La régression d'origine : `mapReady` dans les props communes, vrai dès 640px
    // pour Medium ET Desktop.
    expect(code(screen)).not.toMatch(/mapStageProps = \{[^}]*mapReady:/);
  });

  it("n'utilise plus de booléen desktop pour un layout à trois paliers", () => {
    expect(code(screen)).not.toMatch(/useIsDesktop|isDesktop/);
  });
});

describe("resize — aucun refetch (T5 chargement unique préservé)", () => {
  it("charge les événements par ville, jamais par bbox ni par palier", () => {
    expect(code(mapEvents)).toMatch(/useCallback\(async \(\) => \{[\s\S]*?\}, \[api, city\]\)/);
    expect(code(mapEvents)).not.toMatch(/bbox|viewportTier|isDesktop/);
  });

  it("charge les lieux culturels sans dépendre du palier", () => {
    expect(code(culturalPlaces)).not.toMatch(/viewportTier|isDesktop|mapReady/);
  });

  it("n'alimente aucun fetch depuis le bbox du screen", () => {
    // `bbox` ne sert qu'au recentrage et au tri par distance.
    expect(code(screen)).not.toMatch(/api\.[a-zA-Z]+\([^)]*bbox/);
  });
});
