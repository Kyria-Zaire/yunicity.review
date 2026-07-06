"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { NotificationsMobileRow } from "@yunicity/utils";
import { NOTIFICATIONS_MOBILE_UNREAD } from "@yunicity/utils";
import {
  Award,
  Calendar,
  Heart,
  MapPin,
  MessageCircle,
  Shield,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type NotificationsMobileItemProps = {
  item: NotificationsMobileRow;
  onMarkRead: (id: string) => void;
};

function NotificationMobileIcon({ item }: { item: NotificationsMobileRow }) {
  const overlayClass =
    "absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white";

  if (item.actorLabel && (item.iconKind === "like" || item.iconKind === "comment" || item.iconKind === "community")) {
    return (
      <div className="relative shrink-0">
        <ProfileAvatar name={item.actorLabel} size="md" />
        {item.iconKind === "like" ? (
          <span className={`${overlayClass} bg-rose-500 text-white`}>
            <Heart className="h-2.5 w-2.5 fill-current" aria-hidden />
          </span>
        ) : null}
        {item.iconKind === "comment" ? (
          <span className={`${overlayClass} bg-orange-500 text-white`}>
            <MessageCircle className="h-2.5 w-2.5" aria-hidden />
          </span>
        ) : null}
        {item.iconKind === "community" ? (
          <span className={`${overlayClass} bg-violet-600 text-white`}>
            <Users className="h-2.5 w-2.5" aria-hidden />
          </span>
        ) : null}
      </div>
    );
  }

  const iconWrap = (className: string, icon: ReactNode) => (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${className}`}
    >
      {icon}
    </span>
  );

  switch (item.iconKind) {
    case "event":
      return iconWrap(
        "bg-violet-50 text-violet-700",
        <Calendar className="h-5 w-5" strokeWidth={1.75} aria-hidden />,
      );
    case "offer":
      return iconWrap(
        "bg-emerald-50 text-emerald-700",
        <Tag className="h-5 w-5" strokeWidth={1.75} aria-hidden />,
      );
    case "place":
      return iconWrap(
        "bg-sky-50 text-sky-700",
        <MapPin className="h-5 w-5" strokeWidth={1.75} aria-hidden />,
      );
    case "passport":
      return iconWrap(
        "bg-emerald-50 text-emerald-700",
        <Award className="h-5 w-5" strokeWidth={1.75} aria-hidden />,
      );
    default:
      return iconWrap(
        "bg-neutral-100 text-neutral-600",
        <Shield className="h-5 w-5" strokeWidth={1.75} aria-hidden />,
      );
  }
}

/** Ligne notification mobile (MOBILE-NOTIFICATIONS-01). */
export function NotificationsMobileItem({ item, onMarkRead }: NotificationsMobileItemProps) {
  return (
    <Link
      href={item.href}
      onClick={() => {
        if (!item.isRead) onMarkRead(item.id);
      }}
      className={`flex items-start gap-3 rounded-2xl border bg-white px-3 py-3 transition hover:bg-neutral-50/80 ${
        item.isRead ? "border-neutral-200/80" : "border-yunicity-primary/20"
      }`}
    >
      <NotificationMobileIcon item={item} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-neutral-900">{item.title}</p>
        {item.body && item.body !== item.title ? (
          <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-neutral-600">{item.body}</p>
        ) : null}
        <p className="mt-1 text-xs text-neutral-500">{item.timeLabel}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {item.thumbnailUrl ? (
          <div className="h-12 w-12 overflow-hidden rounded-xl bg-neutral-100">
            <CulturalImage
              src={item.thumbnailUrl}
              alt=""
              placeName={item.title}
              className="size-full object-cover"
              sizes="48px"
              showFallbackCaption={false}
            />
          </div>
        ) : null}
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            item.isRead ? "bg-neutral-300" : "bg-yunicity-primary"
          }`}
          aria-label={item.isRead ? undefined : NOTIFICATIONS_MOBILE_UNREAD}
        />
      </div>
    </Link>
  );
}
