import type { Tribe } from "@yunicity/types";
import { HOME_TRIBE_CTA_BODY, HOME_TRIBE_CTA_LINK, HOME_TRIBE_CTA_TITLE } from "@yunicity/utils";
import Link from "next/link";

export function TribeDiscoveryCard({ tribe }: { tribe: Tribe | null }) {
  if (!tribe) {
    return null;
  }

  return (
    <article className="rounded-2xl border border-dashed border-yunicity-primary/25 bg-yunicity-primary-soft/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-yunicity-primary">
        {HOME_TRIBE_CTA_TITLE}
      </p>
      <h2 className="mt-1 text-base font-semibold text-neutral-900">{tribe.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {tribe.description?.trim() || HOME_TRIBE_CTA_BODY}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/tribes/${tribe.slug}`}
          className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white hover:bg-yunicity-primary-hover"
        >
          Découvrir
        </Link>
        <Link
          href="/tribes"
          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {HOME_TRIBE_CTA_LINK}
        </Link>
      </div>
    </article>
  );
}
