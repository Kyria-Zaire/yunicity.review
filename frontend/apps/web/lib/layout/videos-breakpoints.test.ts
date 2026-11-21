import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  VIDEOS_VIEWPORT_DESKTOP_MIN_PX,
  VIDEOS_VIEWPORT_DESKTOP_MEDIA,
  VIDEOS_VIEWPORT_MEDIUM_MAX_PX,
  VIDEOS_VIEWPORT_MEDIUM_MEDIA,
  VIDEOS_VIEWPORT_MEDIUM_MIN_PX,
  VIDEOS_VIEWPORT_MOBILE_MAX_PX,
  VIDEOS_VIEWPORT_MOBILE_MEDIA,
} from "./videos-breakpoints";

const here = fileURLToPath(new URL(".", import.meta.url));
const globalsCSS = readFileSync(`${here}../../app/globals.css`, "utf8");

describe("videos-breakpoints", () => {
  it("déclare les trois paliers alignés Feed R4", () => {
    expect(VIDEOS_VIEWPORT_MOBILE_MAX_PX).toBe(639);
    expect(VIDEOS_VIEWPORT_MEDIUM_MIN_PX).toBe(640);
    expect(VIDEOS_VIEWPORT_MEDIUM_MAX_PX).toBe(1023);
    expect(VIDEOS_VIEWPORT_DESKTOP_MIN_PX).toBe(1024);
    expect(VIDEOS_VIEWPORT_MOBILE_MEDIA).toBe("(max-width: 639px)");
    expect(VIDEOS_VIEWPORT_MEDIUM_MEDIA).toBe(
      "(min-width: 640px) and (max-width: 1023.98px)",
    );
    expect(VIDEOS_VIEWPORT_DESKTOP_MEDIA).toBe("(min-width: 1024px)");
  });

  it("bascule mobile/medium/desktop via media queries CSS (pas de matchMedia JS)", () => {
    expect(globalsCSS).toMatch(/\.videos-discovery-mobile-only\s*\{\s*display:\s*block/);
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*640px\s*\)[\s\S]*?\.videos-discovery-mobile-only[\s\S]*?display:\s*none/,
    );
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*640px\s*\)\s*and\s*\(\s*max-width:\s*1023\.98px\s*\)[\s\S]*?\.videos-medium-header/,
    );
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*1024px\s*\)[\s\S]*?\.videos-shell\s*\{[\s\S]*?display:\s*flex/,
    );
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*max-width:\s*1023\.98px\s*\)[\s\S]*?\.web-mobile-videos-only/,
    );
  });

  it("déclare le shell trois colonnes Vidéos Desktop", () => {
    expect(globalsCSS).toMatch(/\.videos-shell\s*\{[\s\S]*?display:\s*contents/);
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*1024px\s*\)[\s\S]*?\.videos-shell\s*\{[\s\S]*?display:\s*flex/,
    );
  });

  it("affiche le stream cartes dès 640px et masque la grille mobile", () => {
    expect(globalsCSS).toMatch(/\.videos-medium-desktop-stream\s*\{\s*display:\s*none/);
    expect(globalsCSS).toMatch(
      /@media\s*\(\s*min-width:\s*640px\s*\)[\s\S]*?\.videos-medium-desktop-stream\s*\{\s*display:\s*block/,
    );
  });
});
