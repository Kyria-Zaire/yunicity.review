"use client";

import { CreatorContentCard } from "@/components/creators/creator-content-card";
import { CreatorPublicShell } from "@/components/creators/creator-public-shell";
import { CreatorContentDetailError } from "@/components/creators/creator-content-detail-error";
import { CreatorContentDetailNotFound } from "@/components/creators/creator-content-detail-not-found";
import { CreatorContentDetailSkeleton } from "@/components/creators/creator-content-detail-skeleton";
import { CulturalImage } from "@/components/culture/cultural-image";
import { useCreatorContentDetail } from "@/hooks/use-creator-content-detail";
import {
  CREATOR_DETAIL_BACK,
  CREATOR_DETAIL_EMPTY_BODY,
  CREATOR_DETAIL_RELATED_TITLE,
  CREATOR_DIRECTORY_DISCOVER_LINK,
  formatContentAuthor,
  formatCreatorContentBody,
  formatCreatorPublishedAt,
  formatCreatorContentType,
  formatReadingTime,
  getCreatorContentDetailBackHref,
  getCreatorDirectoryHref,
  getCreatorProfileHref,
  hasCreatorCover,
} from "@yunicity/utils";
import type { CreatorPublicDetailResponse } from "@yunicity/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type CreatorContentDetailScreenProps = {
  contentId: string;
};

export function CreatorContentDetailScreen({ contentId }: CreatorContentDetailScreenProps) {
  const { state, reload } = useCreatorContentDetail(contentId);

  return (
    <CreatorPublicShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <nav className="mb-8 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href={getCreatorContentDetailBackHref()}
            className="inline-flex items-center gap-2 font-medium text-neutral-600 transition-colors hover:text-yunicity-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {CREATOR_DETAIL_BACK}
          </Link>
          <Link
            href={getCreatorDirectoryHref()}
            className="font-semibold text-yunicity-primary hover:underline"
          >
            {CREATOR_DIRECTORY_DISCOVER_LINK}
          </Link>
        </nav>

        {state.status === "loading" ? (
          <CreatorContentDetailSkeleton />
        ) : state.status === "error" ? (
          <CreatorContentDetailError onRetry={() => void reload()} />
        ) : state.status === "not_found" ? (
          <CreatorContentDetailNotFound />
        ) : (
          <CreatorContentDetailView detail={state.detail} />
        )}
      </div>
    </CreatorPublicShell>
  );
}

function CreatorContentDetailView({ detail }: { detail: CreatorPublicDetailResponse }) {
  const authorLabel = formatContentAuthor(detail.author);
  const dateLabel = formatCreatorPublishedAt(detail.published_at);
  const typeLabel = formatCreatorContentType(detail.content_type);
  const readingTime = formatReadingTime(detail.body);
  const { paragraphs, isEmpty } = formatCreatorContentBody(detail.body);
  const showCover = hasCreatorCover(detail.cover);
  const related = detail.related ?? [];

  return (
    <article>
      <header className="max-w-prose">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500">
          <span className="rounded-full bg-yunicity-primary/10 px-2.5 py-0.5 text-yunicity-primary">
            {typeLabel}
          </span>
          <span>{detail.city}</span>
          {dateLabel ? <span>{dateLabel}</span> : null}
          <span>{readingTime} de lecture</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {detail.title}
        </h1>
        <p className="mt-3 text-sm font-medium text-neutral-700">
          <Link
            href={getCreatorProfileHref(detail.author.organization_id)}
            className="transition-colors hover:text-yunicity-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
          >
            {authorLabel}
          </Link>
        </p>
      </header>

      <div className="mt-8">
        {showCover && detail.cover ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100">
            <CulturalImage
              src={detail.cover}
              alt={detail.title}
              placeName={detail.city}
              className="absolute inset-0 h-full w-full object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        ) : (
          <div
            className="flex aspect-[16/9] w-full items-end rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-100 via-white to-yunicity-primary/5 p-6"
            aria-hidden
          >
            <p className="text-sm font-medium text-neutral-500">{detail.city}</p>
          </div>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-prose">
        {isEmpty ? (
          <p className="text-sm leading-relaxed text-neutral-500">{CREATOR_DETAIL_EMPTY_BODY}</p>
        ) : (
          <div className="space-y-5 text-base leading-relaxed text-neutral-800">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-neutral-200/80 pt-10" aria-label={CREATOR_DETAIL_RELATED_TITLE}>
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">
            {CREATOR_DETAIL_RELATED_TITLE}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <CreatorContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
