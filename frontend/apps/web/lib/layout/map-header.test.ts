import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * MAP-HEADER-01 — en-tête commun sur la page Carte, à partir de 1024 px.
 *
 * Verrouille à la source les règles mesurées en Chromium (passation du ticket) :
 * affichage de l'en-tête au seul palier desktop de la carte, espace de 16 px,
 * protection du focus clavier limitée à la page Carte, géométrie du canevas et
 * des rails. jsdom ne calcule aucune mise en page : ces tests ne prouvent PAS le
 * rendu, la mesure navigateur en fait foi.
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");
const css = read("../../app/globals.css");
const stage = read("../../components/map/desktop/map-desktop-map-stage.tsx");
const screen = read("../../components/map/desktop/map-desktop-screen.tsx");
const medium = read("../../components/map/medium/map-medium-screen.tsx");

/** Blocs `@media <query> {…}` exacts, par comptage d'accolades. */
function mediaBlocks(query: string): string[] {
  const blocks: string[] = [];
  const opener = `@media ${query} {`;
  let from = 0;
  for (;;) {
    const start = css.indexOf(opener, from);
    if (start === -1) return blocks;
    let depth = 0;
    for (let i = css.indexOf("{", start); i < css.length; i += 1) {
      if (css[i] === "{") depth += 1;
      if (css[i] === "}") depth -= 1;
      if (depth === 0) {
        blocks.push(css.slice(start, i + 1));
        from = i + 1;
        break;
      }
    }
  }
}

/** Le bloc ≥ 1024 propre à la carte : celui qui écrase sa grille en une colonne. */
const mapDesktop = mediaBlocks("(min-width: 1024px)").find((b) =>
  b.includes(".map-mobile-shell .places-shell-grid.web-three-col"),
);
const mapMedium = mediaBlocks("(min-width: 640px) and (max-width: 1023.98px)").find((b) =>
  b.includes(".map-mobile-shell .web-three-col:not(:has(> [data-citizen-medium-rail]))"),
);
const mapMobile = mediaBlocks("(max-width: 639.98px)").find((b) =>
  b.includes(".map-mobile-shell .web-mobile-chrome-only"),
);

describe("MAP-HEADER-01 — CSS de la page Carte", () => {
  it("finds the three map breakpoint blocks", () => {
    expect(mapDesktop, "bloc carte ≥ 1024").toBeDefined();
    expect(mapMedium, "bloc carte medium").toBeDefined();
    expect(mapMobile, "bloc carte mobile").toBeDefined();
  });

  it("shows the common header on the map from 1024 px only", () => {
    expect(mapDesktop).toMatch(/\.map-mobile-shell \.citizen-top-nav\s*\{[^}]*display:\s*block/);
    expect(mapMedium).toMatch(/\.map-mobile-shell \.citizen-top-nav\s*\{[^}]*display:\s*none !important/);
    expect(mapMobile).toMatch(/\.map-mobile-shell \.citizen-top-nav\s*\{[^}]*display:\s*none !important/);
  });

  it("puts 16 px between the header and the map content, at the desktop tier only", () => {
    expect(mapDesktop).toMatch(/\.map-mobile-shell \.web-main-column\s*\{[^}]*padding-top:\s*1rem/);
  });

  it("protects keyboard focus from the fixed header on the map page only, from 1024 px", () => {
    expect(mapDesktop).toMatch(
      /html:has\(\.map-mobile-shell\)\s*\{[^}]*scroll-padding-top:\s*calc\(var\(--citizen-top-nav-height\) \+ 1rem\)/,
    );
    const outside = css.replace(mapDesktop ?? "", "");
    expect(outside).not.toMatch(/html:has\(\.map-mobile-shell\)/);
  });

  it("keeps the navigation rules unchanged: desktop sidebar still hidden on the map", () => {
    expect(mapDesktop).toMatch(/\.map-mobile-shell \.web-sidebar-aside\s*\{[^}]*display:\s*none !important/);
  });
});

describe("MAP-HEADER-01 — géométrie desktop de la carte", () => {
  it("sizes the canvas under the header and the 16 px gap, with a 320 px floor instead of 560 px", () => {
    expect(stage).toContain("h-[max(20rem,calc(100dvh-10rem-var(--citizen-top-nav-height)-1rem))]");
    expect(stage).not.toContain("min-h-[560px]");
    expect(stage).not.toContain("h-[calc(100dvh-10rem)]");
  });

  it("anchors both map rails under the header and bounds them by the bottom spacing", () => {
    const top = "top-[calc(var(--citizen-top-nav-height)+1rem)]";
    const maxH = "max-h-[calc(100dvh-var(--citizen-top-nav-height)-6rem)]";
    expect(screen.split(top).length - 1).toBe(2);
    expect(screen.split(maxH).length - 1).toBe(2);
    expect(screen).not.toContain("sticky top-4");
  });

  it("leaves the medium canvas untouched", () => {
    expect(medium).toContain("min-h-[520px] h-[calc(100dvh-9rem)]");
  });
});
