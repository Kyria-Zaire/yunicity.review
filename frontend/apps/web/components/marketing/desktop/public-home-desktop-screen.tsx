"use client";

import { PublicHomeDesktopExploreSection } from "@/components/marketing/desktop/public-home-desktop-explore-section";
import { PublicHomeDesktopHero } from "@/components/marketing/desktop/public-home-desktop-hero";

export function PublicHomeDesktopScreen() {
  return (
    <div className="hidden flex-col gap-20 lg:flex" data-public-home-desktop-root="">
      <PublicHomeDesktopHero />
      <PublicHomeDesktopExploreSection />
    </div>
  );
}
