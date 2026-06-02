"use client";

import type { ProfileEditCompletionItem, ProfileTribeCard } from "@yunicity/utils";
import {
  PROFILE_EDIT_COMPLETION_TITLE,
  PROFILE_EDIT_TRIBES_CTA,
  PROFILE_EDIT_TRIBES_EMPTY,
  PROFILE_EDIT_TRIBES_TITLE,
} from "@yunicity/utils";
import { Check, Circle } from "lucide-react";
import Link from "next/link";

type ProfileEditLeftRailProps = {
  percent: number;
  items: ProfileEditCompletionItem[];
  tribeCards: ProfileTribeCard[];
};

export function ProfileEditLeftRail({ percent, items, tribeCards }: ProfileEditLeftRailProps) {
  return (
    <aside className="hidden space-y-5 xl:block">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_TRIBES_TITLE}</h2>
          <Link
            href="/tribes"
            className="text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_EDIT_TRIBES_CTA}
          </Link>
        </div>
        {tribeCards.length === 0 ? (
          <p className="mt-3 text-xs leading-relaxed text-neutral-500">{PROFILE_EDIT_TRIBES_EMPTY}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tribeCards.map((tribe) => (
              <li key={tribe.id}>
                <Link
                  href={tribe.href}
                  className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-neutral-50"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary/10 text-xs font-bold text-yunicity-primary"
                    aria-hidden
                  >
                    {tribe.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-neutral-900">
                      {tribe.name}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">{tribe.statusLine}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_COMPLETION_TITLE}</h2>
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-neutral-600">
          <span>Progression</span>
          <span className="text-yunicity-primary">{percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-yunicity-primary transition-all"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <ul className="mt-4 space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5 text-sm">
              {item.done ? (
                <Check className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
              )}
              <span className={item.done ? "text-neutral-700" : "text-neutral-500"}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
