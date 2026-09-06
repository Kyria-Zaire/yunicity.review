import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  FEED_VIEWPORT_DESKTOP_MIN_PX,
  FEED_VIEWPORT_MEDIUM_MAX_PX,
  FEED_VIEWPORT_MEDIUM_MIN_PX,
  FEED_VIEWPORT_MOBILE_MAX_PX,
} from "@/lib/layout/feed-breakpoints";

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");

/** Code seul : les commentaires citent ces API justement pour dire qu'on ne les emploie pas. */
const code = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ");

const controller = read("../../components/feed/portal/feed-data-controller.tsx");
const shell = read("../../components/feed/feed-responsive-shell.tsx");
const mainColumn = read("../../components/feed/feed-editorial-main-column.tsx");
const globalsCSS = read("../../app/globals.css");
const bottomNav = read("../../components/layout/web-mobile-strategic-bottom-nav.tsx");
const appShell = read("../../components/shell/citizen-authenticated-shell.tsx");
const rightRail = read("../../components/feed/desktop/feed-desktop-right-rail.tsx");
const weatherCard = read("../../components/feed/portal/feed-weather-card.tsx");

describe("C3-FEED-RESPONSIVE-SHELL-R4 — squelette responsive", () => {
  it("déclare les bornes canoniques en une seule source", () => {
    expect(FEED_VIEWPORT_MOBILE_MAX_PX).toBe(639);
    expect(FEED_VIEWPORT_MEDIUM_MIN_PX).toBe(640);
    expect(FEED_VIEWPORT_MEDIUM_MAX_PX).toBe(1023);
    expect(FEED_VIEWPORT_DESKTOP_MIN_PX).toBe(1024);
  });

  it("ne laisse aucun palier JavaScript décider du contenu", () => {
    for (const source of [controller, shell, mainColumn]) {
      expect(code(source)).not.toMatch(/matchMedia|innerWidth|useFeedViewportTier/);
      expect(code(source)).not.toMatch(/addEventListener\(\s*["'`]resize/);
    }
  });

  it("ne monte qu'une seule colonne centrale, donc un seul flux", () => {
    expect((shell.match(/<FeedEditorialMainColumn\b/g) ?? []).length).toBe(1);
    expect((controller.match(/<FeedResponsiveShell\b/g) ?? []).length).toBe(1);
    expect((mainColumn.match(/<FeedEditorialStreamRegion\b/g) ?? []).length).toBe(1);
    // Aucune vue par palier ne subsiste.
    expect(code(shell)).not.toMatch(/FeedMobileView|FeedMediumView|FeedDesktopView/);
  });

  it("garde tous les fetchs dans le contrôleur — le shell est présentationnel", () => {
    expect(controller).toContain("usePassportFeedRail");
    expect(controller).toContain("useCurrentWeather");
    expect(controller).toContain("useFeed(");
    expect(code(shell)).not.toMatch(/use[A-Z]\w*\(/);
    expect(rightRail).not.toContain("usePassportFeedRail");
    expect(weatherCard).not.toContain("useCurrentWeather");
  });

  it("n'arme les rails Desktop que lorsqu'ils sont réellement visibles", () => {
    // `display: none` sous 1024px → jamais d'intersection → aucune requête.
    expect(controller).toContain("useVisibleActivation");
    expect(controller).toMatch(/activated:\s*desktopRailsEnabled/);
    expect(globalsCSS).toMatch(
      /\.feed-desktop-left-rail,\s*\.feed-desktop-right-rail\s*\{\s*display:\s*none/,
    );
  });

  it("confie l'affichage des shells aux seules media queries", () => {
    expect(globalsCSS).toMatch(/\.feed-shell-desktop-header,/);
    expect(globalsCSS).toMatch(/@media\s*\(\s*min-width:\s*1024px\s*\)/);
    // La colonne unique est fluide à toutes les largeurs.
    expect(globalsCSS).toMatch(
      /\.feed-main-column\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    );
    expect(globalsCSS).toMatch(/\.feed-main-column\s*\{[^}]*min-width:\s*0/);
    expect(globalsCSS).toMatch(/\.feed-main-column\s*\{[^}]*max-width:\s*100%/);
  });

  it("ne clippe plus les descendants fixed du shell Feed", () => {
    // `overflow-x: clip` faisait de `.web-shell-page` un conteneur de
    // défilement, qui tronquait la navbar basse selon la hauteur du viewport.
    expect(globalsCSS).toMatch(
      /\.web-shell-page\.citizen-feed-shell\s*\{\s*overflow-x:\s*visible/,
    );
    expect(globalsCSS).not.toMatch(
      /\.feed-mobile-shell\.citizen-feed-shell\s*\{\s*overflow-x:\s*clip/,
    );
  });

  it("monte la navbar basse ancrée hors de tout conteneur du fil", () => {
    expect(appShell).toMatch(/<FeedMobileBottomNav \/>/);
    expect(bottomNav).toContain("web-mobile-docked-bottom-nav");
    expect(bottomNav).toContain("fixed inset-x-0 bottom-0");
    expect(bottomNav).toContain("min-[640px]:hidden");
    expect(globalsCSS).toMatch(
      /\.citizen-feed-shell \.web-mobile-strategic-bottom-nav[\s\S]*?position:\s*fixed/,
    );
  });

  it("conserve la grille 3 colonnes du composeur mobile", () => {
    expect(globalsCSS).toMatch(/grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  });

  it("garde les commandes du rail medium accessibles en hauteur réduite", () => {
    expect(globalsCSS).toMatch(/\[data-citizen-medium-rail-nav\][\s\S]*?overflow-y:\s*auto/);
    expect(globalsCSS).toMatch(/\[data-citizen-medium-rail-nav\][\s\S]*?min-height:\s*0/);
    expect(globalsCSS).toMatch(/\[data-citizen-medium-rail-footer\][\s\S]*?flex-shrink:\s*0/);
  });

  it("emploie une géométrie Desktop fluide dès 1024 et gèle le nominal à 1280+", () => {
    expect(globalsCSS).toMatch(
      /\.feed-desktop-left-rail\s*\{[^}]*flex:\s*0 0 clamp\(10rem,\s*15\.5vw,\s*13rem\)/,
    );
    expect(globalsCSS).toMatch(
      /\.feed-desktop-right-rail\s*\{[^}]*flex:\s*0 0 clamp\(13rem,\s*22vw,\s*17\.75rem\)/,
    );
    expect(globalsCSS).toMatch(/\.feed-desktop-center\s*\{[^}]*flex:\s*1 1 auto/);
    expect(globalsCSS).toMatch(/@media\s*\(\s*min-width:\s*1280px\s*\)[\s\S]*?flex:\s*0 0 208px/);
    expect(globalsCSS).toMatch(/@media\s*\(\s*min-width:\s*1280px\s*\)[\s\S]*?flex:\s*0 0 284px/);
    expect(globalsCSS).toMatch(/--feed-medium-region-gap:\s*20px/);
  });

  it("garde le shell transparent sous 1024px (display: contents) puis flex à partir de 1024", () => {
    expect(globalsCSS).toMatch(/\.feed-shell\s*\{[^}]*display:\s*contents/);
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*1024px\s*\)[\s\S]*?\.feed-shell\s*\{[^}]*display:\s*flex/,
    );
  });

  it("R4C — wordmark mobile sans ellipsis et Medium compact 640→719", () => {
    for (const block of globalsCSS.matchAll(
      /\[data-yunicity-mobile-header-control="logo"\][^{]+\{[^}]+\}/g,
    )) {
      expect(block[0], "le wordmark mobile ne doit pas être ellipsé").not.toMatch(
        /text-overflow:\s*ellipsis/,
      );
    }
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*640px\s*\)\s*and\s*\(\s*max-width:\s*719\.98px\s*\)[\s\S]*?--citizen-medium-rail-width:\s*clamp\(4\.75rem/,
    );
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*640px\s*\)\s*and\s*\(\s*max-width:\s*719\.98px\s*\)[\s\S]*?--feed-medium-content-gutter:\s*clamp\(0\.75rem/,
    );
  });

  it("R4C — composition Stories medium 640→1023 avec tokens gap/item", () => {
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*640px\s*\)\s*and\s*\(\s*max-width:\s*767\.98px\s*\)[\s\S]*?--feed-medium-story-gap:\s*16px/,
    );
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*768px\s*\)\s*and\s*\(\s*max-width:\s*1023\.98px\s*\)[\s\S]*?--feed-medium-story-gap:\s*20px/,
    );
    expect(globalsCSS).toMatch(
      /\[data-feed-medium-region="stories"\][\s\S]*?\[data-feed-desktop-moment\][\s\S]*?width:\s*var\(--feed-medium-story-item\)/,
    );
  });
});
