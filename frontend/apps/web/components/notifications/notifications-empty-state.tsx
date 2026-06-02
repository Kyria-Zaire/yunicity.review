"use client";

import type { NotificationEmptyStateView } from "@yunicity/utils";
import { NOTIFICATIONS_EMPTY_SUGGESTIONS_TITLE } from "@yunicity/utils";
import { Compass, Sparkles } from "lucide-react";
import Link from "next/link";

type NotificationsEmptyStateProps = {
  view: NotificationEmptyStateView;
};

export function NotificationsEmptyState({ view }: NotificationsEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-gradient-to-b from-white to-neutral-50/80 px-5 py-10 shadow-sm sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <span
          className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary ring-1 ring-yunicity-primary/10"
          aria-hidden
        >
          <Sparkles className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-lg font-bold text-neutral-900">{view.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{view.body}</p>

        {view.suggestions.length > 0 ? (
          <div className="mt-8 w-full text-left">
            <p className="mb-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
              <Compass className="h-3.5 w-3.5" aria-hidden />
              {NOTIFICATIONS_EMPTY_SUGGESTIONS_TITLE}
            </p>
            <ul className="space-y-2">
              {view.suggestions.map((hint) => (
                <li key={hint.id}>
                  <Link
                    href={hint.href}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/90 bg-white px-4 py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:border-yunicity-primary/25 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
                  >
                    <span className="min-w-0 text-left leading-snug">{hint.label}</span>
                    <span className="shrink-0 text-xs font-semibold text-yunicity-primary">
                      Explorer
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
