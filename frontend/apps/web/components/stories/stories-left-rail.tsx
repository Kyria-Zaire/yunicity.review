"use client";

import type { Tribe } from "@yunicity/types";
import {
  STORIES_CTA_BODY,
  STORIES_CTA_BUTTON,
  STORIES_CTA_TITLE,
  STORIES_FEATURED_CTA,
  STORIES_FEATURED_TITLE,
  STORIES_LEFT_CONTRIBUTIONS,
  STORIES_LEFT_DISCUSSIONS,
  STORIES_LEFT_HOME,
  STORIES_LEFT_NEARBY,
  STORIES_LEFT_POPULAR,
  STORIES_LEFT_SAVED,
  STORIES_LEFT_STORIES,
  STORIES_LEFT_SUBSCRIPTIONS,
  STORIES_TRIBES_CTA,
  STORIES_TRIBES_EMPTY,
  STORIES_TRIBES_MORE,
  STORIES_TRIBES_TITLE,
  STORIES_LEFT_TIP_BODY,
  STORIES_LEFT_TIP_LINK,
  STORIES_LEFT_TIP_TITLE,
  buildStoryTribeSidebarItems,
} from "@yunicity/utils";
import type { StoryFeaturedItem } from "@yunicity/types";
import {
  ArrowRight,
  Bookmark,
  CircleDot,
  Home,
  Lightbulb,
  MapPin,
  MessageCircle,
  PenLine,
  Plus,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";

const NAV = [
  { href: "/feed", label: STORIES_LEFT_HOME, icon: Home, section: "home" as const },
  { href: "/subscriptions", label: STORIES_LEFT_SUBSCRIPTIONS, icon: Users, section: "subscriptions" as const },
  { href: "/feed", label: STORIES_LEFT_POPULAR, icon: Star, section: "popular" as const },
  { href: "/map", label: STORIES_LEFT_NEARBY, icon: MapPin, section: "nearby" as const },
  { href: "/discussions", label: STORIES_LEFT_DISCUSSIONS, icon: MessageCircle, section: "discussions" as const },
  { href: "/stories", label: STORIES_LEFT_STORIES, icon: CircleDot, section: "stories" as const },
  { href: "/feed", label: STORIES_LEFT_CONTRIBUTIONS, icon: PenLine, section: "contributions" as const },
  { href: "/events", label: STORIES_LEFT_SAVED, icon: Bookmark, section: "saved" as const },
] as const;

type StoriesLeftRailProps = {
  city: string;
  tribes: Tribe[];
  featured: StoryFeaturedItem | null;
  activeSection?: "stories" | "new";
};

export function StoriesLeftRail({
  city,
  tribes,
  featured,
  activeSection = "stories",
}: StoriesLeftRailProps) {
  const tribeSidebar = buildStoryTribeSidebarItems({ city, tribes });

  return (
    <aside className="hidden w-56 shrink-0 xl:block">
      <div className="sticky top-24 space-y-5">
        <nav className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                item.section === "stories" &&
                (activeSection === "stories" || activeSection === "new");
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[#EEF0FF] text-yunicity-primary"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="rounded-2xl bg-gradient-to-br from-yunicity-primary via-[#5B5CE6] to-[#7C3AED] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" aria-hidden />
            <h2 className="text-base font-bold">{STORIES_CTA_TITLE}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/90">{STORIES_CTA_BODY}</p>
          <Link
            href="/stories/new"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-neutral-100"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {STORIES_CTA_BUTTON}
          </Link>
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-neutral-900">{STORIES_TRIBES_TITLE}</h2>
            <Link href="/tribes" className="text-xs font-semibold text-yunicity-primary hover:underline">
              {STORIES_TRIBES_CTA}
            </Link>
          </div>
          {tribeSidebar.visible.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">{STORIES_TRIBES_EMPTY}</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {tribeSidebar.visible.map((tribe) => (
                <li key={tribe.id}>
                  <Link
                    href={tribe.href}
                    className="flex items-center gap-2.5 rounded-lg px-1 py-0.5 hover:bg-white"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-xs font-bold text-yunicity-primary">
                      {tribe.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
                      {tribe.name}
                    </span>
                    {tribe.hasActivity ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-yunicity-primary" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {tribeSidebar.moreCount > 0 ? (
            <Link
              href="/tribes"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
            >
              <Plus className="h-3 w-3" aria-hidden />
              {STORIES_TRIBES_MORE(tribeSidebar.moreCount)}
            </Link>
          ) : null}
        </section>

        {featured ? (
          <section className="rounded-2xl border border-neutral-200/90 bg-[#EEF0FF]/60 p-4 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-900">{STORIES_FEATURED_TITLE}</h2>
            <p className="mt-1 text-sm font-semibold text-neutral-800">{featured.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">{featured.description}</p>
            {featured.media_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.media_url}
                alt=""
                className="mt-3 h-28 w-full rounded-xl object-cover"
              />
            ) : null}
            <Link
              href={featured.href}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-yunicity-primary bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
            >
              {STORIES_FEATURED_CTA}
            </Link>
          </section>
        ) : null}

        {activeSection === "new" ? (
          <section className="rounded-2xl border border-[#E0E3FF] bg-[#EEF0FF]/70 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yunicity-primary" aria-hidden />
              <h2 className="text-sm font-bold text-neutral-900">{STORIES_LEFT_TIP_TITLE}</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{STORIES_LEFT_TIP_BODY}</p>
            <Link
              href="/stories"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
            >
              {STORIES_LEFT_TIP_LINK}
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
