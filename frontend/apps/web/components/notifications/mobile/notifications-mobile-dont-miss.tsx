"use client";

import type { NotificationsMediumSummaryCard } from "@yunicity/utils";
import { NOTIFICATIONS_MOBILE_DONT_MISS_TITLE } from "@yunicity/utils";
import { CalendarDays, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";

type NotificationsMobileDontMissProps = {
  cards: NotificationsMediumSummaryCard[];
};

export function NotificationsMobileDontMiss({ cards }: NotificationsMobileDontMissProps) {
  const items = cards.filter((card) => card.kind !== "unread" && card.href && card.detail);
  if (items.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-notifications-mobile-dont-miss=""
    >
      <h2 className="text-sm font-bold text-neutral-900">{NOTIFICATIONS_MOBILE_DONT_MISS_TITLE}</h2>
      <ul className="mt-3 space-y-1">
        {items.map((item) => {
          const Icon = item.kind === "offer" ? Tag : CalendarDays;
          const tone =
            item.kind === "offer" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700";
          return (
            <li key={item.id}>
              <Link
                href={item.href!}
                className="flex items-center gap-3 rounded-xl px-1 py-2.5 transition hover:bg-neutral-50"
              >
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">{item.detail}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
