"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { CreatorPublicContent } from "@yunicity/types";
import {
  formatContentAuthor,
  formatCreatorContentTypeLabel,
  formatCreatorPublishedAt,
  formatReadingTime,
  getCreatorContentDetailHref,
  hasCreatorCover,
} from "@yunicity/utils";
import Link from "next/link";

type CreatorContentCardProps = {
  item: CreatorPublicContent;
};

export function CreatorContentCard({ item }: CreatorContentCardProps) {
  const authorLabel = formatContentAuthor(item.author);
  const publishedLabel = formatCreatorPublishedAt(item.published_at);
  const readingTime = formatReadingTime(item.body);
  const typeLabel = formatCreatorContentTypeLabel(item.content_type);
  const showCover = hasCreatorCover(item.cover);
  const href = getCreatorContentDetailHref(item.id);

  return (
    <Link
      href={href}
      className="group block h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition-shadow group-hover:shadow-md group-hover:ring-1 group-hover:ring-yunicity-primary/15">
        {showCover && item.cover ? (
          <div className="relative aspect-[16/10] w-full bg-neutral-100">
            <CulturalImage
              src={item.cover}
              alt={item.title}
              placeName={item.city}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : null}
        <div className="flex flex-1 flex-col px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500">
            <span className="rounded-full bg-yunicity-primary/10 px-2.5 py-0.5 text-yunicity-primary">
              {typeLabel}
            </span>
            <span>{item.city}</span>
            {publishedLabel ? <span>{publishedLabel}</span> : null}
            <span>{readingTime} de lecture</span>
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-neutral-900 group-hover:text-yunicity-primary">
            {item.title}
          </h2>
          <p className="mt-2 text-sm font-medium text-neutral-700">{authorLabel}</p>
        </div>
      </article>
    </Link>
  );
}
