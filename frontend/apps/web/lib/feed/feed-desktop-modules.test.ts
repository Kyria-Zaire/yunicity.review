import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * R1 — garde-fous des modules Desktop (météo lazy, Passport lazy, rail droit).
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");

const code = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ");

const activation = read("../../hooks/use-visible-activation.ts");
const weatherCard = read("../../components/feed/portal/feed-weather-card.tsx");
const leftRail = read("../../components/feed/desktop/feed-desktop-left-rail.tsx");
const rightRail = read("../../components/feed/desktop/feed-desktop-right-rail.tsx");
const passportHook = read("../../hooks/use-passport-feed-rail.ts");
const controller = read("../../components/feed/portal/feed-data-controller.tsx");
const globalsCSS = read("../../app/globals.css");
const weatherTypes = read("../../../../packages/types/src/weather.ts");

describe("R1 — visibility activation primitive", () => {
  it("relies on IntersectionObserver only, never on a JS breakpoint", () => {
    expect(activation).toContain("IntersectionObserver");
    expect(code(activation)).not.toMatch(/matchMedia|innerWidth|useIsDesktop/);
  });

  it("fails closed when IntersectionObserver is unavailable", () => {
    expect(activation).toMatch(/typeof IntersectionObserver === "undefined"[\s\S]*?return/);
  });

  it("activates once and disconnects the observer", () => {
    expect(activation).toContain("observer.disconnect()");
    expect(activation).toMatch(/if \(activated\) return/);
  });

  it("cleans up on unmount", () => {
    expect(activation).toMatch(/return \(\) => observer\.disconnect\(\)/);
  });
});

describe("R1 — lazy mounting contract", () => {
  it("keeps the weather hook out of the views — le contrôleur seul fetch", () => {
    expect(weatherCard).not.toContain("useCurrentWeather");
    expect(weatherCard).not.toContain("useVisibleActivation");
    expect(leftRail).not.toContain("useCurrentWeather");
    expect(controller).toContain("useCurrentWeather");
  });

  it("keeps the passport hook out of the views — le contrôleur seul fetch", () => {
    expect(rightRail).not.toContain("usePassportFeedRail");
    expect(rightRail).not.toContain("useVisibleActivation");
    expect(leftRail).not.toContain("usePassportFeedRail");
    expect(controller).toContain("usePassportFeedRail");
  });

  it("n'arme les modules Desktop qu'en Desktop, et sans refetch au resize", () => {
    // Armés quand le rail devient réellement visible, donc jamais sous 1024px
    // où il est `display: none` et n'intersecte pas.
    expect(controller).toContain("useVisibleActivation");
    expect(controller).toMatch(/activated: desktopRailsEnabled/);
    expect(controller).toContain("usePassportFeedRail(desktopRailsEnabled)");
    // …et jamais désarmés : l'activation du hook est définitive (cf. son test).
    expect(code(controller)).not.toMatch(/setDesktopRailsSeen|matchMedia|innerWidth/);
  });

  it("gates passport fetch behind the enabled flag passed from the controller", () => {
    expect(passportHook).toMatch(/export function usePassportFeedRail\(enabled = false\)/);
    expect(passportHook).toMatch(/if \(!enabled\)/);
    expect(passportHook).toContain("[api, enabled]");
  });

  it("uses no breakpoint JavaScript anywhere in the new modules", () => {
    for (const source of [weatherCard, rightRail, passportHook, leftRail]) {
      expect(code(source)).not.toMatch(/matchMedia|innerWidth|useIsDesktop/);
    }
  });

  it("reveals the weather slot inside the desktop left rail from 1024px", () => {
    expect(globalsCSS).toMatch(
      /\.feed-weather-slot,\s*\n\s*\.feed-passport-slot\s*\{\s*display:\s*none/,
    );
    const layer = globalsCSS.slice(globalsCSS.indexOf("/* ═══ C3-FEED-RESPONSIVE-SHELL-R4"));
    expect(layer).toMatch(/@media\s*\(\s*min-width:\s*1024px\s*\)/);
    expect(layer).toMatch(/\.feed-desktop-left-rail \.feed-weather-slot/);
  });

  it("introduces no new endpoint", () => {
    for (const source of [weatherCard, rightRail, passportHook]) {
      expect(code(source)).not.toMatch(/\/api\/v1/);
      expect(code(source)).not.toContain("fetch(");
    }
    expect(code(passportHook)).toContain("api.passportMe.getMyPassport()");
    expect(code(passportHook)).toContain("api.passportMe.getMyPassportChallenges()");
  });
});

describe("R1 — weather provenance is enforced", () => {
  it("declares the source discriminator in the shared contract", () => {
    expect(weatherTypes).toContain('"provider" | "development_stub"');
    expect(weatherTypes).toContain("source: WeatherSource");
  });

  it("refuses to render anything but a real provider response", () => {
    expect(weatherCard).toMatch(/weather\.source !== "provider"[\s\S]*?WeatherUnavailable/);
  });

  it("shows an honest unavailable state, never a fabricated degree", () => {
    expect(weatherCard).toContain("Météo indisponible");
    expect(code(weatherCard)).not.toMatch(/\d+\s*°C['"`]/);
    expect(code(weatherCard)).not.toMatch(/>\s*[^<]*\b(stub|fallback|mock)\b/i);
  });
});

describe("R1 — passport shows only contract data", () => {
  it("derives progress from an active challenge when available", () => {
    expect(rightRail).toContain("primaryChallenge.progress");
    expect(rightRail).toContain("primaryChallenge.target");
    expect(code(rightRail)).toMatch(/hasChallengeProgress/);
  });

  it("translates the tier through the canonical mapping, never a raw code", () => {
    expect(rightRail).toContain("PASSPORT_TIER_LABELS");
    expect(code(rightRail)).toMatch(/tierCode in PASSPORT_TIER_LABELS/);
  });

  it("links to the canonical passport route", () => {
    expect(rightRail).toContain('href="/passport"');
    expect(existsSync(`${here}../../app/passport/page.tsx`)).toBe(true);
  });

  it("isolates its failure from the other rail modules", () => {
    expect(rightRail).toMatch(/error \|\| !overview/);
  });
});

describe("R1 — right rail order and layout", () => {
  it("orders the rail: tonight, passport, privilege, footer", () => {
    const tonight = rightRail.indexOf("<TonightModule");
    const passport = rightRail.indexOf("<PassportModule");
    const privilege = rightRail.indexOf("<LocalPrivilegeModule");
    const footer = rightRail.indexOf("<RailFooter");
    expect(tonight).toBeGreaterThan(-1);
    expect(passport).toBeGreaterThan(tonight);
    expect(privilege).toBeGreaterThan(passport);
    expect(footer).toBeGreaterThan(privilege);
  });

  it("mounts weather and passport modules exactly once", () => {
    expect((leftRail.match(/<FeedWeatherCard/g) || []).length).toBe(1);
    expect((rightRail.match(/<PassportModule/g) || []).length).toBe(1);
  });

  it("uses the new 3-column desktop layout classes", () => {
    expect(globalsCSS).toContain(".feed-shell");
    expect(globalsCSS).toContain(".feed-desktop-left-rail");
    expect(globalsCSS).toContain(".feed-desktop-right-rail");
    expect(globalsCSS).not.toMatch(/\.feed-right-rail\s*\{/);
  });
});
