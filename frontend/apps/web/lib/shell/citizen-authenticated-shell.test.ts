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

describe("D1.1 — Desktop visual shell (>=1280px)", () => {
  it("passes citizen-feed-shell variant to CitizenAuthenticatedShell for explicit scoping", () => {
    expect(portalScreen).toContain('variant="citizen-feed-shell"');
  });

  it("adds desktop greeting using real user name and city", () => {
    expect(portalScreen).toContain("feed-desktop-greeting");
    expect(portalScreen).toContain("userFirstName");
    expect(portalScreen).toContain("Bonjour");
    expect(portalScreen).toContain("realCity");
  });

  it("hides greeting on mobile/medium with xl:block", () => {
    expect(portalScreen).toContain("hidden xl:block");
  });

  it("does not hardcode fallback city Reims in greeting", () => {
    expect(portalScreen).toContain("realCity ?");
    expect(portalScreen).not.toMatch(/Bienvenue sur le fil de "Reims"/);
  });

  it("contains no historic async context rail", () => {
    // D1.1 interdisait tout rail droit. D1.2 en introduit un, mais a cout zero
    // et borne a >=1536px : ce qui survit de l'intention D1.1, c'est le refus du
    // rail contextuel historique (`WebContextRail`, fetches propres).
    expect(portalScreen).not.toContain("web-context-rail");
    expect(portalScreen).not.toContain("WebContextRail");
  });

  it("preserves FeedLeftRail navigation unchanged", () => {
    expect(portalScreen).toContain("<FeedLeftRail");
    expect(portalScreen).toContain("activeView={activeView}");
    expect(portalScreen).toContain("onNavSelect={handleLeftNavSelect}");
  });

  it("keeps one FeedStreamList and no duplications", () => {
    const streamListCount = (portalScreen.match(/<FeedStreamList/g) || []).length;
    expect(streamListCount).toBe(1);
  });

  it("does not fetch new data or introduce new endpoints", () => {
    // Cible les APPELS, pas la sous-chaine "fetch" : celle-ci matchait des
    // commentaires et aurait rougi sans defaut reel.
    expect(portalScreen).not.toContain("useDesktopGreeting");
    expect(portalScreen).not.toContain("fetch(");
    expect(portalScreen).not.toMatch(/\/api\/v1/);
  });

  it("ensures citizen-feed-shell scoping isolates D1.1 styles from other routes", () => {
    expect(portalScreen).toContain('variant="citizen-feed-shell"');
  });

  it("keeps FeedLeftRail inside the Feed group, not in the shell grid", () => {
    // Mesure R3 : le rail Desktop visible est FeedLeftRail (aside.w-56, xl:block),
    // remonte dans `.feed-app-shell-content` via `.web-feed-desktop-contents`
    // (display:contents). `.web-sidebar-aside` ne genere aucune boite a >=1280px.
    expect(portalScreen).toContain("web-feed-desktop-contents");
    const railIndex = portalScreen.indexOf("<FeedLeftRail");
    const columnIndex = portalScreen.indexOf("feed-medium-column");
    expect(railIndex).toBeGreaterThan(-1);
    expect(columnIndex).toBeGreaterThan(railIndex);
  });
});

/**
 * D1.1-R3 — verrous CSS de la geometrie Desktop.
 *
 * LIMITE ASSUMEE : ces assertions sont TEXTUELLES. Elles ne prouvent aucune
 * geometrie navigateur — la version R1/R2 passait au vert avec un Feed rendu
 * a 512px. Leur seul role est d'empecher le RETOUR de la regle fautive
 * (`max-width:760px` sur le groupe rail+Feed, grille de rail sur WebSidebar).
 * La preuve de geometrie reste la campagne de captures R4.
 */
describe("D1.1-R3 — CSS desktop geometry guards (textual, not geometric proof)", () => {
  const globalsCSS = readFileSync(`${here}../../app/globals.css`, "utf-8");

  /** Bloc @media (min-width:1280px) portant la couche D1.1. */
  const desktopLayer = (() => {
    const start = globalsCSS.indexOf("/* ——— D1.1 DESKTOP");
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
    throw new Error("D1.1 desktop layer: unbalanced braces");
  })();

  /** Couche D1.1 sans les commentaires : les garde-fous portent sur les regles. */
  const desktopRules = desktopLayer.replace(/\/\*[\s\S]*?\*\//g, "");

  const ruleFor = (selector: string): string => {
    const at = desktopLayer.indexOf(selector);
    expect(at, `selector not found in D1.1 layer: ${selector}`).toBeGreaterThan(-1);
    const open = desktopLayer.indexOf("{", at);
    const close = desktopLayer.indexOf("}", open);
    return desktopLayer.slice(open, close);
  };

  it("scopes the whole D1.1 layer to min-width 1280px", () => {
    expect(desktopLayer).toMatch(/@media\s*\(\s*min-width:\s*1280px\s*\)/);
    const before = globalsCSS.slice(0, globalsCSS.indexOf("/* ——— D1.1 DESKTOP"));
    expect(before).not.toContain(".citizen-feed-shell");
  });

  it("keeps every .citizen-feed-shell rule inside a >=1280px media layer", () => {
    // D1.2 ajoute une couche >=1536px : le scope reste borne en bas a 1280px.
    const layers = [...globalsCSS.matchAll(/@media\s*\(\s*min-width:\s*(\d+)px\s*\)\s*\{/g)];
    let index = globalsCSS.indexOf(".citizen-feed-shell");
    while (index !== -1) {
      const enclosing = layers.filter((layer) => (layer.index ?? 0) < index).pop();
      expect(enclosing, `.citizen-feed-shell hors media query (offset ${index})`).toBeTruthy();
      expect(
        Number(enclosing?.[1]),
        `.citizen-feed-shell sous 1280px (offset ${index})`,
      ).toBeGreaterThanOrEqual(1280);
      index = globalsCSS.indexOf(".citizen-feed-shell", index + 1);
    }
  });

  it("never rebuilds the Feed rail from WebSidebar via grid-template-columns", () => {
    // `.places-shell-grid` impose `minmax(0,1fr)` et masque `.web-sidebar-aside`
    // a ce breakpoint : toute grille de rail dans la couche D1.1 est morte.
    expect(desktopRules).not.toContain("grid-template-columns: var(--web-sidebar-width-full)");
    expect(desktopRules).not.toContain("--web-sidebar-width-full");
    expect(desktopRules).not.toContain(".web-sidebar-aside");
  });

  it("keeps .web-three-col as a centered container only", () => {
    const rule = ruleFor(".citizen-feed-shell .web-three-col");
    expect(rule).toMatch(/margin-left:\s*auto/);
    expect(rule).toMatch(/margin-right:\s*auto/);
    expect(rule).toMatch(/max-width:/);
    expect(rule).not.toContain("grid-template-columns");
  });

  it("lets .web-main-column fill the container without capping the Feed", () => {
    const rule = ruleFor(".citizen-feed-shell .web-main-column");
    expect(rule).toMatch(/width:\s*100%/);
    expect(rule).toMatch(/min-width:\s*0/);
    expect(rule).not.toContain("max-width");
  });

  it("sizes .feed-app-shell-content as the real rail+Feed group, never capped at 760px", () => {
    const rule = ruleFor(".citizen-feed-shell .feed-app-shell-content");
    expect(rule).toMatch(/width:\s*fit-content/);
    expect(rule).toMatch(/max-width:\s*100%/);
    expect(rule).toMatch(/margin-left:\s*auto/);
    expect(rule).toMatch(/margin-right:\s*auto/);
    expect(rule).toMatch(/gap:\s*1\.5rem/);
    // Regression guard R3 : 760px sur ce groupe plafonnait rail + Feed ensemble.
    expect(rule).not.toContain("760px");
  });

  it("moves the 760px constraint onto .feed-medium-column alone", () => {
    const rule = ruleFor(".citizen-feed-shell .feed-medium-column");
    expect(rule).toMatch(/flex:\s*0\s+1\s+760px/);
    expect(rule).toMatch(/width:\s*760px/);
    expect(rule).toMatch(/max-width:\s*760px/);
    expect(rule).toMatch(/min-width:\s*0/);
  });

  it("keeps the desktop row-gap at 24px and neutralises additive child margins", () => {
    const column = ruleFor(".citizen-feed-shell .feed-medium-column");
    const rowGap = column.match(/row-gap:\s*([\d.]+)rem/);
    expect(rowGap).not.toBeNull();
    expect(Number(rowGap?.[1])).toBeLessThanOrEqual(1.5); // <= 24px

    // Mesure R3 : 40 / 44 / 40px = row-gap + marges historiques des enfants.
    expect(ruleFor(".citizen-feed-shell .feed-desktop-greeting")).toMatch(/margin-bottom:\s*0/);
    expect(ruleFor('.citizen-feed-shell [data-feed-medium-region="composer"]')).toMatch(/margin-top:\s*0/);
    expect(ruleFor(".citizen-feed-shell .feed-stream-list")).toMatch(/margin-top:\s*0/);
  });

  it("uses no negative margins in the desktop layer", () => {
    expect(desktopRules).not.toMatch(/margin[a-z-]*:\s*-/);
  });

  it("declares no right rail surface in the desktop layer", () => {
    expect(desktopRules).not.toContain("web-context-rail");
    expect(desktopRules).not.toContain("feed-right-rail");
  });
});

/**
 * D1.1-R7 — CitizenTopNav decouplee du corps Feed.
 *
 * LIMITE ASSUMEE : assertions TEXTUELLES. Elles ne prouvent AUCUNE absence de
 * chevauchement au navigateur — la version R6 passait au vert avec une nav rognee
 * a 1536 et 1920px (mesure R6A). Leur role est d'empecher le retour de la nav
 * sous le plafond du corps Feed. La preuve de non-collision reste la campagne R7.
 */
describe("D1.1-R7 — top nav decoupling guards (textual, not overlap proof)", () => {
  const globalsCSS = readFileSync(`${here}../../app/globals.css`, "utf-8");
  const topNav = readFileSync(`${here}../../components/layout/citizen-top-nav.tsx`, "utf-8");

  const desktopLayer = (() => {
    const start = globalsCSS.indexOf("/* ——— D1.1 DESKTOP");
    const open = globalsCSS.indexOf("{", globalsCSS.indexOf("@media", start));
    let depth = 0;
    for (let i = open; i < globalsCSS.length; i += 1) {
      if (globalsCSS[i] === "{") depth += 1;
      else if (globalsCSS[i] === "}") {
        depth -= 1;
        if (depth === 0) return globalsCSS.slice(start, i + 1);
      }
    }
    throw new Error("D1.1 desktop layer: unbalanced braces");
  })();

  const ruleFor = (selector: string): string => {
    const at = desktopLayer.indexOf(selector);
    expect(at, `selector not found: ${selector}`).toBeGreaterThan(-1);
    const open = desktopLayer.indexOf("{", at);
    return desktopLayer.slice(open, desktopLayer.indexOf("}", open));
  };

  it("renders the top nav outside the Feed body container", () => {
    // La nav doit preceder `.web-three-col` : soeur, jamais descendante.
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
    // `.places-shell-grid .citizen-top-nav` ne matche plus pour le Feed.
    expect(ruleFor(".citizen-feed-shell .citizen-top-nav {")).toMatch(/display:\s*block/);
  });

  it("keeps the Feed body capped independently of the nav", () => {
    const container = ruleFor(".citizen-feed-shell .web-three-col");
    expect(container).toMatch(/max-width:\s*calc\(/);
    expect(container).toContain("760px");
    expect(ruleFor(".citizen-feed-shell .feed-medium-column")).toMatch(/max-width:\s*760px/);
  });
});

/**
 * D1.2-R2 — rail droit Desktop a cout zero.
 *
 * LIMITE ASSUMEE : assertions TEXTUELLES. Elles ne prouvent aucune geometrie
 * navigateur — ni les 1352px du groupe, ni le centrage, ni l'absence de
 * chevauchement. Leur role est de verrouiller le contrat de montage, l'absence
 * de requete et le bornage a 1536px. La preuve reste la campagne de captures.
 */
describe("D1.2-R2 — zero-cost right rail (textual, not geometric proof)", () => {
  const globalsCSS = readFileSync(`${here}../../app/globals.css`, "utf-8");
  // Nom distinct de `feed-right-rail.tsx` : ce chemin sert de sentinelle au
  // garde-fou R2B (rail contextuel duplique, supprime). Il doit rester absent.
  const rightRail = readFileSync(
    `${here}../../components/feed/portal/feed-desktop-right-rail.tsx`,
    "utf-8",
  );
  const tonight = readFileSync(
    `${here}../../components/feed/portal/feed-tonight-events.tsx`,
    "utf-8",
  );
  const memberTribes = readFileSync(
    `${here}../../components/feed/portal/feed-member-tribes.tsx`,
    "utf-8",
  );
  const modules = readFileSync(`${here}../feed/feed-right-rail-modules.ts`, "utf-8");

  const layer1536 = (() => {
    const start = globalsCSS.indexOf("/* ——— D1.2 DESKTOP LARGE");
    expect(start, "couche D1.2 absente").toBeGreaterThan(-1);
    const open = globalsCSS.indexOf("{", globalsCSS.indexOf("@media", start));
    let depth = 0;
    for (let i = open; i < globalsCSS.length; i += 1) {
      if (globalsCSS[i] === "{") depth += 1;
      else if (globalsCSS[i] === "}") {
        depth -= 1;
        if (depth === 0) return globalsCSS.slice(start, i + 1);
      }
    }
    throw new Error("D1.2 layer: unbalanced braces");
  })();

  it("mounts the right rail as the third child, after the Feed column", () => {
    const railAt = portalScreen.indexOf("<FeedDesktopRightRail");
    const columnAt = portalScreen.indexOf("feed-medium-column");
    const leftRailAt = portalScreen.indexOf("<FeedLeftRail");
    expect(railAt).toBeGreaterThan(-1);
    expect(leftRailAt, "rail gauche avant le Feed").toBeLessThan(columnAt);
    expect(railAt, "rail droit apres le Feed").toBeGreaterThan(columnAt);
  });

  it("renders no aside at all when no module has real content", () => {
    expect(rightRail).toContain("hasRightRailContent");
    expect(rightRail).toMatch(/if\s*\(!hasRightRailContent\([\s\S]*?\)\)\s*return null/);
  });

  it("derives both modules from the already-mounted portal context", () => {
    expect(portalScreen).toContain("selectTonightEvents(portal.events)");
    expect(portalScreen).toContain("selectMemberTribes(portal.tribes)");
  });

  it("introduces no fetch, hook or endpoint of its own", () => {
    for (const source of [rightRail, tonight, memberTribes, modules]) {
      expect(source).not.toContain("useYunicityApi");
      expect(source).not.toContain("useEffect");
      expect(source).not.toContain("fetch(");
      expect(source).not.toMatch(/\/api\/v1/);
    }
  });

  it("uses no breakpoint JavaScript — visibility belongs to CSS", () => {
    for (const source of [rightRail, tonight, memberTribes, modules]) {
      expect(source).not.toMatch(/matchMedia|innerWidth|useIsDesktop/);
    }
    expect(globalsCSS).toMatch(/\.feed-right-rail\s*\{\s*display:\s*none/);
  });

  it("reveals the right rail only from 1536px, at 320px wide", () => {
    expect(layer1536).toMatch(/@media\s*\(\s*min-width:\s*1536px\s*\)/);
    expect(layer1536).toMatch(/\.citizen-feed-shell\s+\.feed-right-rail[\s\S]*?display:\s*block/);
    expect(layer1536).toMatch(/flex:\s*0\s+0\s+var\(--web-context-rail-width-md\)/);
    expect(globalsCSS).toContain("--web-context-rail-width-md: 20rem");
  });

  it("widens the container to the 1352px group only at 1536px", () => {
    expect(layer1536).toMatch(
      /\.citizen-feed-shell\s+\.web-three-col[\s\S]*?max-width:\s*calc\([\s\S]*?--web-context-rail-width-md/,
    );
    // Le conteneur D1.1 (1072px) reste la valeur par defaut entre 1280 et 1535.
    expect(layer1536).not.toMatch(/grid-template-columns/);
  });

  it("keeps the right rail sticky and self-sized", () => {
    expect(layer1536).toMatch(/position:\s*sticky/);
    expect(layer1536).toMatch(/height:\s*fit-content/);
  });

  it("shows only legal links whose routes exist", () => {
    expect(rightRail).toContain("/legal/confidentialite");
    expect(rightRail).toContain("/legal/conditions-generales");
    expect(rightRail).not.toMatch(/À propos|\/about|\/aide|\/help/);
    expect(rightRail).toContain("getFullYear()");
  });

  it("links every module to a real route", () => {
    expect(tonight).toContain("/events/${event.id}");
    expect(tonight).toContain('href="/sortir"');
    expect(memberTribes).toContain("/tribes/${tribe.slug}");
    expect(memberTribes).toContain('href="/tribes"');
  });

  it("invents no tribe activity and no default counters", () => {
    expect(memberTribes).not.toMatch(/il y a|activité récente|actif il y a/i);
    expect(memberTribes).toContain("active_member_count");
    // Le compteur d'interet ne s'affiche que s'il est reellement fourni.
    expect(tonight).toContain('typeof event.interest_count === "number"');
  });

  it("exposes the contextual landmark once, after the Feed", () => {
    expect(rightRail).toContain('aria-label="Informations contextuelles"');
    expect((rightRail.match(/<aside/g) || []).length).toBe(1);
  });

  it("keeps a single FeedStreamList and one right rail mount", () => {
    expect((portalScreen.match(/<FeedStreamList/g) || []).length).toBe(1);
    expect((portalScreen.match(/<FeedDesktopRightRail/g) || []).length).toBe(1);
  });

  it("leaves the R2B sentinel path free", () => {
    // R2B garde l'absence de `feed-right-rail.tsx` comme preuve que le rail
    // contextuel duplique n'est pas revenu. D1.2 ne doit pas reoccuper ce nom.
    expect(existsSync(`${here}../../components/feed/portal/feed-right-rail.tsx`)).toBe(false);
  });
});
