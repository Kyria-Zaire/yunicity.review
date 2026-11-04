"use client";

import { TribesDesktopJoinButton } from "@/components/tribes/desktop/tribes-desktop-join-button";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesDesktopRecommendedCard } from "@yunicity/utils";
import { TRIBES_DESKTOP_RECOMMENDED_TITLE, TRIBES_DESKTOP_RECOMMENDED_VIEW_ALL } from "@yunicity/utils";
import { Lock } from "lucide-react";
import Link from "next/link";

type TribesMediumRecommendedGridProps = {
  city: string;
  items: TribesDesktopRecommendedCard[];
  onReload: () => void;
};

export function TribesMediumRecommendedGrid({ city, items, onReload }: TribesMediumRecommendedGridProps) {
  return (
    <section
      id="tribes-medium-recommended"
      className="scroll-mt-24 space-y-4"
      aria-labelledby="tribes-medium-recommended-title"
      data-tribes-medium-recommended=""
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="tribes-medium-recommended-title" className="text-lg font-bold text-neutral-900">
          {TRIBES_DESKTOP_RECOMMENDED_TITLE}
        </h2>
        {items.length > 0 ? (
          <Link
            href={`/tribes?city=${encodeURIComponent(city)}#tribes-medium-recommended`}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBES_DESKTOP_RECOMMENDED_VIEW_ALL}
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center">
          <p className="text-sm text-neutral-600">Aucune tribu ne correspond à vos filtres.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
                  <Link href={item.href} className="relative block shrink-0 sm:w-[42%]">
                    <div className="relative aspect-[4/3] bg-neutral-200 sm:aspect-auto sm:h-full sm:min-h-[140px]">
                      <CulturalImage
                        src={item.imageUrl}
                        alt=""
                        placeName={item.name}
                        className="absolute inset-0 size-full"
                        sizes="(max-width: 768px) 100vw, 200px"
                        showFallbackCaption={false}
                        dimOverlay={false}
                      />
                    </div>
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.visibilityTone}`}
                      >
                        {item.visibilityBadge === "SUR DEMANDE" ? (
                          <Lock className="h-3 w-3" aria-hidden />
                        ) : null}
                        {item.visibilityBadge}
                      </span>
                      <Link
                        href={item.href}
                        className="mt-2 line-clamp-2 block text-base font-bold leading-snug text-neutral-900 hover:text-yunicity-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs font-medium text-neutral-500">{item.tagsLine}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600">{item.statusLine}</p>
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
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
