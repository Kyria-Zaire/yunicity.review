"use client";

import type { NotificationsMediumSummaryCard } from "@yunicity/utils";
import { CalendarDays, Mail, Tag } from "lucide-react";
import Link from "next/link";

const CARD_ICON = {
  unread: Mail,
  event: CalendarDays,
  offer: Tag,
} as const;

const CARD_TONE = {
  unread: "bg-[#EEF0FF] text-yunicity-primary",
  event: "bg-emerald-50 text-emerald-700",
  offer: "bg-amber-50 text-amber-800",
} as const;

type NotificationsMediumSummaryRowProps = {
  cards: NotificationsMediumSummaryCard[];
  onUnreadClick?: () => void;
};

export function NotificationsMediumSummaryRow({
  cards,
  onUnreadClick,
}: NotificationsMediumSummaryRowProps) {
  return (
    <div
      className="mb-5 grid gap-3 sm:grid-cols-3"
      data-notifications-medium-summary=""
    >
      {cards.map((card) => {
        const Icon = CARD_ICON[card.kind];
        const tone = CARD_TONE[card.kind];
        const content = (
          <>
            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span
                className={`block truncate text-sm font-bold ${
                  card.kind === "unread" ? "text-yunicity-primary" : "text-neutral-900"
                }`}
              >
                {card.title}
              </span>
              {card.detail ? (
                <span className="mt-0.5 block truncate text-xs text-neutral-600">{card.detail}</span>
              ) : null}
            </span>
          </>
        );

        const className =
          "flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 text-left shadow-sm transition hover:border-neutral-300 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary";

        if (card.kind === "unread") {
          return (
            <button
              key={card.id}
              type="button"
              onClick={onUnreadClick}
              className={className}
              data-notifications-medium-summary-card={card.kind}
            >
              {content}
            </button>
          );
        }

        if (card.href) {
          return (
            <Link
              key={card.id}
              href={card.href}
              className={className}
              data-notifications-medium-summary-card={card.kind}
            >
              {content}
            </Link>
          );
        }

        return (
          <div
            key={card.id}
            className={className}
            data-notifications-medium-summary-card={card.kind}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
