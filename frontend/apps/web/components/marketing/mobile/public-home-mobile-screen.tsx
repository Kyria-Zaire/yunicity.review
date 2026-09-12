"use client";

import { PublicHomeMobileExploreSection } from "@/components/marketing/mobile/public-home-mobile-explore-section";
import { PublicHomeMobileHero } from "@/components/marketing/mobile/public-home-mobile-hero";

export function PublicHomeMobileScreen() {
  return (
    <div className="flex flex-col gap-10 sm:hidden" data-public-home-mobile-root="">
      <PublicHomeMobileHero />
      <PublicHomeMobileExploreSection />
    </div>
  );
}
