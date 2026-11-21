// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — décision de Kyria du 2026-11-04 : sur `/feed/new`, aucune
 * destination n'est active (ni au rail medium, ni en barre basse mobile) ;
 * « Créer » l'est.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { isCreationRouteWithChrome } from "@/lib/layout/citizen-medium-shell-contract";

let pathname = "/feed/new";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/components/create-hub/create-hub-trigger-button", () => ({
  CreateHubTriggerButton: () => <button type="button">Créer</button>,
}));

afterEach(cleanup);

describe("isCreationRouteWithChrome", () => {
  it("reconnaît /feed/new, avec query, hash ou slash final", () => {
    for (const route of ["/feed/new", "/feed/new/", "/feed/new?x=1", "/feed/new#haut"]) {
      expect(isCreationRouteWithChrome(route), route).toBe(true);
    }
  });

  it("ne déborde ni sur le fil ni sur les autres créations", () => {
    for (const route of ["/feed", "/feed/newsroom", "/stories/new", "/videos/new", "/", null]) {
      expect(isCreationRouteWithChrome(route), String(route)).toBe(false);
    }
  });
});

describe("barre basse mobile", () => {
  it("/feed/new : aucune destination active, « + » marqué actif", () => {
    pathname = "/feed/new";
    const { container } = render(<WebMobileStrategicBottomNav />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
    expect(container.querySelector(".web-mobile-docked-bottom-nav-create[data-active]")).not.toBeNull();
    expect(screen.getByText("Page actuelle : créer")).toBeTruthy();
  });

  it("/feed : Accueil reste actif, « + » ne l'est pas", () => {
    pathname = "/feed";
    const { container } = render(<WebMobileStrategicBottomNav />);
    const actifs = container.querySelectorAll('[aria-current="page"]');
    expect(actifs).toHaveLength(1);
    expect(actifs[0]!.getAttribute("href")).toBe("/feed");
    expect(container.querySelector(".web-mobile-docked-bottom-nav-create[data-active]")).toBeNull();
  });
});
