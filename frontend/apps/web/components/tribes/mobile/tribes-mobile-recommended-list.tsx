"use client";

import { TribesDesktopJoinButton } from "@/components/tribes/desktop/tribes-desktop-join-button";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesDesktopRecommendedCard } from "@yunicity/utils";
import { TRIBES_DESKTOP_RECOMMENDED_TITLE, TRIBES_DESKTOP_RECOMMENDED_VIEW_ALL } from "@yunicity/utils";
import { Lock } from "lucide-react";
import Link from "next/link";

type TribesMobileRecommendedListProps = {
  city: string;
  items: TribesDesktopRecommendedCard[];
  onReload: () => void;
};

export function TribesMobileRecommendedList({ city, items, onReload }: TribesMobileRecommendedListProps) {
  return (
    <section
      id="tribes-mobile-recommended"
      className="space-y-3"
      aria-labelledby="tribes-mobile-recommended-title"
      data-tribes-mobile-recommended=""
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="tribes-mobile-recommended-title" className="text-base font-bold text-neutral-900">
          {TRIBES_DESKTOP_RECOMMENDED_TITLE}
        </h2>
        {items.length > 0 ? (
          <Link
            href={`/tribes?city=${encodeURIComponent(city)}#tribes-mobile-recommended`}
            className="text-sm font-semibold text-yunicity-primary"
          >
            {TRIBES_DESKTOP_RECOMMENDED_VIEW_ALL}
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center">
          <p className="text-sm text-neutral-600">Aucune tribu ne correspond à vos filtres.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <Link href={item.href} className="block">
                  <div className="relative aspect-[16/10] bg-neutral-200">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.name}
                      className="absolute inset-0 size-full"
                      sizes="100vw"
                      showFallbackCaption={false}
                      dimOverlay={false}
                    />
                  </div>
                </Link>
                <div className="space-y-3 p-4">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.visibilityTone}`}
                    >
                      {item.visibilityBadge === "SUR DEMANDE" || item.visibilityBadge === "Sur demande" ? (
                        <Lock className="h-3 w-3" aria-hidden />
                      ) : null}
                      {item.visibilityBadge}
                    </span>
                    <Link
                      href={item.href}
                      className="mt-2 block text-base font-bold leading-snug text-neutral-900"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs font-medium text-neutral-500">{item.tagsLine}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{item.statusLine}</p>
                  </div>
                  <TribesDesktopJoinButton
                    city={city}
                    slug={item.slug}
                    viewerIsMember={item.viewerIsMember}
                    isPrivateInvite={item.isPrivateInvite}
                    viewerHasPendingJoinRequest={false}
                    onSuccess={onReload}
                  />
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
