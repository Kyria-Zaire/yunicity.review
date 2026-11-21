// @vitest-environment jsdom

import type { Neighborhood } from "@yunicity/types";
import {
  keepOfficialSectors,
  NEIGHBORHOODS_EXPLORE_ROUTE,
  resolveNeighborhoodEditorialImageCredit,
  buildNeighborhoodsDesktopGridCards,
} from "@yunicity/utils";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { NeighborhoodsDesktopGrid } from "@/components/neighborhoods/desktop/neighborhoods-desktop-grid";
import { NeighborhoodsMobileExploreRail } from "@/components/neighborhoods/mobile/neighborhoods-mobile-hub-sections";
import { NeighborhoodsExploreSkeleton } from "@/components/neighborhoods/neighborhoods-explore-skeleton";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanup);

const REIMS_OFFICIAL_SECTOR_SLUGS = [
  "saint-remi",
  "courlancy",
  "centre-ville",
  "cernay-jean-jaures",
  "clairmarais",
  "chatillons",
  "chemin-vert",
  "croix-rouge",
  "la-neuvillette",
  "orgeval",
  "maison-blanche",
  "murigny",
] as const;

const MERGED_SLUGS = ["boulingrin", "cernay", "jean-jaures"] as const;

const exploreHref = `${NEIGHBORHOODS_EXPLORE_ROUTE}?city=Reims`;

const officialNeighborhoods = REIMS_OFFICIAL_SECTOR_SLUGS.map((slug, index) => ({
  id: `hood-${index}`,
  slug,
  display_name: slug,
  is_active: true,
  cover_image_url: null,
})) as Neighborhood[];

const qaPayloadWithMerged = [
  ...officialNeighborhoods,
  ...MERGED_SLUGS.map((slug, index) => ({
    id: `merged-${index}`,
    slug,
    display_name: slug,
    is_active: true,
    cover_image_url: null,
  })),
];

const sampleCards = buildNeighborhoodsDesktopGridCards({
  city: "Reims",
  neighborhoods: officialNeighborhoods,
  events: [],
  culturalPlaces: [],
  maxItems: 12,
});

describe("CTA Voir les 12 → /neighborhoods/explore", () => {
  it("desktop grid pointe vers /neighborhoods/explore", () => {
    render(
      <NeighborhoodsDesktopGrid
        cards={sampleCards.slice(0, 2)}
        totalCount={12}
        followedSlugs={new Set()}
        onToggleFollow={() => undefined}
        seeAllHref={exploreHref}
      />,
    );
    const link = screen.getByRole("link", { name: /Voir les 12/i });
    expect(link.getAttribute("href")).toBe(exploreHref);
    expect(link.textContent).toContain("Voir les 12");
  });

  it("rail mobile pointe vers /neighborhoods/explore", () => {
    render(
      <NeighborhoodsMobileExploreRail
        cards={sampleCards.slice(0, 2)}
        totalCount={12}
        followedSlugs={new Set()}
        onToggleFollow={() => undefined}
        seeAllHref={exploreHref}
      />,
    );
    const link = screen.getByRole("link", { name: /Voir les 12/i });
    expect(link.getAttribute("href")).toBe(exploreHref);
  });

  it("aucun CTA Voir les 12 ne pointe vers /neighborhoods seul", () => {
    const { container: desktopContainer } = render(
      <NeighborhoodsDesktopGrid
        cards={sampleCards.slice(0, 2)}
        totalCount={12}
        followedSlugs={new Set()}
        onToggleFollow={() => undefined}
        seeAllHref={exploreHref}
      />,
    );
    const desktopSeeAll = Array.from(desktopContainer.querySelectorAll("a")).filter((node) =>
      node.textContent?.includes("Voir les 12"),
    );
    expect(desktopSeeAll.length).toBe(1);
    expect(desktopSeeAll[0]?.getAttribute("href")).toContain(NEIGHBORHOODS_EXPLORE_ROUTE);
    cleanup();

    const { container: mobileContainer } = render(
      <NeighborhoodsMobileExploreRail
        cards={sampleCards.slice(0, 2)}
        totalCount={12}
        followedSlugs={new Set()}
        onToggleFollow={() => undefined}
        seeAllHref={exploreHref}
      />,
    );
    const mobileSeeAll = Array.from(mobileContainer.querySelectorAll("a")).filter((node) =>
      node.textContent?.includes("Voir les 12"),
    );
    expect(mobileSeeAll.length).toBe(1);
    expect(mobileSeeAll[0]?.getAttribute("href")).not.toBe("/neighborhoods");
    expect(mobileSeeAll[0]?.getAttribute("href")).toContain(NEIGHBORHOODS_EXPLORE_ROUTE);
  });
});

describe("catalogue explore — 12 secteurs officiels", () => {
  it("keepOfficialSectors retourne exactement 12 quartiers", () => {
    const filtered = keepOfficialSectors(qaPayloadWithMerged);
    expect(filtered).toHaveLength(12);
    expect(filtered.map((hood) => hood.slug).sort()).toEqual(
      [...REIMS_OFFICIAL_SECTOR_SLUGS].sort(),
    );
  });

  it("exclut Boulingrin, Cernay et Jean-Jaurès", () => {
    const filtered = keepOfficialSectors(qaPayloadWithMerged);
    for (const merged of MERGED_SLUGS) {
      expect(filtered.some((hood) => hood.slug === merged)).toBe(false);
    }
  });

  it("buildNeighborhoodsDesktopGridCards produit 12 cartes avec liens détail", () => {
    expect(sampleCards).toHaveLength(12);
    for (const card of sampleCards) {
      expect(card.href).toMatch(/^\/neighborhoods\/[a-z0-9-]+\?city=Reims$/);
    }
  });

  it("Châtillons utilise la Tour des Argonautes", () => {
    const credit = resolveNeighborhoodEditorialImageCredit({
      slug: "chatillons",
      cover_image_url: null,
    });
    expect(credit?.commonsFile).toBe("La tour des argonautes Reims 08864.JPG");
    const chatillonsCard = sampleCards.find((card) => card.slug === "chatillons");
    expect(chatillonsCard?.imageUrl).toContain("La_tour_des_argonautes_Reims_08864.JPG");
  });
});

describe("états explore — skeleton et accessibilité", () => {
  it("affiche 12 skeletons stables pendant le chargement", () => {
    const { container } = render(<NeighborhoodsExploreSkeleton />);
    expect(container.querySelectorAll("li")).toHaveLength(12);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("CTA desktop est focusable (lien natif)", () => {
    render(
      <NeighborhoodsDesktopGrid
        cards={sampleCards.slice(0, 1)}
        totalCount={12}
        followedSlugs={new Set()}
        onToggleFollow={() => undefined}
        seeAllHref={exploreHref}
      />,
    );
    const link = screen.getByRole("link", { name: /Voir les 12/i });
    expect(link.tagName).toBe("A");
    expect(link.className).toContain("focus-visible:outline");
  });

  it("grille catalogue sans débordement horizontal explicite", () => {
    render(
      <NeighborhoodsDesktopGrid
        cards={sampleCards.slice(0, 1)}
        totalCount={12}
        followedSlugs={new Set()}
        onToggleFollow={() => undefined}
        showSectionHeader={false}
        showSeeAllLink={false}
        gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      />,
    );
    const list = document.querySelector("[data-neighborhoods-desktop-grid] ul");
    expect(list?.className).toContain("grid-cols-1");
    expect(list?.className).toContain("sm:grid-cols-2");
    expect(list?.className).toContain("xl:grid-cols-4");
  });
});
