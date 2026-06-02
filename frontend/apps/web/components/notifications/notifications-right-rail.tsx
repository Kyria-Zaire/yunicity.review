"use client";

import type { UserNotificationSummaryResponse } from "@yunicity/types";
import type { NotificationLocalHint } from "@yunicity/utils";
import {
  formatActivityMetric,
  NOTIFICATIONS_RAIL_CTA_BODY,
  NOTIFICATIONS_RAIL_CTA_TITLE,
  NOTIFICATIONS_RAIL_HISTORY,
  NOTIFICATIONS_RAIL_LOCAL_TITLE,
  NOTIFICATIONS_RAIL_SUMMARY_INTRO,
  NOTIFICATIONS_RAIL_SUMMARY_MONTH,
  NOTIFICATIONS_RAIL_SUMMARY_TITLE,
  NOTIFICATIONS_RAIL_SUMMARY_UNREAD,
  NOTIFICATIONS_RAIL_SUMMARY_WEEK,
  resolveEmptyStateSuggestions,
} from "@yunicity/utils";
import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

type NotificationsRightRailProps = {
  summary: UserNotificationSummaryResponse | null;
  localHints: NotificationLocalHint[];
  onShowAll: () => void;
};

export function NotificationsRightRail({
  summary,
  localHints,
  onShowAll,
}: NotificationsRightRailProps) {
  const territorySuggestions = resolveEmptyStateSuggestions(localHints);

  return (
    <aside
      className="flex w-full flex-col gap-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:w-[min(100%,var(--web-context-rail-width-md))] lg:overflow-y-auto lg:pb-4 xl:w-[var(--web-context-rail-width)]"
      aria-label="Votre activité et le territoire"
    >
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <h2 className="text-sm font-bold text-neutral-900">{NOTIFICATIONS_RAIL_SUMMARY_TITLE}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
          {NOTIFICATIONS_RAIL_SUMMARY_INTRO}
        </p>
        <ul className="mt-5 space-y-4 text-sm">
          <li className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-neutral-700">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-yunicity-primary" aria-hidden />
              {NOTIFICATIONS_RAIL_SUMMARY_UNREAD}
            </span>
            <span className="max-w-[9rem] text-right text-sm font-semibold leading-snug text-neutral-900">
              {summary != null
                ? formatActivityMetric(summary.unread_count, "unread")
                : "—"}
            </span>
          </li>
          <li className="flex items-start justify-between gap-3 text-neutral-700">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              {NOTIFICATIONS_RAIL_SUMMARY_WEEK}
            </span>
            <span className="max-w-[9rem] text-right text-sm font-semibold leading-snug text-neutral-900">
              {summary != null
                ? formatActivityMetric(summary.count_this_week, "week")
                : "—"}
            </span>
          </li>
          <li className="flex items-start justify-between gap-3 text-neutral-700">
            <span>{NOTIFICATIONS_RAIL_SUMMARY_MONTH}</span>
            <span className="max-w-[9rem] text-right text-sm font-semibold leading-snug text-neutral-900">
              {summary != null
                ? formatActivityMetric(summary.count_this_month, "month")
                : "—"}
            </span>
          </li>
        </ul>
        <button
          type="button"
          onClick={onShowAll}
          className="mt-5 inline-flex items-center gap-1 rounded-md text-xs font-semibold text-yunicity-primary transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          {NOTIFICATIONS_RAIL_HISTORY}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </section>

      {territorySuggestions.length > 0 ? (
        <section className="rounded-2xl border border-neutral-200/90 bg-neutral-50/60 p-5">
          <h2 className="text-sm font-bold text-neutral-900">{NOTIFICATIONS_RAIL_LOCAL_TITLE}</h2>
          <ul className="mt-4 space-y-2">
            {territorySuggestions.map((hint) => (
              <li key={hint.id}>
                <Link
                  href={hint.href}
                  className="block rounded-xl border border-transparent bg-white px-3 py-2.5 text-xs font-medium leading-snug text-neutral-800 shadow-sm transition hover:border-yunicity-primary/20 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
                >
                  {hint.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        className="rounded-2xl p-5 text-white shadow-md transition hover:shadow-lg"
        style={{
          background: "linear-gradient(145deg, #1a2b8f 0%, #2a1f6e 100%)",
        }}
      >
        <h2 className="text-sm font-bold">{NOTIFICATIONS_RAIL_CTA_TITLE}</h2>
        <p className="mt-2 text-xs leading-relaxed text-white/75">{NOTIFICATIONS_RAIL_CTA_BODY}</p>
      </section>
    </aside>
  );
}
