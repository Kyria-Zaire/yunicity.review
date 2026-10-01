"use client";

import { TribesDesktopJoinButton } from "@/components/tribes/desktop/tribes-desktop-join-button";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesDesktopRecommendedCard } from "@yunicity/utils";
import { TRIBES_DESKTOP_RECOMMENDED_TITLE, TRIBES_DESKTOP_RECOMMENDED_VIEW_ALL } from "@yunicity/utils";
import { Lock } from "lucide-react";
import Link from "next/link";

type TribesDesktopRecommendedGridProps = {
  city: string;
  items: TribesDesktopRecommendedCard[];
  onReload: () => void;
};

export function TribesDesktopRecommendedGrid({ city, items, onReload }: TribesDesktopRecommendedGridProps) {
  return (
    <section
      id="tribes-desktop-recommended"
      className="scroll-mt-24 space-y-4"
      aria-labelledby="tribes-desktop-recommended-title"
      data-tribes-desktop-recommended=""
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="tribes-desktop-recommended-title" className="text-lg font-bold text-neutral-900">
          {TRIBES_DESKTOP_RECOMMENDED_TITLE}
        </h2>
        {items.length > 0 ? (
          <Link
            href={`/tribes?city=${encodeURIComponent(city)}#tribes-desktop-recommended`}
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
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <Link href={item.href} className="block">
                  <div className="relative aspect-[4/3] bg-neutral-200">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.name}
                      className="absolute inset-0 size-full"
                      sizes="(max-width: 1280px) 50vw, 280px"
                      showFallbackCaption={false}
                      dimOverlay={false}
                    />
                    <span
                      className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.visibilityTone}`}
                    >
                      {item.visibilityBadge === "SUR DEMANDE" ? (
                        <Lock className="h-3 w-3" aria-hidden />
                      ) : null}
                      {item.visibilityBadge}
                    </span>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={item.href}
                      className="line-clamp-2 text-base font-bold leading-snug text-neutral-900 hover:text-yunicity-primary"
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
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
