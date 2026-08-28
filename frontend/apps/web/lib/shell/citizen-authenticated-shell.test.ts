import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = fileURLToPath(new URL(".", import.meta.url));
const portalScreen = existsSync(`${here}../../components/feed/portal/feed-portal-screen.tsx`)
  ? readFileSync(`${here}../../components/feed/portal/feed-portal-screen.tsx`, "utf-8")
  : "";
const citizenShell = readFileSync(`${here}../../components/shell/citizen-authenticated-shell.tsx`, "utf-8");
const feedAppShell = `${here}../../components/feed/portal/feed-app-shell.tsx`;

describe("D0.1 — CitizenAuthenticatedShell migration", () => {
  it("migrates Feed portal from FeedAppShell to CitizenAuthenticatedShell", () => {
    expect(portalScreen).toContain("CitizenAuthenticatedShell");
    expect(portalScreen).not.toContain("FeedAppShell");
  });

  it("removes the legacy FeedAppShell after migration", () => {
    expect(existsSync(feedAppShell)).toBe(false);
  });

  it("preserves single <main> in CitizenAuthenticatedShell", () => {
    // Count <main> tags (should be exactly 1)
    const mainCount = (citizenShell.match(/<main/g) || []).length;
    expect(mainCount).toBe(1);
  });

  it("keeps CitizenTopNav, WebSidebar, and WebMobileStrategicBottomNav mounts", () => {
    expect(citizenShell).toContain("CitizenTopNav");
    expect(citizenShell).toContain("WebSidebar");
    expect(citizenShell).toContain("WebMobileStrategicBottomNav");
  });

  it("does not introduce breakpoint JavaScript", () => {
    expect(citizenShell).not.toMatch(/window\.innerWidth|matchMedia|useMediaQuery/);
  });

  it("preserves responsive class scoping (.citizen-medium-shell)", () => {
    expect(citizenShell).toContain("citizen-medium-shell");
  });

  it("allows optional variant prop for route-specific scoping", () => {
    // Shell should accept variant parameter for D0.2+ routes
    expect(citizenShell).toContain("variant");
  });
});

describe("R1 — Feed desktop final architecture", () => {
  const desktopScreen = readFileSync(
    `${here}../../components/feed/desktop/feed-desktop-screen.tsx`,
    "utf-8",
  );
  const leftRail = readFileSync(
    `${here}../../components/feed/desktop/feed-desktop-left-rail.tsx`,
    "utf-8",
  );
  const rightRail = readFileSync(
    `${here}../../components/feed/desktop/feed-desktop-right-rail.tsx`,
    "utf-8",
  );

  it("passes citizen-feed-shell variant to CitizenAuthenticatedShell for explicit scoping", () => {
    expect(portalScreen).toContain('variant="citizen-feed-shell"');
  });

  it("toggles FeedDesktopScreen against the medium/mobile path via CSS classes", () => {
    expect(portalScreen).toContain('className="feed-desktop-view"');
    expect(portalScreen).toContain("<FeedDesktopScreen");
    expect(portalScreen).toContain('className="feed-medium-mobile-view"');
    expect(portalScreen).not.toContain("web-feed-desktop-contents");
    expect(portalScreen).not.toContain("<FeedLeftRail");
  });

  it("delegates the desktop greeting to FeedDesktopScreen", () => {
    expect(desktopScreen).toContain("feed-desktop-greeting");
    expect(desktopScreen).toContain("Bonjour {userFirstName}");
    expect(portalScreen).toContain("userFirstName={userFirstName}");
    expect(portalScreen).toContain("city={city}");
  });

  it("does not hardcode fallback city Reims in greeting", () => {
    expect(portalScreen).toContain('portal.city || user?.city || "Reims"');
    expect(desktopScreen).not.toMatch(/Bienvenue sur le fil de "Reims"/);
  });

  it("contains no historic async context rail", () => {
    expect(portalScreen).not.toContain("web-context-rail");
    expect(portalScreen).not.toContain("WebContextRail");
    expect(portalScreen).not.toContain("FeedContextRail");
  });

  it("keeps one FeedStreamList in the medium/mobile path only", () => {
    const streamListCount = (portalScreen.match(/<FeedStreamList/g) || []).length;
    expect(streamListCount).toBe(1);
  });

  it("does not fetch new data or introduce new endpoints in the portal screen", () => {
    expect(portalScreen).not.toContain("useDesktopGreeting");
    expect(portalScreen).not.toContain("fetch(");
    expect(portalScreen).not.toMatch(/\/api\/v1/);
  });

  it("mounts the desktop rails inside FeedDesktopScreen", () => {
    expect(desktopScreen).toContain("<FeedDesktopLeftRail");
    expect(desktopScreen).toContain("<FeedDesktopRightRail");
    expect(desktopScreen).toContain('className="feed-desktop-layout"');
    expect(leftRail).toContain('aria-label="Navigation du fil"');
    expect(rightRail).toContain('aria-label="Contexte local"');
  });

  it("derives right-rail data from the already-mounted portal context", () => {
    expect(portalScreen).toContain("selectMemberTribes(portal.tribes)");
    expect(portalScreen).toContain("portalEvents={portal.events}");
  });
});

describe("R1 — CSS desktop toggle guards (textual)", () => {
  const globalsCSS = readFileSync(`${here}../../app/globals.css`, "utf-8");

  const desktopLayer = (() => {
    const start = globalsCSS.indexOf("/* ═══ R1 — Feed Desktop Final");
    expect(start).toBeGreaterThan(-1);
    const open = globalsCSS.indexOf("{", globalsCSS.indexOf("@media", start));
    let depth = 0;
    for (let i = open; i < globalsCSS.length; i += 1) {
      if (globalsCSS[i] === "{") depth += 1;
      else if (globalsCSS[i] === "}") {
        depth -= 1;
        if (depth === 0) return globalsCSS.slice(start, i + 1);
      }
    }
    throw new Error("R1 desktop layer: unbalanced braces");
  })();

  it("scopes the desktop toggle to min-width 1280px", () => {
    expect(desktopLayer).toMatch(/@media\s*\(\s*min-width:\s*1280px\s*\)/);
    expect(globalsCSS).toMatch(/\.feed-desktop-view\s*\{\s*display:\s*none/);
    expect(globalsCSS).toMatch(/\.feed-medium-mobile-view\s*\{\s*display:\s*contents/);
  });

  it("declares the new 3-column layout without the legacy right rail", () => {
    expect(globalsCSS).toContain(".feed-desktop-layout");
    expect(globalsCSS).toContain(".feed-desktop-left-rail");
    expect(globalsCSS).toContain(".feed-desktop-right-rail");
    expect(globalsCSS).not.toMatch(/\.feed-right-rail\s*\{/);
    expect(globalsCSS).not.toContain("web-feed-desktop-contents");
  });
});

/**
 * D1.1-R7 — CitizenTopNav decouplee du corps Feed.
 */
describe("D1.1-R7 — top nav decoupling guards (textual, not overlap proof)", () => {
  const globalsCSS = readFileSync(`${here}../../app/globals.css`, "utf-8");
  const topNav = readFileSync(`${here}../../components/layout/citizen-top-nav.tsx`, "utf-8");

  const desktopLayer = (() => {
    const start = globalsCSS.indexOf("/* ——— Feed shell : top nav desktop");
    const open = globalsCSS.indexOf("{", globalsCSS.indexOf("@media", start));
    let depth = 0;
    for (let i = open; i < globalsCSS.length; i += 1) {
      if (globalsCSS[i] === "{") depth += 1;
      else if (globalsCSS[i] === "}") {
        depth -= 1;
        if (depth === 0) return globalsCSS.slice(start, i + 1);
      }
    }
    throw new Error("top nav desktop layer: unbalanced braces");
  })();

  const ruleFor = (selector: string): string => {
    const at = desktopLayer.indexOf(selector);
    expect(at, `selector not found: ${selector}`).toBeGreaterThan(-1);
    const open = desktopLayer.indexOf("{", at);
    return desktopLayer.slice(open, desktopLayer.indexOf("}", open));
  };

  it("renders the top nav outside the Feed body container", () => {
    const navAt = citizenShell.indexOf("<CitizenTopNav />");
    const gridAt = citizenShell.indexOf("web-three-col");
    const mainAt = citizenShell.indexOf("<main");
    expect(navAt).toBeGreaterThan(-1);
    expect(navAt, "top nav must precede .web-three-col").toBeLessThan(gridAt);
    expect(navAt, "top nav must not live inside <main>").toBeLessThan(mainAt);
  });

  it("keeps exactly one CitizenTopNav mount in the shared shell", () => {
    expect((citizenShell.match(/<CitizenTopNav\s*\/>/g) || []).length).toBe(1);
  });

  it("exposes a stable class hook on the top nav inner wrapper", () => {
    expect(topNav).toContain("citizen-top-nav-inner");
    expect((topNav.match(/citizen-top-nav-inner/g) || []).length).toBe(1);
  });

  it("gives the top nav its own width based on --web-shell-max", () => {
    const rule = ruleFor(".citizen-feed-shell .citizen-top-nav-inner");
    expect(rule).toMatch(/max-width:\s*var\(--web-shell-max\)/);
    expect(rule).toMatch(/width:\s*100%/);
    expect(rule).toMatch(/margin-left:\s*auto/);
    expect(rule).toMatch(/margin-right:\s*auto/);
    expect(rule).toMatch(/min-width:\s*0/);
  });

  it("never constrains the top nav to the Feed body widths", () => {
    const rule = ruleFor(".citizen-feed-shell .citizen-top-nav-inner");
    for (const forbidden of ["1072px", "1008px", "760px", "fit-content"]) {
      expect(rule, `top nav must not depend on ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("restores the top nav display after hoisting it out of .places-shell-grid", () => {
    expect(ruleFor(".citizen-feed-shell .citizen-top-nav {")).toMatch(/display:\s*block/);
  });

  it("lets the desktop feed body expand independently of the nav", () => {
    const r1Layer = globalsCSS.slice(globalsCSS.indexOf("/* ═══ R1 — Feed Desktop Final"));
    expect(r1Layer).toMatch(/\.citizen-feed-shell \.web-three-col[\s\S]*?max-width:\s*none/);
    expect(r1Layer).toMatch(/\.citizen-feed-shell \.feed-app-shell-content[\s\S]*?width:\s*100%/);
  });
});

describe("R2B — legacy feed rail sentinels", () => {
  it("keeps the duplicated context rail path absent", () => {
    expect(existsSync(`${here}../../components/feed/portal/feed-right-rail.tsx`)).toBe(false);
    expect(existsSync(`${here}../../components/feed/feed-context-rail.tsx`)).toBe(false);
    expect(existsSync(`${here}../../components/feed/portal/feed-left-rail.tsx`)).toBe(false);
    expect(existsSync(`${here}../../components/feed/portal/feed-desktop-right-rail.tsx`)).toBe(
      false,
    );
    expect(existsSync(`${here}../../components/feed/portal/feed-tonight-events.tsx`)).toBe(false);
    expect(existsSync(`${here}../../components/feed/portal/feed-member-tribes.tsx`)).toBe(false);
    expect(existsSync(`${here}../../components/feed/portal/feed-passport-card.tsx`)).toBe(false);
    expect(existsSync(`${here}../../components/feed/mobile/feed-mobile-bottom-nav.tsx`)).toBe(
      false,
    );
  });
});
