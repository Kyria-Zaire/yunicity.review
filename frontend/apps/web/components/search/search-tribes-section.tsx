"use client";

import type { Tribe } from "@yunicity/types";
import {
  SEARCH_EXPLORER_TRIBE_DISCOVER,
  SEARCH_EXPLORER_TRIBE_JOIN,
  SEARCH_EXPLORER_TRIBES_EMPTY,
  SEARCH_EXPLORER_TRIBES_TITLE,
  SEARCH_EXPLORER_VIEW_ALL_TRIBES,
  tribeHref,
} from "@yunicity/utils";
import Link from "next/link";

export function SearchTribesSection({ tribes, city }: { tribes: Tribe[]; city: string }) {
  return (
    <section className="space-y-3" aria-labelledby="search-tribes-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="search-tribes-title" className="text-base font-semibold text-neutral-900">
          {SEARCH_EXPLORER_TRIBES_TITLE}
        </h2>
        <Link href="/tribes" className="text-xs font-semibold text-yunicity-primary hover:underline">
          {SEARCH_EXPLORER_VIEW_ALL_TRIBES}
        </Link>
      </div>
      {tribes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
          {SEARCH_EXPLORER_TRIBES_EMPTY}
        </p>
      ) : (
        <ul className="space-y-3">
          {tribes.map((tribe) => (
            <li
              key={tribe.id}
              className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3"
            >
              <p className="font-medium text-neutral-900">{tribe.name}</p>
              {tribe.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{tribe.description}</p>
              ) : null}
              <p className="mt-1 text-xs text-neutral-400">
                {tribe.active_member_count} membre
                {tribe.active_member_count !== 1 ? "s" : ""} · communauté locale
              </p>
              <Link
                href={tribeHref(tribe.slug, city)}
                className="mt-3 inline-flex rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
              >
                {tribe.viewer_is_member
                  ? SEARCH_EXPLORER_TRIBE_DISCOVER
                  : SEARCH_EXPLORER_TRIBE_JOIN}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
