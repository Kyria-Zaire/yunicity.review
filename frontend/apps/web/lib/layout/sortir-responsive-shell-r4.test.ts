import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  SORTIR_VIEWPORT_DESKTOP_MIN_PX,
  SORTIR_VIEWPORT_MEDIUM_MAX_PX,
  SORTIR_VIEWPORT_MEDIUM_MIN_PX,
  SORTIR_VIEWPORT_MOBILE_MAX_PX,
} from "@/lib/layout/sortir-breakpoints";

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");

const code = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ");

const screen = read("../../components/events/sortir/sortir-screen.tsx");
const mediumShell = read("../../components/events/sortir/medium/sortir-medium-shell.tsx");
const mediumHeader = read("../../components/events/sortir/medium/sortir-medium-header.tsx");
const shell = read("../../components/events/sortir/sortir-responsive-shell.tsx");
const globalsCSS = read("../../app/globals.css");

describe("DESKTOP-SORTIR-01 — squelette responsive", () => {
  it("déclare les bornes canoniques en une seule source", () => {
    expect(SORTIR_VIEWPORT_MOBILE_MAX_PX).toBe(639);
    expect(SORTIR_VIEWPORT_MEDIUM_MIN_PX).toBe(640);
    expect(SORTIR_VIEWPORT_MEDIUM_MAX_PX).toBe(1023);
    expect(SORTIR_VIEWPORT_DESKTOP_MIN_PX).toBe(1024);
  });

  it("ne laisse pas le shell décider du layout via matchMedia", () => {
    for (const source of [screen, shell]) {
      expect(code(source)).not.toMatch(/matchMedia|innerWidth/);
    }
  });

  it("monte un seul shell desktop 3 colonnes", () => {
    expect((screen.match(/<SortirResponsiveShell\b/g) ?? []).length).toBe(1);
    expect(shell).toContain("SortirDesktopLeftRail");
    expect(shell).toContain("SortirDesktopRightRail");
    expect(shell).toContain("SortirDesktopEditorialHeader");
    expect(shell).not.toContain("SortirHeroBanner");
  });

  it("monte le shell medium avec header citoyen + refonte éditoriale", () => {
    expect(screen).toContain("sortir-tablet-desktop-only");
    expect(screen).toContain("<SortirMediumShell");
    expect(mediumShell).toContain("<SortirMediumHeader");
    expect(mediumHeader).toContain("data-sortir-medium-header");
    expect(mediumShell).not.toContain("<SortirHeroBanner");
    expect(screen).toContain("sortir-desktop-shell-only");
  });

  it("confie l'affichage 3 colonnes aux media queries CSS", () => {
    expect(globalsCSS).toMatch(/\.sortir-shell\s*\{[^}]*display:\s*contents/);
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*1024px\s*\)[\s\S]*?\.sortir-shell\s*\{[^}]*display:\s*flex/,
    );
    expect(globalsCSS).toMatch(/\.sortir-desktop-left-rail[\s\S]*?display:\s*none/);
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*1024px\s*\)[\s\S]*?\.sortir-desktop-left-rail[\s\S]*?display:\s*block/,
    );
  });
});
