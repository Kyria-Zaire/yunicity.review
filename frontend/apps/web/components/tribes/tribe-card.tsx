"use client";

import type { Tribe } from "@yunicity/types";
import {
  TRIBE_DISCOVER_CTA,
  TRIBE_MEMBER_COUNT,
  tribeCategoryLabel,
  tribeHref,
  tribeVisibilityLabel,
} from "@yunicity/utils";
import Link from "next/link";

export function TribeCard({ tribe, city }: { tribe: Tribe; city: string }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-yunicity-primary/25">
      <div className="h-32 bg-neutral-100">
        {tribe.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tribe.cover_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end p-4">
            <p className="text-sm font-medium text-neutral-700">{tribe.name}</p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-neutral-500">
          {tribeCategoryLabel(tribe.category)} · {tribeVisibilityLabel(tribe.visibility)}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-neutral-900">{tribe.name}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">
          {tribe.description}
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          {TRIBE_MEMBER_COUNT(tribe.active_member_count, tribe.member_limit)}
        </p>
        <Link
          href={tribeHref(tribe.slug, city)}
          className="mt-5 inline-flex text-sm font-medium text-yunicity-primary underline-offset-2 hover:underline"
        >
          {TRIBE_DISCOVER_CTA}
        </Link>
      </div>
    </article>
  );
}
