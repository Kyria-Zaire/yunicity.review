import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  VIDEOS_VIEWPORT_DESKTOP_MIN_PX,
  VIDEOS_VIEWPORT_MEDIUM_MAX_PX,
  VIDEOS_VIEWPORT_MEDIUM_MIN_PX,
  VIDEOS_VIEWPORT_MOBILE_MAX_PX,
} from "@/lib/layout/videos-breakpoints";

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");

const code = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ");

const discovery = read("../../components/videos/videos-discovery-screen.tsx");
const shell = read("../../components/videos/videos-responsive-shell.tsx");
const streamRegion = read("../../components/videos/videos-editorial-stream-region.tsx");
const globalsCSS = read("../../app/globals.css");

describe("C3-VIDEOS-RESPONSIVE-SHELL — squelette responsive", () => {
  it("déclare les bornes canoniques en une seule source", () => {
    expect(VIDEOS_VIEWPORT_MOBILE_MAX_PX).toBe(639);
    expect(VIDEOS_VIEWPORT_MEDIUM_MIN_PX).toBe(640);
    expect(VIDEOS_VIEWPORT_MEDIUM_MAX_PX).toBe(1023);
    expect(VIDEOS_VIEWPORT_DESKTOP_MIN_PX).toBe(1024);
  });

  it("ne laisse aucun palier JavaScript décider du layout", () => {
    for (const source of [discovery, shell, streamRegion]) {
      expect(code(source)).not.toMatch(/matchMedia|innerWidth/);
      expect(code(source)).not.toMatch(/addEventListener\(\s*["'`]resize/);
    }
  });

  it("ne monte qu'un seul shell et qu'une seule région stream", () => {
    expect((discovery.match(/<VideosResponsiveShell\b/g) ?? []).length).toBe(1);
    expect((shell.match(/<VideosEditorialStreamRegion\b/g) ?? []).length).toBe(1);
    expect(discovery).not.toContain("web-desktop-videos-only");
    expect(code(shell)).not.toMatch(/VideosMobileView\b|VideosMediumView\b|VideosDesktopView\b/);
  });

  it("inclut le header medium et le stream desktop partagé", () => {
    expect(shell).toContain("VideosMediumHeader");
    expect(streamRegion).toContain("VideosDesktopFeedStream");
    expect(streamRegion).toContain("VideosMobileGridCard");
  });

  it("confie l'affichage aux seules media queries", () => {
    expect(globalsCSS).toMatch(/\.videos-medium-header\s*\{\s*display:\s*none/);
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*640px\s*\)\s*and\s*\(\s*max-width:\s*1023\.98px\s*\)[\s\S]*?\.videos-medium-header\s*\{[\s\S]*?display:\s*flex/,
    );
    expect(globalsCSS).toMatch(/\.videos-shell\s*\{[^}]*display:\s*contents/);
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*1024px\s*\)[\s\S]*?\.videos-shell\s*\{[^}]*display:\s*flex/,
    );
  });

  it("masque le filtre desktop redondant entre 640 et 1023", () => {
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*max-width:\s*1023\.98px\s*\)[\s\S]*?\[data-videos-desktop-filter\][\s\S]*?display:\s*none/,
    );
  });
});
