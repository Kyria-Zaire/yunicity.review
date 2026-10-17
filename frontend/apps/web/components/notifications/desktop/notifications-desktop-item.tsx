"use client";

import type { NotificationsDesktopRow } from "@yunicity/utils";
import { NOTIFICATIONS_DESKTOP_ITEM_MENU, NOTIFICATIONS_DESKTOP_MARK_READ } from "@yunicity/utils";
import {
  Award,
  CalendarDays,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TONE_STYLES = {
  events: "bg-emerald-50 text-emerald-700",
  community: "bg-sky-50 text-sky-700",
  contributions: "bg-violet-50 text-violet-700",
  offers: "bg-amber-50 text-amber-800",
  status: "bg-[#EEF0FF] text-yunicity-primary",
} as const;

const TONE_ICONS = {
  events: CalendarDays,
  community: MessageCircle,
  contributions: Sparkles,
  offers: Tag,
  status: Award,
} as const;

type NotificationsDesktopItemProps = {
  item: NotificationsDesktopRow;
  onMarkRead: (id: string) => void;
};

export function NotificationsDesktopItem({ item, onMarkRead }: NotificationsDesktopItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = TONE_ICONS[item.iconTone] ?? Megaphone;
  const toneClass = TONE_STYLES[item.iconTone];

  return (
    <article
      className={`relative flex items-start gap-4 px-5 py-4 transition hover:bg-neutral-50/80 ${
        item.isRead ? "bg-white" : "bg-[#F7F8FF]/80"
      }`}
      data-notifications-desktop-item=""
      data-read={item.isRead ? "true" : "false"}
    >
      {!item.isRead ? (
        <span
          className="mt-5 h-2 w-2 shrink-0 rounded-full bg-yunicity-primary"
          aria-hidden
        />
      ) : (
        <span className="mt-5 h-2 w-2 shrink-0" aria-hidden />
      )}

      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-neutral-900">{item.title}</h3>
            {item.detail ? (
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">{item.detail}</p>
            ) : null}
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-neutral-400">
            {item.timeLabel}
          </span>
        </div>

        <Link
          href={item.href}
          onClick={() => {
            if (!item.isRead) onMarkRead(item.id);
          }}
          className="mt-3 inline-flex items-center justify-center rounded-full border border-yunicity-primary px-4 py-1.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          {item.actionLabel}
        </Link>
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          aria-label={NOTIFICATIONS_DESKTOP_ITEM_MENU}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-full z-10 mt-1 min-w-[11rem] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
            {!item.isRead ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={() => {
                  onMarkRead(item.id);
                  setMenuOpen(false);
                }}
              >
                {NOTIFICATIONS_DESKTOP_MARK_READ}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
