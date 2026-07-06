"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesFeaturedCard } from "@yunicity/utils";
import {
  TRIBES_MOBILE_CARD_MENU_ARIA,
  TRIBES_MOBILE_FEATURED_TITLE,
  TRIBES_MOBILE_VIEW_ALL,
  TRIBE_JOIN_CTA,
  TRIBES_PORTAL_MEMBERS_LABEL,
  tribeDiscoveryTheme,
} from "@yunicity/utils";
import {
  BadgeCheck,
  BookOpen,
  Camera,
  ChevronRight,
  Heart,
  MoreVertical,
  Music,
  Rocket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";

const BADGE_TONE: Record<TribesFeaturedCard["badgeVariant"], string> = {
  featured: "bg-yunicity-primary/95",
  new: "bg-sky-500/95",
  popular: "bg-emerald-500/95",
  category: "bg-violet-600/95",
};

const JOIN_TONE: Record<string, string> = {
  sport_local: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  photography: "bg-pink-50 text-pink-700 hover:bg-pink-100",
  music: "bg-violet-50 text-violet-700 hover:bg-violet-100",
  cafe_culture: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  students: "bg-sky-50 text-sky-700 hover:bg-sky-100",
  volunteering: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  association: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  other: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
};

function TribeCategoryIcon({ category }: { category: string }) {
  const theme = tribeDiscoveryTheme(category);
  const className = "h-4 w-4 text-white";
  const icons: Record<string, ReactNode> = {
    motion: <Rocket className={className} aria-hidden />,
    photo: <Camera className={className} aria-hidden />,
    culture: <Music className={className} aria-hidden />,
    heart: <Heart className={className} aria-hidden />,
    students: <Users className={className} aria-hidden />,
    music: <Music className={className} aria-hidden />,
    book: <BookOpen className={className} aria-hidden />,
    users: <Users className={className} aria-hidden />,
  };
  return <>{icons[theme.icon] ?? icons.users}</>;
}

function categoryIconBg(category: string): string {
  const theme = tribeDiscoveryTheme(category);
  if (theme.icon === "motion") return "bg-emerald-500";
  if (theme.icon === "photo") return "bg-pink-500";
  if (theme.icon === "music" || theme.icon === "culture") return "bg-violet-500";
  if (theme.icon === "students") return "bg-sky-500";
  if (theme.icon === "heart") return "bg-amber-500";
  return "bg-yunicity-primary";
}

type TribesMobileFeaturedCarouselProps = {
  cards: TribesFeaturedCard[];
};

/** Carousel « À la une » mobile Tribus (MOBILE-TRIBES-01). */
export function TribesMobileFeaturedCarousel({ cards }: TribesMobileFeaturedCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || cards.length === 0) return;
    const index = Math.round(el.scrollLeft / Math.max(el.clientWidth * 0.78, 1));
    setActiveDot(Math.min(index, cards.length - 1));
  }, [cards.length]);

  if (cards.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={TRIBES_MOBILE_FEATURED_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{TRIBES_MOBILE_FEATURED_TITLE}</h2>
        <a
          href="#tribes-mobile-suggestions"
          className="inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary"
        >
          {TRIBES_MOBILE_VIEW_ALL}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </a>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex min-w-max gap-3">
          {cards.map((card) => (
            <li key={card.id} className="w-[78vw] max-w-[18rem] shrink-0">
              <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <CulturalImage
                    src={card.imageUrl}
                    alt=""
                    placeName={card.name}
                    className="absolute inset-0 size-full"
                    sizes="288px"
                    showFallbackCaption={false}
                    overlay={false}
                  />
                  <span
                    className={`absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full ${categoryIconBg(card.iconKey)} shadow`}
                  >
                    <TribeCategoryIcon category={card.iconKey} />
                  </span>
                  <Link
                    href={card.href}
                    aria-label={TRIBES_MOBILE_CARD_MENU_ARIA}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                  >
                    <MoreVertical className="h-4 w-4" aria-hidden />
                  </Link>
                  <span
                    className={`absolute bottom-3 left-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${BADGE_TONE[card.badgeVariant]}`}
                  >
                    {card.badge}
                  </span>
                </div>

                <div className="space-y-2 p-3">
                  <div className="flex items-start gap-1.5">
                    <h3 className="line-clamp-1 flex-1 text-sm font-bold text-neutral-900">
                      {card.name}
                    </h3>
                    {card.badgeVariant === "featured" ? (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
                    ) : null}
                  </div>
                  <p className="text-xs text-neutral-500">
                    {tribeDiscoveryTheme(card.iconKey).badge} ·{" "}
                    {TRIBES_PORTAL_MEMBERS_LABEL(card.memberCount)}
                  </p>
                  <p className="line-clamp-2 text-xs leading-relaxed text-neutral-600">
                    {card.description}
                  </p>
                  <Link
                    href={card.href}
                    className={`mt-1 flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      JOIN_TONE[card.iconKey] ?? JOIN_TONE.other
                    }`}
                  >
                    {TRIBE_JOIN_CTA}
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>

      {cards.length > 1 ? (
        <div className="flex justify-center gap-1.5" aria-hidden>
          {cards.slice(0, 5).map((card, index) => (
            <span
              key={card.id}
              className={`h-1.5 rounded-full transition-all ${
                index === activeDot ? "w-4 bg-yunicity-primary" : "w-1.5 bg-neutral-300"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
