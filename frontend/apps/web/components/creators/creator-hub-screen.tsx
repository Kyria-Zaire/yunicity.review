"use client";

import { CreatorContentCard } from "@/components/creators/creator-content-card";
import { CreatorHubSkeleton } from "@/components/creators/creator-hub-skeleton";
import { useCreatorHub } from "@/hooks/use-creator-hub";
import {
  CREATOR_DIRECTORY_DISCOVER_LINK,
  CREATOR_HUB_EMPTY,
  CREATOR_HUB_ERROR,
  CREATOR_HUB_RETRY,
  CREATOR_HUB_SUBTITLE,
  CREATOR_HUB_TITLE,
  getCreatorDirectoryHref,
} from "@yunicity/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function CreatorHubScreen() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const { city, items, loading, error, reload } = useCreatorHub(cityParam);

  return (
    <div className="min-h-dvh bg-[#F4F5F7]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">
            Yunicity · Éditorial
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {CREATOR_HUB_TITLE}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
            {CREATOR_HUB_SUBTITLE}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <p className="text-xs font-medium text-neutral-500">Ville : {city}</p>
            <Link
              href={getCreatorDirectoryHref()}
              className="font-semibold text-yunicity-primary hover:underline"
            >
              {CREATOR_DIRECTORY_DISCOVER_LINK}
            </Link>
          </div>
        </header>

        <section className="mt-10" aria-label="Contenus créateurs publiés">
          {loading ? (
            <CreatorHubSkeleton />
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
              <p className="text-sm text-red-800">{CREATOR_HUB_ERROR}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {CREATOR_HUB_RETRY}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-6 py-12 text-center">
              <p className="text-sm text-neutral-600">{CREATOR_HUB_EMPTY}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <CreatorContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
