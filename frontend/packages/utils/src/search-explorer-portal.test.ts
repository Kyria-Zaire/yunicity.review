import { describe, expect, it } from "vitest";

import type { CulturalPlaceListItem } from "@yunicity/types";

import {
  buildExplorerCategoryCards,
  buildExplorerSuggestions,
  countPlacesForExplorerCategory,
  filterCatalogForExplorerCategory,
} from "./search-explorer-portal";

const place = (category: string, slug: string): CulturalPlaceListItem =>
  ({
    id: slug,
    slug,
    name: slug,
    category,
    city: "Reims",
    address: "Reims",
    short_description: "",
    latitude: 49.25,
    longitude: 4.03,
    image_url: null,
    hero_image_url: null,
    thumbnail_image_url: null,
    gallery_images: [],
    editorial_excerpt: null,
    photo_credit: null,
    image_source: null,
    image_alt: null,
    source_name: "seed",
    image_credit: null,
    neighborhood: null,
  }) as CulturalPlaceListItem;

describe("search-explorer-portal", () => {
  const catalog = [
    place("museum", "musee"),
    place("park", "parc"),
    place("cathedral", "cathedrale"),
  ];

  it("compte les lieux par catégorie explorer", () => {
    expect(countPlacesForExplorerCategory(catalog, "all")).toBe(3);
    expect(countPlacesForExplorerCategory(catalog, "culture")).toBe(1);
    expect(countPlacesForExplorerCategory(catalog, "nature")).toBe(1);
    expect(countPlacesForExplorerCategory(catalog, "heritage")).toBe(1);
  });

  it("filtre le catalogue pour une catégorie", () => {
    expect(filterCatalogForExplorerCategory(catalog, "nature")).toHaveLength(1);
    expect(filterCatalogForExplorerCategory(catalog, "nature")[0]?.slug).toBe("parc");
  });

  it("construit des cartes catégories sans métriques inventées", () => {
    const cards = buildExplorerCategoryCards(catalog, 2, "Reims");
    expect(cards.some((c) => c.id === "events")).toBe(true);
    expect(cards.every((c) => !c.countLabel.includes("4,7"))).toBe(true);
  });

  it("construit des suggestions lieux et moments", () => {
    const suggestions = buildExplorerSuggestions({
      city: "Reims",
      catalog,
      events: [
        {
          id: "e1",
          title: "Concert",
          starts_at: new Date(Date.now() + 86_400_000).toISOString(),
          ends_at: null,
          is_cancelled: false,
          city: "Reims",
          location_name: "Centre",
        } as never,
      ],
      categoryId: "all",
      limit: 6,
    });
    expect(suggestions.some((s) => s.kind === "event")).toBe(true);
    expect(suggestions.some((s) => s.kind === "place")).toBe(true);
  });
});
