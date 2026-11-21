import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * FEED-MAIN-LAYOUT-UIUX-01 — invariants §8, verrouilles a la source.
 *
 * Ce fichier ne teste PAS l'esthetique : il verrouille les quatre proprietes
 * que l'addendum declare non negociables et qu'une refonte ulterieure pourrait
 * defaire sans s'en apercevoir — la position du Passeport, la position des
 * Evenements immediatement sous lui, l'absence de duplication de ces deux
 * modules, et l'absence de donnee inventee reprise de la maquette.
 */

const here = fileURLToPath(new URL(".", import.meta.url));
const read = (relative: string) => readFileSync(`${here}${relative}`, "utf-8");

const rightRail = read("../../components/feed/desktop/feed-desktop-right-rail.tsx");
const leftRail = read("../../components/feed/desktop/feed-desktop-left-rail.tsx");
const mainColumn = read("../../components/feed/feed-editorial-main-column.tsx");
const passportModule = read("../../components/feed/feed-passport-module.tsx");
const controller = read("../../components/feed/portal/feed-data-controller.tsx");
const eveningStrip = read(
  "../../components/feed/desktop/feed-desktop-evening-events-strip.tsx",
);
const portalContext = read("../../hooks/use-feed-portal-context.ts");
const globalsCSS = read("../../app/globals.css");

/** Corps de la fonction exportee — evite de confondre le rendu et les helpers du fichier. */
function exportedBody(source: string, name: string): string {
  const start = source.indexOf(`export function ${name}(`);
  expect(start, `${name} introuvable`).toBeGreaterThan(-1);
  return source.slice(start);
}

/** Blocs `@media (min-width: X)` d'une feuille, par comptage d'accolades. */
function mediaBlocks(css: string, minWidth: string): string[] {
  const blocks: string[] = [];
  const opener = new RegExp(`@media\\s*\\(\\s*min-width:\\s*${minWidth}\\s*\\)\\s*\\{`, "g");
  let match: RegExpExecArray | null;
  while ((match = opener.exec(css)) !== null) {
    const start = match.index + match[0].length;
    let depth = 1;
    let index = start;
    while (index < css.length && depth > 0) {
      if (css[index] === "{") depth += 1;
      else if (css[index] === "}") depth -= 1;
      index += 1;
    }
    blocks.push(css.slice(start, index - 1));
  }
  return blocks;
}

const desktopBlocks = mediaBlocks(globalsCSS, "1024px");

describe("FEED-MAIN-LAYOUT-UIUX-01 — volet droit", () => {
  it("PASSEPORT_POSITION_DESKTOP = RIGHT_RAIL", () => {
    const body = exportedBody(rightRail, "FeedDesktopRightRail");
    expect(body).toContain("<FeedPassportModule");
    expect(rightRail).toContain('className="feed-desktop-right-rail"');
  });

  it("EVENTS_POSITION_DESKTOP = RIGHT_RAIL_BELOW_PASSPORT", () => {
    const body = exportedBody(rightRail, "FeedDesktopRightRail");
    const passport = body.indexOf("<FeedPassportModule");
    const events = body.indexOf("<TonightModule");
    const privilege = body.indexOf("<LocalPrivilegeModule");

    expect(passport).toBeGreaterThan(-1);
    expect(events).toBeGreaterThan(-1);
    expect(passport, "le Passeport doit preceder les Evenements").toBeLessThan(events);
    expect(privilege, "le privilege partenaire ne doit pas s'intercaler").toBeGreaterThan(events);

    // « Immediatement sous » : aucun autre composant entre les deux.
    const between = body.slice(passport, events);
    expect(between.match(/<[A-Z][A-Za-z]*/g) ?? []).toEqual(["<FeedPassportModule"]);
  });

  it("le volet gauche ne porte ni Passeport ni module Evenements (§6)", () => {
    expect(leftRail).not.toContain("FeedPassportModule");
    expect(leftRail).not.toContain("TonightModule");
    expect(leftRail).not.toContain("selectFeedRightRailEveningEvents");
    expect(leftRail).not.toContain("FeedEditorialEveningFeatured");
  });
});

describe("FEED-MAIN-LAYOUT-UIUX-01 — repli responsive (§7)", () => {
  it("replie le Passeport dans la colonne centrale, AVANT les Evenements", () => {
    const passport = mainColumn.indexOf('data-feed-medium-region="passport"');
    const events = mainColumn.indexOf("<FeedEditorialEveningFeatured");
    expect(passport, "region passport absente de la colonne centrale").toBeGreaterThan(-1);
    expect(events).toBeGreaterThan(-1);
    expect(passport).toBeLessThan(events);
  });

  it("n'expose qu'un seul des deux emplacements a une largeur donnee", () => {
    // Hors Desktop : le slot compact existe, le volet droit est `display: none`.
    expect(globalsCSS).toMatch(/\.feed-compact-passport\s*\{\s*display:\s*block/);
    expect(globalsCSS).toMatch(
      /\.feed-desktop-left-rail,\s*\.feed-desktop-right-rail\s*\{\s*display:\s*none/,
    );
    // A partir de 1024px : le volet droit reprend la main, le slot compact disparait.
    expect(
      desktopBlocks.some((block) => /\.feed-compact-passport\s*\{\s*display:\s*none/.test(block)),
      "le Passeport compact doit disparaitre des 1024px",
    ).toBe(true);
    expect(
      desktopBlocks.some((block) => /\.feed-desktop-right-rail\s*\{\s*display:\s*block/.test(block)),
    ).toBe(true);
    // La regle de base ne doit pas vivre DANS la media query.
    expect(
      desktopBlocks.every((block) => !/\.feed-compact-passport\s*\{\s*display:\s*block/.test(block)),
    ).toBe(true);
  });

  it("arme la requete Passport depuis les DEUX emplacements", () => {
    // Sans cela le module compact resterait en chargement sous 1024px, la ou le
    // rail droit — seule sonde d'origine — n'est jamais visible.
    expect(controller).toMatch(
      /usePassportFeedRail\(\s*desktopRailsEnabled\s*\|\|\s*compactPassportEnabled\s*\)/,
    );
    expect(controller).toContain("compactPassportProbeRef");
    expect(mainColumn).toContain("ref={compactPassportProbeRef}");
  });
});

describe("FEED-MAIN-LAYOUT-UIUX-01 — non-duplication (§5)", () => {
  it("DUPLICATE_EVENT_MODULE = NO", () => {
    // Le bandeau editorial derive des memes evenements que le module du volet
    // droit : il ne doit pas etre rendu quand le volet droit est affiche.
    expect(
      desktopBlocks.some((block) =>
        /\.feed-editorial-evening-featured\s*\{\s*display:\s*none/.test(block),
      ),
      "l'agenda central doit disparaitre des que le volet droit apparait",
    ).toBe(true);
    // Une seule surface Evenements par palier : un seul montage de chaque.
    expect((mainColumn.match(/<FeedEditorialEveningFeatured\b/g) ?? []).length).toBe(1);
    expect((rightRail.match(/<TonightModule\b/g) ?? []).length).toBe(1);
  });

  it("DUPLICATE_PASSPORT_MODULE = NO", () => {
    // Source unique : les deux emplacements montent le MEME composant.
    for (const source of [rightRail, mainColumn]) {
      expect(source).toContain('from "@/components/feed/feed-passport-module"');
      expect((source.match(/<FeedPassportModule\b/g) ?? []).length).toBe(1);
      expect(source, "le rendu du Passeport ne doit exister qu'une fois").not.toContain(
        "PassportLoadedContent",
      );
    }
  });
});

describe("FEED-MAIN-LAYOUT-UIUX-01 — la maquette guide le layout, jamais le metier", () => {
  const sources = { rightRail, leftRail, mainColumn, passportModule };

  it("FICTIONAL_DATA_ADDED = NO", () => {
    // Valeurs et blocs purement illustratifs du `main-layout.pdf` (§1 et §3).
    const inventees = [
      "420 XP",
      "580 XP",
      "Niveau 2",
      "pass dégustation",
      "Activité Locale",
      "Personnes à suivre",
      "Tribus à rejoindre",
      "Pulse Local",
      "interactions rémoises",
      "Lucie Bernard",
      "Alexandre G.",
      "Maison Fossier",
      "Marché de Noël",
    ];
    for (const [nom, source] of Object.entries(sources)) {
      for (const texte of inventees) {
        expect(source, `${nom} reprend « ${texte} » de la maquette`).not.toContain(texte);
      }
    }
  });

  it("HARDCODED_EVENT_ADDED = NO — les evenements viennent des props", () => {
    expect(rightRail).toContain("events={events}");
    expect(mainColumn).toContain("events={portalEvents}");
    for (const [nom, source] of Object.entries(sources)) {
      expect(source, `${nom} ne doit pas fetcher lui-meme`).not.toMatch(/\bfetch\(|useYunicityApi/);
      expect(source, `${nom} ne doit pas embarquer de jeu d'evenements`).not.toMatch(
        /starts_at:\s*["'`]/,
      );
    }
  });

  it("le Passeport n'affiche que ce que l'API expose, avec ses quatre etats", () => {
    expect(passportModule).toContain("summary.passport_tier");
    expect(passportModule).toContain("summary.earned_badges");
    // loading · indisponible (erreur ou absence) · charge
    expect(passportModule).toContain("animate-pulse");
    expect(passportModule).toContain("Passport indisponible");
    expect(passportModule).toContain('data-feed-passport-state="loaded"');
    // Acces au Passeport existant, sans nouvelle route.
    expect(passportModule).toContain('href="/passport"');
  });
});

describe("FEED-MAIN-LAYOUT-UIUX-01 — les quatre etats du bloc Evenements (§4)", () => {
  // Les deux surfaces Evenements — volet droit (>= 1024px) et bandeau central
  // (< 1024px) — doivent dire la meme chose dans les memes situations.
  for (const [nom, source] of Object.entries({ rightRail, eveningStrip })) {
    it(`${nom} distingue chargement, erreur, absence et contenu`, () => {
      expect(source, "etat de chargement absent").toContain("animate-pulse");
      expect(source, "erreur confondue avec une absence").toContain(
        "Agenda momentanément indisponible",
      );
      expect(source, "erreur sans action de reprise").toContain("Réessayer");
      expect(source, "etat vide absent").toContain("Aucun événement prévu pour le moment");
      // La priorite compte : un agenda vide EN COURS de chargement n'est pas
      // une absence d'evenement, et un echec reseau n'en est pas une non plus.
      expect(source).toMatch(/loading &&[\s\S]{0,80}\?\s*"loading"/);
      expect(source).toMatch(/error &&[\s\S]{0,80}\?\s*"error"/);
    });
  }

  it("expose un echec de l'agenda distinct d'un agenda vide", () => {
    // `events: []` seul ne permet pas de choisir le bon message.
    expect(portalContext).toContain("eventsError: boolean");
    expect(portalContext).toMatch(/setEvents\(\[\]\);\s*setEventsError\(true\);/);
    expect(portalContext).toMatch(/setLoading\(true\);\s*setEventsError\(false\);/);
  });

  it("branche les etats depuis le controleur, seul proprietaire du reseau", () => {
    expect(controller).toContain("eventsLoading={portal.loading}");
    expect(controller).toContain("eventsError={portal.eventsError}");
    expect(controller).toContain("onRetryEvents={portal.reload}");
  });
});
