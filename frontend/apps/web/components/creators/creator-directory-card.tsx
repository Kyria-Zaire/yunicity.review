"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { CreatorPublicDirectoryItem } from "@yunicity/types";
import {
  CREATOR_DIRECTORY_VIEW_PROFILE,
  formatCreatorDirectoryItem,
  hasCreatorCover,
} from "@yunicity/utils";
import Link from "next/link";

type CreatorDirectoryCardProps = {
  item: CreatorPublicDirectoryItem;
};

export function CreatorDirectoryCard({ item }: CreatorDirectoryCardProps) {
  const view = formatCreatorDirectoryItem(item);
  const showLogo = hasCreatorCover(view.logoUrl);

  return (
    <Link
      href={view.profileHref}
      className="group block h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
    >
      <article className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm transition-shadow group-hover:shadow-md group-hover:ring-1 group-hover:ring-yunicity-primary/15">
        <div className="flex items-start gap-4">
          {showLogo && view.logoUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
              <CulturalImage
                src={view.logoUrl}
                alt={view.displayName}
                placeName={item.territory.city}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="56px"
              />
            </div>
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yunicity-primary/10 text-lg font-bold text-yunicity-primary"
              aria-hidden
            >
              {view.displayName.trim().charAt(0).toUpperCase() || "C"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {view.badgeLabel ? (
                <span className="rounded-full bg-yunicity-primary/10 px-2.5 py-0.5 text-xs font-medium text-yunicity-primary">
                  {view.badgeLabel}
                </span>
              ) : null}
              <span className="text-xs font-medium text-neutral-500">
                {view.publishedCountLabel}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold tracking-tight text-neutral-900 group-hover:text-yunicity-primary">
              {view.displayName}
            </h2>
            {view.territoryLabel ? (
              <p className="mt-1 text-sm font-medium text-neutral-600">{view.territoryLabel}</p>
            ) : null}
          </div>
        </div>

        {view.bioExcerpt ? (
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-neutral-600">
            {view.bioExcerpt}
          </p>
        ) : null}

        <p className="mt-auto pt-5 text-sm font-semibold text-yunicity-primary">
          {CREATOR_DIRECTORY_VIEW_PROFILE}
        </p>
      </article>
    </Link>
  );
}
