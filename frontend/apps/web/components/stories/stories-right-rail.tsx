"use client";

import type { StoryCategoryId, StoryInsightsResponse } from "@yunicity/types";
import {
  STORIES_CATEGORIES_CTA,
  STORIES_CATEGORIES_TITLE,
  STORIES_CONTRIBUTORS_CTA,
  STORIES_CONTRIBUTORS_EMPTY,
  STORIES_CONTRIBUTORS_TITLE,
  STORIES_CONTRIBUTOR_COUNT,
  STORIES_LIVE_BADGE,
  STORIES_LIVE_CTA,
  STORIES_LIVE_EMPTY,
  STORIES_LIVE_TITLE,
  STORIES_TIP_BODY,
  STORIES_TIP_CTA,
  STORIES_TIP_TITLE,
  STORY_CATEGORY_NAV,
  storyDetailHref,
} from "@yunicity/utils";
import {
  Calendar,
  Coffee,
  Eye,
  Landmark,
  Leaf,
  Lightbulb,
  MapPin,
  Music,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_ICONS = [Sparkles, Coffee, Music, Leaf, Landmark, Trophy, MapPin, Calendar] as const;

type StoriesRightRailProps = {
  insights: StoryInsightsResponse | null;
  loading?: boolean;
  activeCategory: StoryCategoryId;
  onCategoryChange: (category: StoryCategoryId) => void;
};

export function StoriesRightRail({
  insights,
  loading,
  activeCategory,
  onCategoryChange,
}: StoriesRightRailProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  const live = insights?.live_stories ?? [];
  const contributors = insights?.top_contributors ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{STORIES_LIVE_TITLE}</h2>
          <button
            type="button"
            onClick={() => onCategoryChange("all")}
            className="text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {STORIES_LIVE_CTA}
          </button>
        </div>
        {live.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{STORIES_LIVE_EMPTY}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {live.map((item) => (
              <li key={item.story_id}>
                <Link
                  href={storyDetailHref(item.story_id)}
                  className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-neutral-50"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-xs font-bold text-yunicity-primary">
                    {item.author_avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.author_avatar_url}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      item.author_name.slice(0, 1)
                    )}
                    {item.is_recent ? (
                      <span className="absolute -bottom-1 rounded-full bg-[#FF2D78] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {STORIES_LIVE_BADGE}
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-900">
                      {item.location_label || item.author_name}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">{item.subtitle}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600">
                    <Eye className="h-3 w-3" aria-hidden />
                    {item.view_count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{STORIES_CATEGORIES_TITLE}</h2>
          <span className="text-xs font-semibold text-yunicity-primary">{STORIES_CATEGORIES_CTA}</span>
        </div>
        <ul className="mt-3 space-y-1">
          {STORY_CATEGORY_NAV.map((category, index) => {
            const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length] ?? Sparkles;
            const active = activeCategory === category.id;
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => onCategoryChange(category.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "bg-[#EEF0FF] text-yunicity-primary"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {category.label}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{STORIES_CONTRIBUTORS_TITLE}</h2>
          <span className="text-xs font-semibold text-yunicity-primary">{STORIES_CONTRIBUTORS_CTA}</span>
        </div>
        {contributors.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{STORIES_CONTRIBUTORS_EMPTY}</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {contributors.map((item, index) => (
              <li key={item.author_id} className="flex items-center gap-3">
                <span className="w-4 text-sm font-bold text-neutral-400">{index + 1}</span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-xs font-bold text-yunicity-primary">
                  {item.author_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.author_avatar_url}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    item.author_name.slice(0, 1)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">{item.author_name}</span>
                  <span className="block text-xs text-neutral-500">
                    {STORIES_CONTRIBUTOR_COUNT(item.story_count)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-[#EEF0FF]/70 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yunicity-primary" aria-hidden />
          <h2 className="text-sm font-bold text-neutral-900">{STORIES_TIP_TITLE}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">{STORIES_TIP_BODY}</p>
        <Link
          href="/stories/new"
          className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-yunicity-primary bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-white/80"
        >
          {STORIES_TIP_CTA}
        </Link>
      </section>
    </div>
  );
}
