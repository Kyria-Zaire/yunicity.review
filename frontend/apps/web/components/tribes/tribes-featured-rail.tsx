"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesFeaturedCard } from "@yunicity/utils";
import {
  TRIBES_PORTAL_FEATURED_CTA,
  TRIBES_PORTAL_FEATURED_TITLE,
  TRIBES_PORTAL_MEETUPS_WEEK_LABEL,
  TRIBES_PORTAL_MEMBERS_LABEL,
  tribeDiscoveryTheme,
} from "@yunicity/utils";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Heart,
  Music,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const CARD_WIDTH = 240;
const CARD_GAP = 16;

const BADGE_TONES: Record<TribesFeaturedCard["badgeVariant"], string> = {
  featured: "bg-pink-500/90 text-white",
  new: "bg-sky-500/90 text-white",
  popular: "bg-emerald-500/90 text-white",
  category: "bg-violet-500/90 text-white",
};

type TribesFeaturedRailProps = {
  cards: TribesFeaturedCard[];
  city: string;
};

function TribeCardIcon({ category }: { category: string }) {
  const theme = tribeDiscoveryTheme(category);
  const className = "h-5 w-5 text-white";
  switch (theme.icon) {
    case "photo":
      return <Users className={className} aria-hidden />;
    case "music":
      return <Music className={className} aria-hidden />;
    case "heart":
      return <Heart className={className} aria-hidden />;
    case "book":
      return <Coffee className={className} aria-hidden />;
    default:
      return <Users className={className} aria-hidden />;
  }
}

export function TribesFeaturedRail({ cards, city }: TribesFeaturedRailProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    setCanScrollPrev(node.scrollLeft > 8);
    setCanScrollNext(node.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [cards, updateScrollState]);

  if (cards.length === 0) return null;

  function scrollByCards(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({
      left: direction * (CARD_WIDTH + CARD_GAP) * 2,
      behavior: "smooth",
    });
  }

  return (
    <section
      id="tribes-featured"
      className="min-w-0 scroll-mt-24 space-y-4"
      aria-labelledby="tribes-featured-title"
    >
      <div className="flex items-end justify-between gap-3">
        <h2 id="tribes-featured-title" className="text-xl font-bold text-neutral-900">
          {TRIBES_PORTAL_FEATURED_TITLE}
        </h2>
        <Link
          href={`/tribes?city=${encodeURIComponent(city)}&view=featured`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {TRIBES_PORTAL_FEATURED_CTA}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="relative min-w-0">
        {canScrollPrev ? (
          <button
            type="button"
            aria-label="Tribus précédentes"
            onClick={() => scrollByCards(-1)}
            className="absolute -left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-md transition hover:bg-neutral-50 sm:inline-flex"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        ) : null}

        <ul
          ref={scrollerRef}
          onScroll={updateScrollState}
          className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cards.map((card) => (
            <li key={card.id} className="w-[240px] shrink-0">
              <Link
                href={card.href}
                className="group relative block h-[320px] overflow-hidden rounded-2xl border border-neutral-200/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <CulturalImage
                  src={card.imageUrl}
                  alt={card.name}
                  placeName={card.name}
                  className="absolute inset-0"
                  imageClassName="transition duration-300 group-hover:scale-[1.03]"
                  sizes="240px"
                  showFallbackCaption={false}
                  overlay={false}
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"
                  aria-hidden
                />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${BADGE_TONES[card.badgeVariant]}`}
                >
                  {card.badge}
                </span>
                <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white/90 backdrop-blur-sm">
                  <Bookmark className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Favori — bientôt</span>
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                    <TribeCardIcon category={card.iconKey} />
                  </span>
                  <h3 className="mt-3 text-lg font-bold leading-snug">{card.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/85">
                    {card.description}
                  </p>
                  <div className="mt-3 space-y-1 text-[11px] text-white/75">
                    <p>{TRIBES_PORTAL_MEMBERS_LABEL(card.memberCount)}</p>
                    <p>{TRIBES_PORTAL_MEETUPS_WEEK_LABEL(card.meetupsThisWeek)}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {canScrollNext ? (
          <button
            type="button"
            aria-label="Tribus suivantes"
            onClick={() => scrollByCards(1)}
            className="absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-md transition hover:bg-neutral-50 sm:inline-flex"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </section>
  );
}
