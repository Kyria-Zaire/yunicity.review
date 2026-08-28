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
  it("keeps the weather hook out of any always-mounted parent", () => {
    expect(weatherCard).toContain("useCurrentWeather");
    expect(weatherCard).toMatch(/activated \? <WeatherCardContent/);
    expect(leftRail).not.toContain("useCurrentWeather");
  });

  it("keeps the passport hook out of the always-mounted right rail shell", () => {
    expect(rightRail).toContain("usePassportFeedRail");
    expect(rightRail).toMatch(/activated \? <PassportLoadedContent|!activated \|\| loading/);
    expect(leftRail).not.toContain("usePassportFeedRail");
  });

  it("uses no breakpoint JavaScript anywhere in the new modules", () => {
    for (const source of [weatherCard, rightRail, passportHook, leftRail]) {
      expect(code(source)).not.toMatch(/matchMedia|innerWidth|useIsDesktop/);
    }
  });

  it("reveals the weather slot inside the desktop left rail from 1280px", () => {
    expect(globalsCSS).toMatch(
      /\.feed-weather-slot,\s*\n\s*\.feed-passport-slot\s*\{\s*display:\s*none/,
    );
    const layer = globalsCSS.slice(globalsCSS.indexOf("/* ═══ R1 — Feed Desktop Final"));
    expect(layer).toMatch(/@media\s*\(\s*min-width:\s*1280px\s*\)/);
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
    expect(globalsCSS).toContain(".feed-desktop-layout");
    expect(globalsCSS).toContain(".feed-desktop-left-rail");
    expect(globalsCSS).toContain(".feed-desktop-right-rail");
    expect(globalsCSS).not.toMatch(/\.feed-right-rail\s*\{/);
  });
});
