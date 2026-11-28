// @vitest-environment jsdom

/**
 * RAIL-SHORT-VIEWPORT-01 — défilement du rail medium aux hauteurs courtes.
 *
 * Portée : jsdom ne calcule aucune mise en page. Les dimensions de défilement
 * sont donc posées à la main sur les conteneurs, puis un événement `scroll` est
 * émis. Ces tests prouvent la structure (deux conteneurs défilants possibles,
 * repères inertes) et la logique d'affichage des repères. Ils ne prouvent PAS
 * le rendu : les mesures Chromium sont consignées dans la passation du ticket.
 */
import { act, cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/explorer", () => ({ ExplorerTriggerButton: () => <button type="button">Explorer</button> }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/brand", () => ({ YunicityLogo: () => null }));
vi.mock("@/components/create-hub/create-hub-trigger-button", () => ({
  CreateHubTriggerButton: () => <button type="button">Créer</button>,
}));
vi.mock("@/components/layout/notification-bell-icon", () => ({ NotificationBellIcon: () => null }));
vi.mock("@/components/layout/citizen-account-menu", () => ({
  CitizenAccountMenu: () => <button type="button">Profil</button>,
}));
vi.mock("@/components/layout/citizen-yunicity-menu", () => ({
  CitizenYunicityMenu: () => <button type="button">Menu</button>,
}));
vi.mock("@/hooks/use-citizen-chrome", () => ({ useNotificationUnread: () => 0 }));

import { CitizenMediumRail } from "@/components/layout/citizen-medium-rail";

afterEach(cleanup);

type Metrics = { scrollTop: number; clientHeight: number; scrollHeight: number };

function setMetrics(el: HTMLElement, m: Metrics) {
  Object.defineProperty(el, "clientHeight", { configurable: true, value: m.clientHeight });
  Object.defineProperty(el, "scrollHeight", { configurable: true, value: m.scrollHeight });
  el.scrollTop = m.scrollTop;
  act(() => {
    el.dispatchEvent(new Event("scroll"));
  });
}

function renderRail() {
  const { container } = render(<CitizenMediumRail activeDestination="feed" />);
  const q = (selector: string) => container.querySelector<HTMLElement>(selector);
  return {
    rail: q("[data-citizen-medium-rail]")!,
    body: q("[data-citizen-medium-rail-body]")!,
    region: q("[data-citizen-medium-rail-nav-region]")!,
    nav: q("[data-citizen-medium-rail-nav]")!,
    footer: q("[data-citizen-medium-rail-footer]")!,
    cues: (scope: HTMLElement) =>
      [...scope.querySelectorAll<HTMLElement>(":scope > [data-citizen-medium-rail-scroll-cue]")].map(
        (c) => c.dataset.citizenMediumRailScrollCue,
      ),
  };
}

describe("CitizenMediumRail — structure de défilement", () => {
  it("wraps logo, navigation and footer in a body that can scroll as a whole", () => {
    const { rail, body, region, nav, footer } = renderRail();
    expect(body.parentElement).toBe(rail);
    expect(region.parentElement).toBe(body);
    expect(nav.parentElement).toBe(region);
    expect(footer.parentElement).toBe(body);
  });

  it("keeps every control in its group", () => {
    const { nav, footer } = renderRail();
    const ids = (scope: HTMLElement) =>
      [...scope.querySelectorAll<HTMLElement>("[data-citizen-medium-rail-control]")].map(
        (n) => n.dataset.citizenMediumRailControl,
      );
    expect(ids(nav)).toEqual(["feed", "videos", "map", "sortir", "explorer", "menu"]);
    expect(ids(footer)).toEqual(["create", "notifications", "profile"]);
  });

  it("gives the navigation an inner padding compensated by its region margin, so focus rings are never clipped", () => {
    const { region, nav } = renderRail();
    // 14 px + 2 px = l'ancienne marge `mt-4` (16 px) : positions inchangées.
    expect(region.className).toContain("mt-[14px]");
    expect(nav.className).toContain("py-0.5");
    expect(nav.className).not.toContain("mt-4");
  });
});

describe("CitizenMediumRail — repères de contenu caché", () => {
  it("shows no cue when nothing is hidden", () => {
    const { region, rail, nav } = renderRail();
    setMetrics(nav, { scrollTop: 0, clientHeight: 409, scrollHeight: 409 });
    expect(region.querySelectorAll("[data-citizen-medium-rail-scroll-cue]")).toHaveLength(0);
    expect(rail.querySelectorAll(":scope > [data-citizen-medium-rail-scroll-cue]")).toHaveLength(0);
  });

  it("shows a cue only on the side of the navigation that hides content", () => {
    const { region, nav, cues } = renderRail();
    setMetrics(nav, { scrollTop: 0, clientHeight: 289, scrollHeight: 366 });
    expect(cues(region)).toEqual(["bottom"]);
    setMetrics(nav, { scrollTop: 30, clientHeight: 289, scrollHeight: 366 });
    expect(cues(region)).toEqual(["top", "bottom"]);
    setMetrics(nav, { scrollTop: 77, clientHeight: 289, scrollHeight: 366 });
    expect(cues(region)).toEqual(["top"]);
  });

  it("shows rail-level cues when the whole rail scrolls (short heights)", () => {
    const { rail, body, cues } = renderRail();
    setMetrics(body, { scrollTop: 0, clientHeight: 374, scrollHeight: 679 });
    expect(cues(rail)).toEqual(["bottom"]);
    setMetrics(body, { scrollTop: 305, clientHeight: 374, scrollHeight: 679 });
    expect(cues(rail)).toEqual(["top"]);
  });

  it("renders cues that are hidden from assistive technologies and never take the pointer or the focus", () => {
    const { region, nav } = renderRail();
    setMetrics(nav, { scrollTop: 30, clientHeight: 289, scrollHeight: 366 });
    const all = [...region.querySelectorAll<HTMLElement>("[data-citizen-medium-rail-scroll-cue]")];
    expect(all).toHaveLength(2);
    for (const cue of all) {
      expect(cue.getAttribute("aria-hidden")).toBe("true");
      expect(cue.className).toContain("pointer-events-none");
      expect(cue.querySelector("a, button, [tabindex]")).toBeNull();
      expect(cue.hasAttribute("tabindex")).toBe(false);
    }
  });
});

describe("CitizenMediumRail — libellé Notifications", () => {
  it("lets the label wrap with French hyphenation instead of overflowing, without shrinking its text", () => {
    const { footer } = renderRail();
    const link = footer.querySelector<HTMLElement>('[data-citizen-medium-rail-control="notifications"]')!;
    const label = [...link.querySelectorAll<HTMLElement>("span")].find((s) => s.textContent === "Notifications");
    expect(label, "libellé visible introuvable").toBeDefined();
    expect(label!.className).toContain("hyphens-auto");
    expect(label!.className).toContain("[overflow-wrap:anywhere]");
    // Même taille de texte et même cible que les autres contrôles du rail.
    expect(link.className).toContain("text-[11px]");
    expect(link.className).toContain("min-h-14");
  });
});
