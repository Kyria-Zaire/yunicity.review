"use client";

import { TribesDesktopFeaturedSpotlight } from "@/components/tribes/desktop/tribes-desktop-featured-spotlight";
import { TribesDesktopHeroHeader } from "@/components/tribes/desktop/tribes-desktop-hero-header";
import type { TribesDesktopCategoryId, TribesDesktopSpotlightCard } from "@yunicity/utils";

type TribesDesktopHeroSectionProps = {
  city: string;
  searchQuery: string;
  activeCategory: TribesDesktopCategoryId;
  spotlight: TribesDesktopSpotlightCard | null;
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: TribesDesktopCategoryId) => void;
  onReload: () => void;
};

/** Section hero desktop — en-tête éditorial + spotlight (DESKTOP-TRIBUS-01). */
export function TribesDesktopHeroSection({
  city,
  searchQuery,
  activeCategory,
  spotlight,
  onSearchChange,
  onCategoryChange,
  onReload,
}: TribesDesktopHeroSectionProps) {
  return (
    <section className="tribes-desktop-hero space-y-6" aria-label="Découvrir les tribus" data-tribes-desktop-hero="">
      <TribesDesktopHeroHeader
        city={city}
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        onSearchChange={onSearchChange}
        onCategoryChange={onCategoryChange}
      />
      <TribesDesktopFeaturedSpotlight city={city} spotlight={spotlight} onReload={onReload} />
    </section>
  );
}
