"use client";

import type { PublicHomeExploreCard } from "@/lib/marketing/public-home-contract";
import { ChevronRight, Home, MapPin, Store, Users } from "lucide-react";
import Link from "next/link";

const CARD_STYLES: Record<
  PublicHomeExploreCard["id"],
  { iconWrap: string; iconColor: string }
> = {
  neighborhoods: {
    iconWrap: "bg-blue-50",
    iconColor: "text-yunicity-primary",
  },
  tribes: {
    iconWrap: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  places: {
    iconWrap: "bg-teal-50",
    iconColor: "text-teal-600",
  },
};

function CardIcon({ icon }: { icon: PublicHomeExploreCard["icon"] }) {
  const className = "h-5 w-5";
  if (icon === "neighborhoods") return <MapPin className={className} aria-hidden />;
  if (icon === "tribes") return <Users className={className} aria-hidden />;
  if (icon === "places") return <Store className={className} aria-hidden />;
  return <Home className={className} aria-hidden />;
}

type PublicHomeMediumExploreCardProps = {
  card: PublicHomeExploreCard;
};

export function PublicHomeMediumExploreCard({ card }: PublicHomeMediumExploreCardProps) {
  const styles = CARD_STYLES[card.id];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
      <span
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${styles.iconWrap} ${styles.iconColor}`}
      >
        <CardIcon icon={card.icon} />
      </span>
      <h3 className="mt-4 text-lg font-bold text-neutral-950">{card.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{card.body}</p>
      <Link
        href={card.href}
        aria-label={card.title}
        data-public-home-control={`preview-${card.id}`}
        className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {card.linkLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}
