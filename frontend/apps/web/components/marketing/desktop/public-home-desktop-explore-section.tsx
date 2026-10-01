"use client";

import { PublicHomeDesktopExploreCard } from "@/components/marketing/desktop/public-home-desktop-explore-card";
import { PUBLIC_HOME_COPY, PUBLIC_HOME_EXPLORE_CARDS } from "@/lib/marketing/public-home-contract";

export function PublicHomeDesktopExploreSection() {
  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="public-home-explore-title"
      className="scroll-mt-28 pt-4"
    >
      <h2
        id="public-home-explore-title"
        className="text-center text-3xl font-bold tracking-tight text-neutral-950"
      >
        {PUBLIC_HOME_COPY.exploreTitle}
      </h2>
      <div id="explore-reims" className="mt-10 grid gap-6 lg:grid-cols-3">
        {PUBLIC_HOME_EXPLORE_CARDS.map((card) => (
          <PublicHomeDesktopExploreCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
