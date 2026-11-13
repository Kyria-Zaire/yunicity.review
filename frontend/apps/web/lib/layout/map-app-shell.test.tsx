// @vitest-environment jsdom

/**
 * MAP-HEADER-01 — le shell Carte monte l'en-tête commun, en tête de la colonne
 * principale, comme les autres shells. Son affichage par palier est réglé par la
 * CSS (`map-header.test.ts`) ; jsdom ne calcule aucune mise en page.
 */
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout/citizen-top-nav", () => ({
  CitizenTopNav: () => <header data-testid="citizen-top-nav" />,
}));
vi.mock("@/components/layout/web-sidebar", () => ({ WebSidebar: () => null }));
vi.mock("@/components/layout/web-mobile-chrome", () => ({
  WebMobileHeader: () => null,
  WebMobileFooter: () => null,
}));
vi.mock("@/components/layout/web-mobile-strategic-bottom-nav", () => ({
  WebMobileStrategicBottomNav: () => null,
}));

import { MapAppShell } from "@/components/map/map-app-shell";

afterEach(cleanup);

describe("MapAppShell", () => {
  it("renders the common header once, at the top of the main column, before the map", () => {
    const { container, getAllByTestId } = render(
      <MapAppShell>
        <div data-testid="map-content" />
      </MapAppShell>,
    );
    expect(getAllByTestId("citizen-top-nav")).toHaveLength(1);
    const main = container.querySelector("main")!;
    const header = main.querySelector("[data-testid='citizen-top-nav']");
    const content = main.querySelector("[data-testid='map-content']");
    expect(header).not.toBeNull();
    expect(content).not.toBeNull();
    expect(header!.compareDocumentPosition(content!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the map shell classes the CSS relies on", () => {
    const { container } = render(<MapAppShell>{null}</MapAppShell>);
    expect(container.querySelector(".map-mobile-shell .places-shell-grid main.web-main-column")).not.toBeNull();
  });
});
