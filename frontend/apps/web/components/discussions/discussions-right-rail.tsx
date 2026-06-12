"use client";

import type { DiscussionInsightsResponse } from "@yunicity/types";
import {
  DISCUSSIONS_ACTIVE_CTA,
  DISCUSSIONS_ACTIVE_EMPTY,
  DISCUSSIONS_ACTIVE_REPLIES,
  DISCUSSIONS_ACTIVE_TITLE,
  DISCUSSIONS_RULES_ITEMS,
  DISCUSSIONS_RULES_SEE_ALL,
  DISCUSSIONS_RULES_TITLE,
  DISCUSSIONS_TRENDING_CTA,
  DISCUSSIONS_TRENDING_EMPTY,
  DISCUSSIONS_TRENDING_MESSAGES,
  DISCUSSIONS_TRENDING_TITLE,
  formatDiscussionActivityAgo,
} from "@yunicity/utils";
import { Bus, Coffee, Heart, MessageCircle, Music, Shield, Tag, TreePine } from "lucide-react";
import Link from "next/link";

const TREND_ICONS = [TreePine, Coffee, Music, Bus, Tag] as const;

type DiscussionsRightRailProps = {
  insights: DiscussionInsightsResponse | null;
  loading?: boolean;
  onSelectTopic?: (topicId: string) => void;
};

export function DiscussionsRightRail({
  insights,
  loading,
  onSelectTopic,
}: DiscussionsRightRailProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  const trending = insights?.trending_topics ?? [];
  const active = insights?.active_discussions ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{DISCUSSIONS_TRENDING_TITLE}</h2>
          <button
            type="button"
            onClick={() => onSelectTopic?.("all")}
            className="text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {DISCUSSIONS_TRENDING_CTA}
          </button>
        </div>
        {trending.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{DISCUSSIONS_TRENDING_EMPTY}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {trending.map((topic, index) => {
              const Icon = TREND_ICONS[index % TREND_ICONS.length] ?? Coffee;
              return (
                <li key={topic.id}>
                  <button
                    type="button"
                    onClick={() => onSelectTopic?.(topic.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-neutral-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-neutral-900">
                        {topic.label}
                      </span>
                      <span className="block text-xs text-neutral-500">
                        {DISCUSSIONS_TRENDING_MESSAGES(topic.message_count)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{DISCUSSIONS_ACTIVE_TITLE}</h2>
          <button
            type="button"
            onClick={() => onSelectTopic?.("all")}
            className="text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {DISCUSSIONS_ACTIVE_CTA}
          </button>
        </div>
        {active.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{DISCUSSIONS_ACTIVE_EMPTY}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {active.map((item) => (
              <li key={item.post_id}>
                <Link
                  href={`/discussions#thread-${item.post_id}`}
                  className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-neutral-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-xs font-bold text-yunicity-primary">
                    {item.author_avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.author_avatar_url}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      item.author_display_name.slice(0, 1)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-900">
                      {item.title}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {DISCUSSIONS_ACTIVE_REPLIES(
                        item.reply_count,
                        formatDiscussionActivityAgo(item.last_activity_at),
                      )}
                    </span>
                  </span>
                  {item.has_recent_activity ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-yunicity-primary" aria-hidden />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{DISCUSSIONS_RULES_TITLE}</h2>
        <ul className="mt-3 space-y-2.5">
          {DISCUSSIONS_RULES_ITEMS.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2 text-sm text-neutral-700">
              {rule.id === "respect" ? (
                <Heart className="h-4 w-4 text-yunicity-primary" aria-hidden />
              ) : rule.id === "protect" ? (
                <Shield className="h-4 w-4 text-yunicity-primary" aria-hidden />
              ) : (
                <MessageCircle className="h-4 w-4 text-yunicity-primary" aria-hidden />
              )}
              {rule.label}
            </li>
          ))}
        </ul>
        <Link
          href="/settings"
          className="mt-3 inline-flex text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {DISCUSSIONS_RULES_SEE_ALL} →
        </Link>
      </section>
    </div>
  );
}
