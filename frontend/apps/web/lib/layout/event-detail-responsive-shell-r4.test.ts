import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  SORTIR_VIEWPORT_DESKTOP_MIN_PX,
  SORTIR_VIEWPORT_MEDIUM_MAX_PX,
  SORTIR_VIEWPORT_MEDIUM_MIN_PX,
} from "@/lib/layout/sortir-breakpoints";

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");

const screen = read("../../components/events/event-detail-screen.tsx");
const mediumView = read("../../components/events/medium/event-medium-detail-view.tsx");
const globalsCSS = read("../../app/globals.css");

describe("DESKTOP-EVENT-DETAIL-01 — vue medium 640–1023", () => {
  it("monte les trois vues sans matchMedia", () => {
    expect(screen).toContain("<EventMobileDetailView");
    expect(screen).toContain("<EventMediumDetailView");
    expect(screen).toContain("<EventDesktopDetailView");
    expect(screen).not.toMatch(/matchMedia|innerWidth/);
  });

  it("compose la vue mobile maquette (hero, Participer, sections, sans barre fixe)", () => {
    const mobileView = read("../../components/events/mobile/event-mobile-detail-view.tsx");
    const shell = read("../../components/events/event-detail-app-shell.tsx");
    expect(mobileView).toContain("data-event-mobile-detail");
    expect(mobileView).toContain("<EventMobileDetailHero");
    expect(mobileView).toContain("categoryLabel");
    expect(mobileView).toContain("<EventMobileDetailInfoCard");
    expect(mobileView).toContain("<EventMobileLieuSection");
    expect(mobileView).not.toContain("EventMobileDetailActionBar");
    expect(shell).toContain("WebMobileStrategicBottomNav");
  });

  it("compose header, hero, carte Participer, agenda barre, similaires", () => {
    expect(mediumView).toContain("<EventMediumHeader");
    expect(mediumView).toContain("<EventDesktopHero");
    expect(mediumView).toContain("<EventMediumParticipateCard");
    expect(mediumView).toContain("<EventMediumAgendaBar");
    expect(mediumView).toContain("<EventMediumSimilarRail");
    expect(mediumView).toContain('placeLayout="stacked"');
  });

  it("confie l'affichage medium/desktop aux media queries CSS", () => {
    expect(globalsCSS).toMatch(/\.web-medium-event-detail-only\s*\{[^}]*display:\s*none/);
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*640px\s*\)\s*and\s*\(\s*max-width:\s*1023\.98px\s*\)[\s\S]*?\.web-medium-event-detail-only\s*\{[^}]*display:\s*block/,
    );
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*1024px\s*\)[\s\S]*?\.web-desktop-event-detail-only\s*\{[^}]*display:\s*block/,
    );
    expect(SORTIR_VIEWPORT_MEDIUM_MIN_PX).toBe(640);
    expect(SORTIR_VIEWPORT_MEDIUM_MAX_PX).toBe(1023);
    expect(SORTIR_VIEWPORT_DESKTOP_MIN_PX).toBe(1024);
  });
});
