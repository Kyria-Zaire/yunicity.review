"use client";

import type { SearchGroupKey, SearchResultItem } from "@yunicity/types";
import { searchResultHref, searchResultSubtitle, searchResultTitle } from "@yunicity/utils";
import Link from "next/link";

type SearchResultCardProps = {
  item: SearchResultItem;
  groupKey: SearchGroupKey;
  city: string;
};

export function SearchResultCard({ item, groupKey, city }: SearchResultCardProps) {
  const title = searchResultTitle(item);
  const subtitle = searchResultSubtitle(item, groupKey, city);
  const href = searchResultHref(item, groupKey, city)?.web;

  const inner = (
    <>
      <p className="font-medium text-neutral-900">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
    </>
  );

  if (!href) {
    return (
      <article className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
        {inner}
      </article>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-yunicity-primary/30"
    >
      {inner}
    </Link>
  );
}
