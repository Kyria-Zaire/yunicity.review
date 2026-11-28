// @vitest-environment jsdom

/**
 * PASSPORT-OFFERS-ANCHOR-01 — chemin 1 (vue Offres).
 *
 * « Consulter les règles », sous « Des conditions transparentes », visait
 * `#passport-desktop-how` : aucun élément de cet id n'existe dans la vue Offres,
 * le routeur Next retombait sur le haut du segment et rien ne bougeait.
 * Décision de Kyria (option B, 2026-11-11) : le lien mène aux CGU, qui portent
 * la section « Passport et offres partenaires ». Sans ancre : la page des CGU
 * rend une ancre différente par format (`d-`, `md-`, `m-passport-partenaires`).
 *
 * Le chemin « Mon Passport » (« Des règles transparentes ») fonctionne — constaté
 * sur la Preview — et NE DOIT PAS changer.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { existsSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { PassportOffersConditionsBanner } from "@/components/passport/passport-offers-panels";
import { PassportRulesPanel } from "@/components/passport/passport-rail-panels";
import { LEGAL_ROUTES, getLegalDocument } from "@/lib/legal/legal-document-contract";

// `import.meta.url` n'est pas une URL `file:` sous jsdom : `__dirname` (fourni par Vitest).
const WEB_ROOT = path.resolve(__dirname, "../..");

function routeExists(href: string): boolean {
  const segments = href.split("#")[0]!.split("?")[0]!.split("/").filter(Boolean);
  return existsSync(path.join(WEB_ROOT, "app", ...segments, "page.tsx"));
}

afterEach(cleanup);

describe("vue Offres — « Des conditions transparentes »", () => {
  it("« Consulter les règles » mène aux CGU, route existante", () => {
    render(<PassportOffersConditionsBanner titleId="t-conditions" />);
    const link = screen.getByRole("link", { name: /Consulter les règles/ });
    expect(link.getAttribute("href")).toBe(LEGAL_ROUTES.terms);
    expect(routeExists(LEGAL_ROUTES.terms)).toBe(true);
  });

  it("ne vise plus une ancre absente de la vue Offres", () => {
    render(<PassportOffersConditionsBanner titleId="t-conditions" />);
    const link = screen.getByRole("link", { name: /Consulter les règles/ });
    expect(link.getAttribute("href")).not.toContain("#passport-desktop-how");
  });

  it("les CGU portent bien la section « Passport et offres partenaires »", () => {
    const section = getLegalDocument("terms").sections.find((s) => s.id === "passport-partenaires");
    expect(section?.title).toBe("Passport et offres partenaires");
  });
});

describe("vue « Mon Passport » — « Des règles transparentes » (inchangée)", () => {
  it("garde son ancre vers la section de progression", () => {
    render(<PassportRulesPanel />);
    const link = screen.getByRole("link", { name: /Consulter les règles/ });
    expect(link.getAttribute("href")).toBe("#passport-desktop-how");
  });
});
