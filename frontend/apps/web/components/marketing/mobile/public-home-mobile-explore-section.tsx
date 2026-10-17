"use client";

import { PublicHomeMobileExploreRow } from "@/components/marketing/mobile/public-home-mobile-explore-row";
import {
  PUBLIC_HOME_COPY,
  PUBLIC_HOME_MOBILE_EXPLORE_ITEMS,
} from "@/lib/marketing/public-home-contract";

export function PublicHomeMobileExploreSection() {
  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="public-home-mobile-explore-title"
      className="scroll-mt-24"
    >
      <h2
        id="public-home-mobile-explore-title"
        className="text-2xl font-bold tracking-tight text-neutral-950"
      >
        {PUBLIC_HOME_COPY.mobileExploreTitle}
      </h2>
      <ul id="explore-reims" className="mt-4 space-y-3">
        {PUBLIC_HOME_MOBILE_EXPLORE_ITEMS.map((item) => (
          <PublicHomeMobileExploreRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
