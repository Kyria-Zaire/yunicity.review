// @vitest-environment jsdom

import {
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_ERROR,
  NEIGHBORHOODS_RETRY,
} from "@yunicity/utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NeighborhoodsPortalKicker } from "@/components/neighborhoods/shared/neighborhoods-portal-kicker";
import { NeighborhoodsExploreScreen } from "@/components/neighborhoods/neighborhoods-explore-screen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockUseNeighborhoodsPortalContext = vi.fn();

vi.mock("@/hooks/use-neighborhoods-portal-context", () => ({
  useNeighborhoodsPortalContext: () => mockUseNeighborhoodsPortalContext(),
}));

vi.mock("@/components/neighborhoods/neighborhoods-app-shell", () => ({
  NeighborhoodsAppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("city=Reims"),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const officialNeighborhood = {
  id: "hood-1",
  slug: "chatillons",
  display_name: "Châtillons",
  is_active: true,
  cover_image_url: null,
};

describe("NeighborhoodsPortalKicker — portail", () => {
  it("masque la valeur pendant le chargement", () => {
    const { container } = render(
      <NeighborhoodsPortalKicker city="Reims" count={0} loading />,
    );
    expect(container.textContent).not.toMatch(/0 QUARTIER/);
    expect(container.querySelector("[data-loading]")).toBeTruthy();
  });

  it("affiche REIMS · 12 QUARTIERS une fois chargé", () => {
    render(<NeighborhoodsPortalKicker city="Reims" count={12} loading={false} />);
    expect(screen.getByText("REIMS · 12 QUARTIERS")).toBeTruthy();
  });

  it("affiche REIMS · 1 QUARTIER pour un seul résultat", () => {
    render(<NeighborhoodsPortalKicker city="Reims" count={1} loading={false} />);
    expect(screen.getByText("REIMS · 1 QUARTIER")).toBeTruthy();
  });
});

describe("NeighborhoodsExploreScreen — états API", () => {
  beforeEach(() => {
    mockUseNeighborhoodsPortalContext.mockReturnValue({
      city: "Reims",
      loading: false,
      error: false,
      neighborhoods: [],
      events: [],
      culturalPlaces: [],
      tribes: [],
      passportOffers: [],
      reload: vi.fn(),
    });
  });

  it("loading : skeleton sans compteur 0 quartier", () => {
    mockUseNeighborhoodsPortalContext.mockReturnValue({
      city: "Reims",
      loading: true,
      error: false,
      neighborhoods: [],
      events: [],
      culturalPlaces: [],
      tribes: [],
      passportOffers: [],
      reload: vi.fn(),
    });
    const { container } = render(<NeighborhoodsExploreScreen />);
    expect(container.textContent).not.toMatch(/0 quartier/i);
    expect(screen.queryByText("0 quartiers")).toBeNull();
    expect(container.querySelector("[data-neighborhoods-explore-skeleton]")).toBeTruthy();
    expect(screen.queryByTestId("neighborhoods-explore-count")).toBeNull();
  });

  it("erreur API : message + bouton Réessayer", () => {
    mockUseNeighborhoodsPortalContext.mockReturnValue({
      city: "Reims",
      loading: false,
      error: true,
      neighborhoods: [],
      events: [],
      culturalPlaces: [],
      tribes: [],
      passportOffers: [],
      reload: vi.fn(),
    });
    render(<NeighborhoodsExploreScreen />);
    expect(screen.getByRole("alert").textContent).toContain(NEIGHBORHOODS_ERROR);
    expect(screen.getByRole("button", { name: NEIGHBORHOODS_RETRY })).toBeTruthy();
  });

  it("clic Réessayer relance reload", () => {
    const reload = vi.fn();
    mockUseNeighborhoodsPortalContext.mockReturnValue({
      city: "Reims",
      loading: false,
      error: true,
      neighborhoods: [],
      events: [],
      culturalPlaces: [],
      tribes: [],
      passportOffers: [],
      reload,
    });
    render(<NeighborhoodsExploreScreen />);
    fireEvent.click(screen.getByRole("button", { name: NEIGHBORHOODS_RETRY }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("état vide réel après requête terminée", () => {
    render(<NeighborhoodsExploreScreen />);
    expect(screen.getByText(NEIGHBORHOODS_EMPTY)).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("affiche 12 quartiers après résolution", () => {
    mockUseNeighborhoodsPortalContext.mockReturnValue({
      city: "Reims",
      loading: false,
      error: false,
      neighborhoods: Array.from({ length: 12 }, (_, index) => ({
        ...officialNeighborhood,
        id: `hood-${index}`,
        slug: `sector-${index}`,
        display_name: `Secteur ${index}`,
      })),
      events: [],
      culturalPlaces: [],
      tribes: [],
      passportOffers: [],
      reload: vi.fn(),
    });
    render(<NeighborhoodsExploreScreen />);
    expect(screen.getByText("12 quartiers")).toBeTruthy();
    expect(document.querySelectorAll("[data-neighborhoods-desktop-grid] li")).toHaveLength(12);
  });

  it("affiche 1 quartier au singulier sur explore", () => {
    mockUseNeighborhoodsPortalContext.mockReturnValue({
      city: "Reims",
      loading: false,
      error: false,
      neighborhoods: [officialNeighborhood],
      events: [],
      culturalPlaces: [],
      tribes: [],
      passportOffers: [],
      reload: vi.fn(),
    });
    render(<NeighborhoodsExploreScreen />);
    expect(screen.getByText("1 quartier")).toBeTruthy();
  });
});
