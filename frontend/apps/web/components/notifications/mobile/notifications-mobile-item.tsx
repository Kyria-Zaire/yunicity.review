"use client";

import type { NotificationsDesktopRow } from "@yunicity/utils";
import { NOTIFICATIONS_MOBILE_UNREAD } from "@yunicity/utils";
import {
  Bot,
  CalendarDays,
  ChevronRight,
  FileCheck,
  Globe,
  MessageCircle,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";

const TONE_STYLES = {
  events: "bg-emerald-50 text-emerald-700",
  community: "bg-sky-50 text-sky-700",
  contributions: "bg-violet-50 text-violet-700",
  offers: "bg-amber-50 text-amber-800",
  status: "bg-[#EEF0FF] text-yunicity-primary",
} as const;

const TONE_ICONS = {
  events: CalendarDays,
  community: Users,
  contributions: FileCheck,
  offers: Tag,
  status: Globe,
} as const;

type NotificationsMobileItemProps = {
  item: NotificationsDesktopRow;
  onMarkRead: (id: string) => void;
};

/** Ligne notification mobile maquette R2 — point · icône · texte · CTA · chevron. */
export function NotificationsMobileItem({ item, onMarkRead }: NotificationsMobileItemProps) {
  const Icon =
    item.iconTone === "status" && item.title.toLowerCase().includes("bienvenue")
      ? Bot
      : (TONE_ICONS[item.iconTone] ?? MessageCircle);
  const toneClass = TONE_STYLES[item.iconTone];

  return (
    <Link
      href={item.href}
      onClick={() => {
        if (!item.isRead) onMarkRead(item.id);
      }}
      className="flex items-start gap-2.5 border-b border-neutral-100 px-1 py-3.5 transition hover:bg-neutral-50/70"
      data-notifications-mobile-item=""
      data-read={item.isRead ? "true" : "false"}
    >
      {!item.isRead ? (
        <span
          className="mt-5 h-2 w-2 shrink-0 rounded-full bg-yunicity-primary"
          aria-label={NOTIFICATIONS_MOBILE_UNREAD}
        />
      ) : (
        <span className="mt-5 h-2 w-2 shrink-0" aria-hidden />
      )}

      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-snug text-neutral-900">{item.title}</span>
        {item.detail ? (
          <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-neutral-600">
            {item.detail}
          </span>
        ) : null}
        <span className="mt-1 block text-[11px] text-neutral-400">{item.timeLabel}</span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        <span className="max-w-[5.5rem] text-right text-[11px] font-semibold leading-tight text-yunicity-primary">
          {item.actionLabel}
        </span>
        <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
      </span>
    </Link>
  );
}
