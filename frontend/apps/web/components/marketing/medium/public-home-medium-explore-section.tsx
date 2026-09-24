"use client";

import { PublicHomeMediumExploreCard } from "@/components/marketing/medium/public-home-medium-explore-card";
import { PUBLIC_HOME_COPY, PUBLIC_HOME_EXPLORE_CARDS } from "@/lib/marketing/public-home-contract";

export function PublicHomeMediumExploreSection() {
  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="public-home-medium-explore-title"
      className="scroll-mt-24 border-t border-neutral-200/80 pt-10"
    >
      <h2
        id="public-home-medium-explore-title"
        className="text-2xl font-bold tracking-tight text-neutral-950 md:text-3xl"
      >
        {PUBLIC_HOME_COPY.exploreTitle}
      </h2>
      <div id="explore-reims" className="mt-6 grid gap-4 sm:grid-cols-3">
        {PUBLIC_HOME_EXPLORE_CARDS.map((card) => (
          <PublicHomeMediumExploreCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
