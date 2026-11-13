// @vitest-environment jsdom

/**
 * RAIL-EXPLORER-LABEL-01 — l'accès Explorer du rail medium affiche son libellé
 * court, sans changer les autres usages du déclencheur.
 *
 * Portée : jsdom ne calcule aucune mise en page. Ces tests prouvent que le texte
 * est RENDU dans le bouton et n'est pas masqué par le balisage (aria-hidden,
 * sr-only, hidden) ; ils ne prouvent PAS qu'il est visible à l'écran — la
 * mesure navigateur à 820 px est consignée dans la passation du ticket.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const openExplorer = vi.fn();

vi.mock("@/components/explorer/explorer-provider", () => ({
  useExplorerOptional: () => ({ openExplorer, isOpen: false }),
}));
vi.mock("@/hooks/use-navigation-surfaces", () => ({
  useNavigationSurfacesOptional: () => ({ surfacesInitialized: true }),
}));
// Le barrel charge aussi le panneau Explorer : seul le déclencheur réel est utile ici.
vi.mock("@/components/explorer", async () => ({
  ExplorerTriggerButton: (await import("@/components/explorer/explorer-trigger-button"))
    .ExplorerTriggerButton,
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/brand", () => ({ YunicityLogo: () => null }));
vi.mock("@/components/create-hub/create-hub-trigger-button", () => ({
  CreateHubTriggerButton: () => null,
}));
vi.mock("@/components/layout/notification-bell-icon", () => ({
  NotificationBellIcon: () => null,
}));
vi.mock("@/components/layout/citizen-account-menu", () => ({
  CitizenAccountMenu: () => null,
}));
vi.mock("@/components/layout/citizen-yunicity-menu", () => ({
  CitizenYunicityMenu: () => null,
}));
vi.mock("@/hooks/use-citizen-chrome", () => ({ useNotificationUnread: () => 0 }));

import { ExplorerTriggerButton } from "@/components/explorer/explorer-trigger-button";
import { CitizenMediumRail } from "@/components/layout/citizen-medium-rail";
import { CITIZEN_MEDIUM_RAIL_EXPLORER_LABEL } from "@/lib/layout/citizen-medium-rail-contract";
import { WEB_CITIZEN_SEARCH_ACCESS } from "@/lib/layout/web-layout-config";

const HIDING_CLASSES = new Set(["sr-only", "hidden", "invisible", "opacity-0"]);

/** Texte porté par un nœud non masqué par le balisage, jusqu'au bouton inclus. */
function exposedTextOf(button: HTMLElement): string {
  const parts: string[] = [];
  const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    let el: HTMLElement | null = node.parentElement;
    let hidden = false;
    while (el) {
      const classes = (el.getAttribute("class") ?? "").split(/\s+/);
      if (
        el.getAttribute("aria-hidden") === "true" ||
        el.hasAttribute("hidden") ||
        classes.some((c) => HIDING_CLASSES.has(c))
      ) {
        hidden = true;
        break;
      }
      if (el === button) break;
      el = el.parentElement;
    }
    if (!hidden) parts.push(node.textContent ?? "");
  }
  return parts.join("").trim();
}

afterEach(() => {
  cleanup();
  openExplorer.mockClear();
});

describe("ExplorerTriggerButton — variante du rail citoyen medium", () => {
  it("affiche le libellé court du contrat DANS le bouton", () => {
    render(<ExplorerTriggerButton variant="citizen-medium-rail" />);
    const button = screen.getByRole("button", { name: WEB_CITIZEN_SEARCH_ACCESS.label });
    expect(exposedTextOf(button)).toBe(CITIZEN_MEDIUM_RAIL_EXPLORER_LABEL);
    expect(CITIZEN_MEDIUM_RAIL_EXPLORER_LABEL).toBe("Explorer");
  });

  it("garde le nom accessible « Explorer Reims » et ouvre l'Explorer au clic", () => {
    render(<ExplorerTriggerButton variant="citizen-medium-rail" />);
    const button = screen.getByRole("button", { name: "Explorer Reims" });
    fireEvent.click(button);
    expect(openExplorer).toHaveBeenCalledWith(button);
  });

  it("conserve l'icône bleue de la marque (décision D2-b)", () => {
    render(<ExplorerTriggerButton variant="citizen-medium-rail" />);
    const icon = screen.getByRole("button").querySelector("svg");
    expect(icon?.getAttribute("class") ?? "").toContain("text-yunicity-primary");
  });
});

describe("CitizenMediumRail — contrôle Explorer", () => {
  it("rend le libellé visible dans le bouton, identité et data-rail-label inchangés", () => {
    const { container } = render(<CitizenMediumRail activeDestination="feed" />);
    const control = container.querySelector<HTMLElement>(
      '[data-citizen-medium-rail-control="explorer"]',
    );
    expect(control).not.toBeNull();
    expect(control!.getAttribute("data-rail-label")).toBe(CITIZEN_MEDIUM_RAIL_EXPLORER_LABEL);

    const buttons = control!.querySelectorAll("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.getAttribute("aria-label")).toBe(WEB_CITIZEN_SEARCH_ACCESS.label);
    expect(exposedTextOf(buttons[0]!)).toBe(CITIZEN_MEDIUM_RAIL_EXPLORER_LABEL);
  });
});

describe("ExplorerTriggerButton — autres usages inchangés (caractérisation)", () => {
  it("medium-rail (colonne latérale legacy, carré de 52 px) reste une icône seule", () => {
    render(<ExplorerTriggerButton variant="medium-rail" />);
    const button = screen.getByRole("button", { name: "Explorer Reims" });
    expect(button.textContent?.trim()).toBe("");
  });

  it("compact-mobile reste une icône seule", () => {
    render(<ExplorerTriggerButton variant="compact-mobile" />);
    const button = screen.getByRole("button", { name: "Explorer Reims" });
    expect(button.textContent?.trim()).toBe("");
  });

  it("sidebar-expanded (desktop) affiche toujours « Explorer Reims »", () => {
    // Le bouton porte `hidden xl:flex` : visible au palier desktop seulement, ce
    // que jsdom ne sait pas évaluer — on lit donc le texte rendu, pas sa visibilité.
    render(<ExplorerTriggerButton variant="sidebar-expanded" />);
    const button = screen.getByRole("button", { name: "Explorer Reims" });
    expect(button.querySelector("span")?.textContent).toBe("Explorer Reims");
  });

  it("desktop-text (barre haute) affiche toujours « Explorer Reims »", () => {
    render(<ExplorerTriggerButton variant="desktop-text" />);
    const button = screen.getByRole("button", { name: "Explorer Reims" });
    expect(button.querySelector("span")?.textContent).toBe("Explorer Reims");
  });
});
