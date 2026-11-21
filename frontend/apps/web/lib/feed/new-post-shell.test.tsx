// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — le composeur monte le chrome citoyen RÉEL des trois paliers.
 *
 * ⛔ Aucun chrome réinventé : l'écran emprunte la navigation desktop, le rail
 * medium, l'en-tête et la barre basse mobile déjà en service ailleurs.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewPostShell } from "@/components/feed/post-composer/new-post-shell";

afterEach(cleanup);

vi.mock("@/components/layout/web-mobile-chrome", () => ({
  WebMobileHeader: () => <div data-testid="chrome-mobile-header" />,
  WebMobileFooter: () => <div data-testid="chrome-mobile-footer" />,
}));
vi.mock("@/components/layout/web-mobile-strategic-bottom-nav", () => ({
  WebMobileStrategicBottomNav: () => <div data-testid="chrome-bottom-nav" />,
}));
vi.mock("@/components/layout/web-sidebar", () => ({
  WebSidebar: () => <div data-testid="chrome-sidebar" />,
}));
vi.mock("@/components/layout/citizen-top-nav", () => ({
  CitizenTopNav: () => <div data-testid="chrome-top-nav" />,
}));

describe("NewPostShell", () => {
  it("monte le chrome citoyen réel des trois paliers", () => {
    render(
      <NewPostShell>
        <p>contenu</p>
      </NewPostShell>,
    );
    expect(screen.getByTestId("chrome-mobile-header")).toBeTruthy();
    expect(screen.getByTestId("chrome-bottom-nav")).toBeTruthy();
    expect(screen.getByTestId("chrome-sidebar")).toBeTruthy();
    expect(screen.getByTestId("chrome-top-nav")).toBeTruthy();
    expect(screen.getByText("contenu")).toBeTruthy();
  });

  it("réserve la hauteur de la barre basse mobile sous le contenu", () => {
    const { container } = render(
      <NewPostShell>
        <p>contenu</p>
      </NewPostShell>,
    );
    // Sans ce padding, la barre ancrée recouvre la fin du formulaire.
    expect(container.querySelector('[class*="max-[639px]:pb-"]')).not.toBeNull();
  });
});
