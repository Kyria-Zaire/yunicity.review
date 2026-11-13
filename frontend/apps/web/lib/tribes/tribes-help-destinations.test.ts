/**
 * TRIBE-HELP-LINK-404-01 — vérification des destinations des liens de la
 * surface Tribus, aux trois formats (desktop, medium, mobile).
 *
 * Le défaut d'origine (`/help/tribes`, 404) a traversé toutes les preuves parce
 * qu'aucune ne vérifiait qu'un `href` mène à une route qui EXISTE. Ce fichier le
 * fait, sans navigateur : il lit les sources de `components/tribes` et l'arbre
 * `app/` du routeur Next.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { HELP_CENTER_FAQ_ITEMS } from "@/lib/help/help-center-contract";
import { LEGAL_ROUTES, getLegalDocument } from "@/lib/legal/legal-document-contract";
import {
  TRIBES_COMMUNITY_RULES_HREF,
  TRIBES_HELP_GUIDE_HREF,
} from "@/lib/tribes/tribes-help-destinations";

const WEB_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const TRIBES_COMPONENTS = path.join(WEB_ROOT, "components", "tribes");

function listTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return listTsx(full);
    return name.endsWith(".tsx") ? [full] : [];
  });
}

const SOURCES = listTsx(TRIBES_COMPONENTS).map((file) => ({
  file: path.relative(WEB_ROOT, file).replaceAll("\\", "/"),
  text: readFileSync(file, "utf8"),
}));

/** Une route interne existe si `app/<chemin>/page.tsx` existe (routes statiques). */
function routeExists(href: string): boolean {
  const pathname = href.split("#")[0]!.split("?")[0]!;
  const segments = pathname.split("/").filter(Boolean);
  return existsSync(path.join(WEB_ROOT, "app", ...segments, "page.tsx"));
}

/** Blocs `<Link …>…</Link>` d'une source, pour relier un libellé à sa destination. */
function linkBlocks(text: string): string[] {
  return text.match(/<Link\b[\s\S]*?<\/Link>/g) ?? [];
}

describe("surface Tribus — aucun lien vers une route inexistante", () => {
  it("lit bien les composants des trois formats", () => {
    const formats = new Set(SOURCES.map(({ file }) => file.split("/")[2]));
    for (const format of ["desktop", "medium", "mobile"]) expect(formats.has(format)).toBe(true);
  });

  it("aucun composant ne vise /help/ (route jamais créée)", () => {
    const offenders = SOURCES.filter(({ text }) => text.includes('"/help/')).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("chaque destination interne écrite en dur existe comme route", () => {
    const missing = SOURCES.flatMap(({ file, text }) =>
      [...text.matchAll(/href="(\/[^"]*)"/g)]
        .map((match) => match[1]!)
        .filter((href) => !routeExists(href))
        .map((href) => `${file} → ${href}`),
    );
    expect(missing).toEqual([]);
  });
});

describe("destinations d'aide des tribus — option B", () => {
  it("« Guide des tribus » mène au centre d'aide, sur une question FAQ qui existe", () => {
    expect(TRIBES_HELP_GUIDE_HREF).toBe("/aide#faq-rejoindre-tribu");
    expect(routeExists(TRIBES_HELP_GUIDE_HREF)).toBe(true);
    const anchor = TRIBES_HELP_GUIDE_HREF.split("#")[1];
    const faqAnchors = HELP_CENTER_FAQ_ITEMS.map((item) => `faq-${item.id}`);
    expect(faqAnchors).toContain(anchor);
  });

  it("« Découvrir les règles de communauté » mène aux CGU, qui portent les règles de conduite", () => {
    expect(TRIBES_COMMUNITY_RULES_HREF).toBe(LEGAL_ROUTES.terms);
    expect(routeExists(TRIBES_COMMUNITY_RULES_HREF)).toBe(true);
    const conduct = getLegalDocument("terms").sections.find((section) => section.id === "conduite");
    expect(conduct?.title).toBe("Règles de conduite");
  });

  it("chaque libellé d'aide pointe vers SA destination, sur les cinq liens", () => {
    const guide: string[] = [];
    const rules: string[] = [];
    for (const { file, text } of SOURCES) {
      for (const block of linkBlocks(text)) {
        if (block.includes("TRIBES_DESKTOP_GET_STARTED_GUIDE")) {
          expect(block, file).toContain("href={TRIBES_HELP_GUIDE_HREF}");
          guide.push(file);
        }
        if (block.includes("TRIBES_DESKTOP_CREATE_BANNER_RULES")) {
          expect(block, file).toContain("href={TRIBES_COMMUNITY_RULES_HREF}");
          rules.push(file);
        }
      }
    }
    expect(guide.sort()).toEqual([
      "components/tribes/desktop/tribes-desktop-right-rail.tsx",
      "components/tribes/medium/tribes-medium-nearby-started-row.tsx",
      "components/tribes/mobile/tribes-mobile-nearby-started.tsx",
    ]);
    expect(rules.sort()).toEqual([
      "components/tribes/desktop/tribes-desktop-create-banner.tsx",
      "components/tribes/medium/tribes-medium-create-banner.tsx",
    ]);
  });
});
