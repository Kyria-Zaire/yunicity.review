"use client";

import type { SearchGroupKey, SearchResultItem } from "@yunicity/types";
import {
  SEARCH_DESKTOP_ORG_KIND,
  SEARCH_MOBILE_VIEW_CTA,
  searchResultHref,
  searchResultSubtitle,
  searchResultTitle,
} from "@yunicity/utils";
import {
  Building2,
  CalendarDays,
  Camera,
  ChevronRight,
  MessageSquare,
  Users,
} from "lucide-react";
import Link from "next/link";

type SearchMobileResultCardsProps = {
  groupKey: SearchGroupKey;
  items: SearchResultItem[];
  city: string;
};

export function SearchMobileResultCards({ groupKey, items, city }: SearchMobileResultCardsProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <SearchMobileResultCard groupKey={groupKey} item={item} city={city} />
        </li>
      ))}
    </ul>
  );
}

function SearchMobileResultCard({
  groupKey,
  item,
  city,
}: {
  groupKey: SearchGroupKey;
  item: SearchResultItem;
  city: string;
}) {
  const title = searchResultTitle(item);
  const subtitle = searchResultSubtitle(item, groupKey, city);
  const href = searchResultHref(item, groupKey, city)?.web;

  switch (groupKey) {
    case "events":
      return <EventRow title={title} subtitle={subtitle} href={href} />;
    case "tribes":
      return <TribeRow title={title} subtitle={subtitle} href={href} />;
    case "posts":
      return <PostRow title={title} subtitle={subtitle} body={item.body} />;
    case "organizations":
      return <OrganizationRow title={title} city={city} href={href} />;
    default:
      return <GenericRow title={title} subtitle={subtitle} href={href} />;
  }
}

function EventRow({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string | null | undefined;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
        <CalendarDays className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-emerald-600" aria-hidden />
        <span className="absolute bottom-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-emerald-700 shadow-sm">
          <Camera className="h-3 w-3" aria-hidden />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-neutral-950">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-neutral-500">{subtitle}</p> : null}
      </div>
      {href ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-yunicity-primary">
          {SEARCH_MOBILE_VIEW_CTA}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      ) : null}
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function TribeRow({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string | null | undefined;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
        <Camera className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-neutral-950">{title}</p>
        {subtitle ? <p className="mt-1 text-xs leading-relaxed text-neutral-500">{subtitle}</p> : null}
      </div>
      {href ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-yunicity-primary">
          {SEARCH_MOBILE_VIEW_CTA}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      ) : null}
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function PostRow({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle: string;
  body?: string | null;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <MessageSquare className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-neutral-950">{title}</p>
          {subtitle ? <p className="text-[11px] text-neutral-400">{subtitle}</p> : null}
        </div>
      </div>
      {body ? <p className="text-sm leading-relaxed text-neutral-700">{body}</p> : null}
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="aspect-[3/4] rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200"
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

function OrganizationRow({
  title,
  city,
  href,
}: {
  title: string;
  city: string;
  href: string | null | undefined;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[8px] font-bold uppercase tracking-wide text-white">
        {title.slice(0, 12)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-neutral-950">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {SEARCH_DESKTOP_ORG_KIND} · {city}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function GenericRow({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string | null | undefined;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
        <Building2 className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-neutral-950">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p> : null}
      </div>
      {href ? <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden /> : null}
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
