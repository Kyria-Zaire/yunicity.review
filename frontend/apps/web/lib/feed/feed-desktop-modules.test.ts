import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * D1.2-R3A — garde-fous des modules Desktop lazy (meteo, Passport).
 *
 * LIMITE ASSUMEE : assertions TEXTUELLES. Elles ne prouvent NI l'absence de
 * requete sous 1536px, NI la geometrie navigateur. Elles empechent le retour
 * des defauts structurels : breakpoint JavaScript, hook dans un parent toujours
 * monte, donnee fabriquee presentee comme reelle. La preuve reste la campagne
 * reseau au navigateur.
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");

/**
 * Code sans commentaires ni espaces superflus.
 *
 * Les garde-fous portent sur ce que le code FAIT, pas sur le vocabulaire des
 * commentaires : une regex sur le source brut rougissait parce que la
 * documentation elle-meme nomme les pieges qu'elle interdit.
 */
const code = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s+/g, " ");

const activation = read("../../hooks/use-visible-activation.ts");
const weatherCard = read("../../components/feed/portal/feed-weather-card.tsx");
const passportCard = read("../../components/feed/portal/feed-passport-card.tsx");
const passportHook = read("../../hooks/use-passport-overview.ts");
const leftRail = read("../../components/feed/portal/feed-left-rail.tsx");
const rightRail = read("../../components/feed/portal/feed-desktop-right-rail.tsx");
const globalsCSS = read("../../app/globals.css");
const weatherTypes = read("../../../../packages/types/src/weather.ts");

describe("D1.2-R3A — visibility activation primitive", () => {
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

describe("D1.2-R3A — lazy mounting contract", () => {
  it("keeps the weather hook out of any always-mounted parent", () => {
    // Le hook vit dans l'enfant, rendu seulement si `activated`.
    expect(weatherCard).toContain("useCurrentWeather");
    expect(weatherCard).toMatch(/activated \? <WeatherCardContent/);
    expect(leftRail).not.toContain("useCurrentWeather");
  });

  it("keeps the passport hook out of any always-mounted parent", () => {
    expect(passportCard).toContain("usePassportOverview");
    expect(passportCard).toMatch(/activated \? <PassportCardContent/);
    expect(rightRail).not.toContain("usePassportOverview");
  });

  it("uses no breakpoint JavaScript anywhere in the new modules", () => {
    for (const source of [weatherCard, passportCard, passportHook, leftRail, rightRail]) {
      expect(code(source)).not.toMatch(/matchMedia|innerWidth|useIsDesktop/);
    }
  });

  it("hides both slots by default and reveals them only at 1536px", () => {
    expect(globalsCSS).toMatch(
      /\.feed-weather-slot,\s*\n\s*\.feed-passport-slot\s*\{\s*display:\s*none/,
    );
    const layer = globalsCSS.slice(globalsCSS.indexOf("/* ——— D1.2 DESKTOP LARGE"));
    expect(layer).toMatch(/@media\s*\(\s*min-width:\s*1536px\s*\)/);
    expect(layer).toMatch(/\.citizen-feed-shell \.feed-weather-slot/);
    expect(layer).toMatch(/\.citizen-feed-shell \.feed-passport-slot/);
  });

  it("introduces no new endpoint", () => {
    for (const source of [weatherCard, passportCard, passportHook]) {
      expect(code(source)).not.toMatch(/\/api\/v1/);
      expect(code(source)).not.toContain("fetch(");
    }
    // Route canonique existante, via le client partage (formatage indifferent).
    expect(code(passportHook)).toContain("api.passportMe .getMyPassport()");
  });

  it("spends exactly one request per module", () => {
    // Le hook Passport n'appelle QUE l'overview : ni badges, ni challenges.
    expect(passportHook).not.toContain("getMyPassportBadges");
    expect(passportHook).not.toContain("getMyPassportChallenges");
    expect(passportCard).not.toContain("usePassportMe");
  });
});

describe("D1.2-R3A — weather provenance is enforced", () => {
  it("declares the source discriminator in the shared contract", () => {
    expect(weatherTypes).toContain('"provider" | "development_stub"');
    expect(weatherTypes).toContain("source: WeatherSource");
  });

  it("refuses to render anything but a real provider response", () => {
    expect(weatherCard).toMatch(/weather\.source !== "provider"[\s\S]*?WeatherUnavailable/);
  });

  it("shows an honest unavailable state, never a fabricated degree", () => {
    expect(weatherCard).toContain("Météo indisponible");
    // Aucune temperature codee en dur dans le composant.
    expect(code(weatherCard)).not.toMatch(/\d+\s*°C['"`]/);
    // Le vocabulaire technique du stub n'est jamais rendu a l'utilisateur.
    expect(code(weatherCard)).not.toMatch(/>\s*[^<]*\b(stub|fallback|mock)\b/i);
  });

  it("reads optional fields only when actually provided", () => {
    expect(weatherCard).toContain('typeof weather.temperature_min === "number"');
    expect(weatherCard).toContain('typeof weather.temperature_max === "number"');
    expect(weatherCard).toContain('typeof weather.wind_speed === "number"');
  });
});

describe("D1.2-R3A — passport shows only contract data", () => {
  it("invents no overall progression", () => {
    // `PassportOverviewResponse.summary` ne porte aucune progression globale :
    // aucune barre ne doit etre fabriquee a partir d'un denominateur arbitraire.
    expect(code(passportCard)).not.toMatch(/aria-valuenow|progress-bar|role="progressbar"/i);
  });

  it("renders real summary counters", () => {
    expect(passportCard).toContain("summary.earned_badges");
    expect(passportCard).toContain("summary.active_challenges");
    expect(passportCard).toContain("summary.claimable_rewards");
  });

  it("translates the tier through the canonical mapping, never a raw code", () => {
    // R3C — `passport_tier` est un code technique (`basic`, `silver`…).
    // On reutilise `PASSPORT_TIER_LABELS`, deja consomme par la page Passport ;
    // aucun second mapping, aucune traduction improvisee.
    expect(passportCard).toContain("PASSPORT_TIER_LABELS");
    expect(code(passportCard)).toMatch(/tierCode in PASSPORT_TIER_LABELS/);
    // Le code brut n'est jamais rendu tel quel.
    expect(code(passportCard)).not.toMatch(/\{summary\.passport_tier\}/);
    expect(code(passportCard)).toMatch(/\{tierLabel\}/);
  });

  it("hides the tier row when the code has no canonical label", () => {
    expect(code(passportCard)).toMatch(/tierLabel \?/);
    expect(code(passportCard)).toMatch(/:\s*null/);
  });

  it("exposes no raw passport enum value in the French UI", () => {
    const rendered = code(passportCard);
    for (const raw of ["basic", "silver", "gold", "neo_arrivant", "press_creator", "business"]) {
      // Aucune valeur d'enum ecrite en dur comme texte affichable.
      expect(rendered).not.toMatch(new RegExp(`>\\s*${raw}\\s*<`, "i"));
      expect(rendered).not.toContain(`"${raw}"`);
    }
    expect(rendered).not.toContain("Explorateur");
  });

  it("links to the canonical passport route", () => {
    expect(passportCard).toContain('href="/passport"');
    expect(existsSync(`${here}../../app/passport/page.tsx`)).toBe(true);
  });

  it("isolates its failure from the other rail modules", () => {
    expect(passportCard).toMatch(/if \(error \|\| !overview\) return null/);
  });
});

describe("D1.2-R3A — right rail order and D1.2-R2 preservation", () => {
  it("orders the rail: tonight, passport, tribes, footer", () => {
    const tonight = rightRail.indexOf("<FeedTonightEvents");
    const passport = rightRail.indexOf("<FeedPassportCard");
    const tribes = rightRail.indexOf("<FeedMemberTribes");
    const footer = rightRail.indexOf("<footer");
    expect(tonight).toBeGreaterThan(-1);
    expect(passport).toBeGreaterThan(tonight);
    expect(tribes).toBeGreaterThan(passport);
    expect(footer).toBeGreaterThan(tribes);
  });

  it("mounts each new module exactly once", () => {
    expect((rightRail.match(/<FeedPassportCard/g) || []).length).toBe(1);
    expect((leftRail.match(/<FeedWeatherCard/g) || []).length).toBe(1);
  });

  it("adds no fourth column and keeps the R2 widths", () => {
    const layer = globalsCSS.slice(globalsCSS.indexOf("/* ——— D1.2 DESKTOP LARGE"));
    expect(layer).toMatch(/flex:\s*0\s+0\s+var\(--web-context-rail-width-md\)/);
    expect(globalsCSS).toContain("--web-context-rail-width-md: 20rem");
  });
});
