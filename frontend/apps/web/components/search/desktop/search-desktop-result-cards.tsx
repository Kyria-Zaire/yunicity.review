"use client";

import type { SearchGroupKey, SearchResultItem } from "@yunicity/types";
import {
  SEARCH_DESKTOP_EVENT_CTA,
  SEARCH_DESKTOP_ORG_CTA,
  SEARCH_DESKTOP_ORG_KIND,
  SEARCH_DESKTOP_OTHER_RESULTS,
  SEARCH_DESKTOP_TRIBE_CTA,
  searchResultHref,
  searchResultSubtitle,
  searchResultTitle,
} from "@yunicity/utils";
import {
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  MapPin,
  MessageSquare,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";

type SearchDesktopResultCardsProps = {
  groupKey: SearchGroupKey;
  items: SearchResultItem[];
  city: string;
};

export function SearchDesktopResultCards({ groupKey, items, city }: SearchDesktopResultCardsProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <SearchDesktopResultCard groupKey={groupKey} item={item} city={city} />
        </li>
      ))}
    </ul>
  );
}

function SearchDesktopResultCard({
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
      return <EventCard title={title} subtitle={subtitle} href={href} />;
    case "tribes":
      return <TribeCard title={title} subtitle={subtitle} href={href} />;
    case "posts":
      return <PostCard title={title} subtitle={subtitle} body={item.body} />;
    case "organizations":
      return <OrganizationCard title={title} subtitle={subtitle} city={city} href={href} />;
    default:
      return <GenericCard title={title} subtitle={subtitle} href={href} groupKey={groupKey} />;
  }
}

function EventCard({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string | null | undefined;
}) {
  const content = (
    <article className="flex overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:border-neutral-300">
      <div className="flex w-28 shrink-0 items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
        <CalendarDays className="h-8 w-8 text-emerald-600" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">Sortie</p>
        <h3 className="text-sm font-bold text-neutral-950">{title}</h3>
        {subtitle ? <p className="text-xs text-neutral-600">{subtitle}</p> : null}
        {href ? (
          <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-yunicity-primary">
            {SEARCH_DESKTOP_EVENT_CTA}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
    </article>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function TribeCard({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string | null | undefined;
}) {
  const content = (
    <article className="flex gap-4 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm transition hover:border-neutral-300">
      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
        <Users className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-neutral-950">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs leading-relaxed text-neutral-600">{subtitle}</p> : null}
        {href ? (
          <span className="mt-3 inline-flex min-h-8 items-center rounded-lg border border-yunicity-primary/35 px-3 text-xs font-semibold text-yunicity-primary">
            {SEARCH_DESKTOP_TRIBE_CTA}
          </span>
        ) : null}
      </div>
    </article>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function PostCard({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle: string;
  body?: string | null;
}) {
  return (
    <article className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <MessageSquare className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-neutral-950">{title}</h3>
            {subtitle ? <p className="mt-1 text-xs leading-relaxed text-neutral-600">{subtitle}</p> : null}
          </div>
        </div>
        <Bookmark className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
      </div>
      {body ? (
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="aspect-square rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200"
              aria-hidden
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function OrganizationCard({
  title,
  subtitle,
  city,
  href,
}: {
  title: string;
  subtitle: string;
  city: string;
  href: string | null | undefined;
}) {
  const content = (
    <article className="flex gap-4 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm transition hover:border-neutral-300">
      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[10px] font-bold uppercase tracking-wide text-orange-700">
        {title.slice(0, 2)}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-neutral-950">{title}</h3>
        <p className="mt-0.5 text-xs font-medium text-neutral-500">
          {SEARCH_DESKTOP_ORG_KIND} · {city}
        </p>
        {subtitle ? <p className="mt-2 text-xs leading-relaxed text-neutral-600">{subtitle}</p> : null}
        {href ? (
          <span className="mt-3 inline-flex min-h-8 items-center rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-800">
            {SEARCH_DESKTOP_ORG_CTA}
          </span>
        ) : null}
      </div>
    </article>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function GenericCard({
  title,
  subtitle,
  href,
  groupKey,
}: {
  title: string;
  subtitle: string;
  href: string | null | undefined;
  groupKey: SearchGroupKey;
}) {
  const Icon = GROUP_ICON[groupKey];
  const tone = GROUP_TONE[groupKey];

  const content = (
    <article className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 shadow-sm transition hover:border-neutral-300">
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-neutral-950">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-neutral-600">{subtitle}</p> : null}
      </div>
      {href ? <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden /> : null}
    </article>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

const GROUP_ICON = {
  events: CalendarDays,
  organizations: Building2,
  posts: MessageSquare,
  offers: Briefcase,
  tribes: Users,
  users: User,
  neighborhoods: MapPin,
} as const;

const GROUP_TONE = {
  events: "bg-emerald-100 text-emerald-700",
  organizations: "bg-orange-100 text-orange-700",
  posts: "bg-sky-100 text-sky-700",
  offers: "bg-amber-100 text-amber-700",
  tribes: "bg-violet-100 text-violet-700",
  users: "bg-cyan-100 text-cyan-700",
  neighborhoods: "bg-pink-100 text-pink-700",
} as const;

export function SearchDesktopOtherResults({
  rows,
  onSelect,
}: {
  rows: Array<{
    id: string;
    groupKey: SearchGroupKey;
    label: string;
    subtitle: string;
    href: string;
  }>;
  onSelect: (href: string) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="search-desktop-other-title">
      <h2 id="search-desktop-other-title" className="text-base font-bold text-neutral-950">
        {SEARCH_DESKTOP_OTHER_RESULTS}
      </h2>
      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
        {rows.map((row) => {
          const Icon = GROUP_ICON[row.groupKey];
          const tone = GROUP_TONE[row.groupKey];
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onSelect(row.href)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50"
              >
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">{row.label}</span>
                  <span className="block text-xs text-neutral-500">{row.subtitle}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
