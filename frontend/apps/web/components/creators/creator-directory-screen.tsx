"use client";

import { CreatorDirectoryCard } from "@/components/creators/creator-directory-card";
import { CreatorDirectorySkeleton } from "@/components/creators/creator-directory-skeleton";
import { useCreatorDirectory } from "@/hooks/use-creator-directory";
import {
  CREATOR_DIRECTORY_EMPTY,
  CREATOR_DIRECTORY_ERROR,
  CREATOR_DIRECTORY_HERO,
  CREATOR_DIRECTORY_HUB_LINK,
  CREATOR_DIRECTORY_RETRY,
  CREATOR_DIRECTORY_SEARCH_PLACEHOLDER,
  CREATOR_DIRECTORY_SUBTITLE,
  CREATOR_DIRECTORY_TITLE,
  getCreatorContentDetailBackHref,
} from "@yunicity/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function CreatorDirectoryScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const qParam = searchParams.get("q")?.trim() ?? "";
  const { city, query, items, total, loading, error, reload } = useCreatorDirectory(
    cityParam,
    qParam,
  );
  const [searchDraft, setSearchDraft] = useState(qParam);

  const applySearch = () => {
    const params = new URLSearchParams();
    if (cityParam) {
      params.set("city", cityParam);
    } else if (city) {
      params.set("city", city);
    }
    const trimmed = searchDraft.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }
    const suffix = params.toString();
    router.push(suffix ? `/creators?${suffix}` : "/creators");
  };

  return (
    <div className="min-h-dvh bg-[#F4F5F7]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">
            Yunicity · Territoire
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {CREATOR_DIRECTORY_TITLE}
          </h1>
          <p className="mt-4 text-lg font-medium leading-relaxed text-neutral-800">
            {CREATOR_DIRECTORY_HERO}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
            {CREATOR_DIRECTORY_SUBTITLE}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-neutral-500">Ville : {city}</span>
            {!loading && !error ? (
              <span className="font-medium text-neutral-500">
                {total} créateur{total > 1 ? "s" : ""} public{total > 1 ? "s" : ""}
              </span>
            ) : null}
            <Link
              href={getCreatorContentDetailBackHref()}
              className="font-semibold text-yunicity-primary hover:underline"
            >
              {CREATOR_DIRECTORY_HUB_LINK}
            </Link>
          </div>
        </header>

        <section className="mt-8" aria-label="Recherche créateurs">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              applySearch();
            }}
          >
            <label className="sr-only" htmlFor="creator-directory-search">
              Rechercher un créateur
            </label>
            <input
              id="creator-directory-search"
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={CREATOR_DIRECTORY_SEARCH_PLACEHOLDER}
              className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-sm outline-none ring-yunicity-primary/20 placeholder:text-neutral-400 focus:border-yunicity-primary focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Rechercher
            </button>
          </form>
          {query ? (
            <p className="mt-2 text-xs font-medium text-neutral-500">
              Résultats pour « {query} »
            </p>
          ) : null}
        </section>

        <section className="mt-10" aria-label="Annuaire des créateurs">
          {loading ? (
            <CreatorDirectorySkeleton />
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
              <p className="text-sm text-red-800">{CREATOR_DIRECTORY_ERROR}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {CREATOR_DIRECTORY_RETRY}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-6 py-12 text-center">
              <p className="text-sm text-neutral-600">{CREATOR_DIRECTORY_EMPTY}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <CreatorDirectoryCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
