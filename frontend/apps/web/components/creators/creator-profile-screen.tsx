"use client";

import { CreatorContentCard } from "@/components/creators/creator-content-card";
import { CreatorPublicShell } from "@/components/creators/creator-public-shell";
import { CreatorProfileError } from "@/components/creators/creator-profile-error";
import { CreatorProfileNotFound } from "@/components/creators/creator-profile-not-found";
import { CreatorProfileSkeleton } from "@/components/creators/creator-profile-skeleton";
import { CulturalImage } from "@/components/culture/cultural-image";
import { useCreatorProfile } from "@/hooks/use-creator-profile";
import type { CreatorPublicProfile } from "@yunicity/types";
import {
  CREATOR_DIRECTORY_DISCOVER_LINK,
  CREATOR_PROFILE_BACK,
  CREATOR_PROFILE_CONTENTS_EMPTY,
  CREATOR_PROFILE_CONTENTS_TITLE,
  formatCreatorProfileStats,
  formatCreatorProfileTerritory,
  getCreatorDirectoryHref,
  getCreatorProfileBackHref,
  hasCreatorCover,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type CreatorProfileScreenProps = {
  creatorId: string;
};

export function CreatorProfileScreen({ creatorId }: CreatorProfileScreenProps) {
  const { state, reload } = useCreatorProfile(creatorId);

  return (
    <CreatorPublicShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <nav className="mb-8 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href={getCreatorProfileBackHref()}
            className="inline-flex items-center gap-2 font-medium text-neutral-600 transition-colors hover:text-yunicity-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {CREATOR_PROFILE_BACK}
          </Link>
          <Link
            href={getCreatorDirectoryHref()}
            className="font-semibold text-yunicity-primary hover:underline"
          >
            {CREATOR_DIRECTORY_DISCOVER_LINK}
          </Link>
        </nav>

        {state.status === "loading" ? (
          <CreatorProfileSkeleton />
        ) : state.status === "error" ? (
          <CreatorProfileError onRetry={() => void reload()} />
        ) : state.status === "not_found" ? (
          <CreatorProfileNotFound />
        ) : (
          <CreatorProfileView profile={state.profile} />
        )}
      </div>
    </CreatorPublicShell>
  );
}

function CreatorProfileView({ profile }: { profile: CreatorPublicProfile }) {
  const territoryLabel = formatCreatorProfileTerritory(profile.territory);
  const statsLabel = formatCreatorProfileStats(profile.stats.published_content_count);
  const showBanner = hasCreatorCover(profile.banner_url);
  const showLogo = hasCreatorCover(profile.logo_url);
  const contents = profile.contents ?? [];

  return (
    <div>
      <header>
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
          {showBanner && profile.banner_url ? (
            <div className="relative aspect-[21/9] w-full bg-neutral-100">
              <CulturalImage
                src={profile.banner_url}
                alt=""
                placeName={profile.territory.city}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </div>
          ) : (
            <div
              className="aspect-[21/9] w-full bg-gradient-to-br from-neutral-100 via-white to-yunicity-primary/10"
              aria-hidden
            />
          )}

          <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:gap-6">
              {showLogo && profile.logo_url ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md sm:h-24 sm:w-24">
                  <CulturalImage
                    src={profile.logo_url}
                    alt={profile.display_name}
                    placeName={profile.territory.city}
                    className="absolute inset-0 h-full w-full object-cover"
                    sizes="96px"
                  />
                </div>
              ) : (
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-yunicity-primary/10 text-2xl font-bold text-yunicity-primary shadow-md sm:h-24 sm:w-24"
                  aria-hidden
                >
                  {profile.display_name.trim().charAt(0).toUpperCase() || "C"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">
                  Créateur·rice local·e
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                  {profile.display_name}
                </h1>
                {territoryLabel ? (
                  <p className="mt-2 text-sm font-medium text-neutral-600">{territoryLabel}</p>
                ) : null}
                <p className="mt-2 text-sm text-neutral-500">{statsLabel}</p>
              </div>
            </div>

            {profile.description?.trim() ? (
              <p className="mt-6 max-w-3xl text-sm leading-relaxed text-neutral-700 sm:text-base">
                {profile.description.trim()}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <section className="mt-12" aria-label={CREATOR_PROFILE_CONTENTS_TITLE}>
        <h2 className="text-lg font-bold tracking-tight text-neutral-900">
          {CREATOR_PROFILE_CONTENTS_TITLE}
        </h2>

        {contents.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-6 py-12 text-center">
            <p className="text-sm text-neutral-600">{CREATOR_PROFILE_CONTENTS_EMPTY}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {contents.map((item) => (
              <CreatorContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
