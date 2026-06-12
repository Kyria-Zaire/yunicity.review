"use client";

import type { UserNotificationItem } from "@yunicity/types";
import {
  formatNotificationInboxTime,
  getNotificationPresentation,
  resolveNotificationDeeplink,
  type NotificationPresentationTone,
} from "@yunicity/utils";
import {
  Award,
  Bell,
  Calendar,
  MessageCircle,
  MoreHorizontal,
  ThumbsUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TONE_STYLES: Record<NotificationPresentationTone, string> = {
  social: "bg-[#EEF0FF] text-yunicity-primary",
  passport: "bg-violet-50 text-violet-700",
  events: "bg-amber-50 text-amber-800",
  system: "bg-neutral-100 text-neutral-600",
};

const TONE_ICONS: Record<NotificationPresentationTone, LucideIcon> = {
  social: MessageCircle,
  passport: Award,
  events: Calendar,
  system: Bell,
};

function iconForType(type: UserNotificationItem["type"]): LucideIcon {
  if (type === "POST_LIKED") return ThumbsUp;
  if (type === "POST_COMMENTED") return MessageCircle;
  if (type === "LOCAL_EVENT_PUBLISHED") return Calendar;
  if (type === "PASSPORT_LEVEL_UNLOCKED" || type === "LOCAL_STAMP_EARNED") return Award;
  return Users;
}

type NotificationCardProps = {
  item: UserNotificationItem;
  onMarkRead: (id: string) => void;
};

export function NotificationCard({ item, onMarkRead }: NotificationCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const presentation = getNotificationPresentation(item);
  const Icon = iconForType(item.type);
  const toneClass = TONE_STYLES[presentation.tone];
  const href = resolveNotificationDeeplink(item.deeplink, "web");
  const timeLabel = formatNotificationInboxTime(item.created_at);

  return (
    <article
      className={`relative rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        item.is_read ? "border-neutral-200/90" : "border-yunicity-primary/25"
      }`}
    >
      <div className="flex gap-3">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneClass}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-neutral-900">{presentation.title}</h3>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-neutral-500 tabular-nums">{timeLabel}</span>
              {!item.is_read ? (
                <span
                  className="h-2 w-2 rounded-full bg-yunicity-primary"
                  aria-label="Non lu"
                />
              ) : null}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Actions"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-[10rem] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                    {!item.is_read ? (
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        onClick={() => {
                          onMarkRead(item.id);
                          setMenuOpen(false);
                        }}
                      >
                        Marquer comme lu
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-neutral-600">{presentation.description}</p>

          <Link
            href={href}
            onClick={() => {
              if (!item.is_read) onMarkRead(item.id);
            }}
            className="mt-2 inline-block text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {presentation.actionLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
