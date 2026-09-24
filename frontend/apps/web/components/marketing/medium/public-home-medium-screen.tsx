"use client";

import { PublicHomeMediumExploreSection } from "@/components/marketing/medium/public-home-medium-explore-section";
import { PublicHomeMediumHero } from "@/components/marketing/medium/public-home-medium-hero";

export function PublicHomeMediumScreen() {
  return (
    <div className="hidden flex-col gap-12 sm:flex lg:hidden" data-public-home-medium-root="">
      <PublicHomeMediumHero />
      <PublicHomeMediumExploreSection />
    </div>
  );
}
