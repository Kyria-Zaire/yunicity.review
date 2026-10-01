"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { ProfileTimelineItem } from "@yunicity/utils";
import {
  PROFILE_DESKTOP_ACTIVITY_CTA,
  PROFILE_DESKTOP_ACTIVITY_EMPTY,
  PROFILE_DESKTOP_ACTIVITY_TITLE,
  resolveProfileDesktopActivityKindLabel,
} from "@yunicity/utils";
import {
  Award,
  Building2,
  CalendarDays,
  Gift,
  Pencil,
  Stamp,
} from "lucide-react";
import Link from "next/link";

const KIND_STYLE = {
  post: { icon: Pencil, className: "bg-violet-100 text-violet-700" },
  event_saved: { icon: CalendarDays, className: "bg-emerald-100 text-emerald-700" },
  event_interest: { icon: CalendarDays, className: "bg-emerald-100 text-emerald-700" },
  stamp: { icon: Building2, className: "bg-violet-100 text-violet-700" },
  badge_earned: { icon: Award, className: "bg-amber-100 text-amber-700" },
  passport_activated: { icon: Stamp, className: "bg-orange-100 text-orange-700" },
} as const;

type ProfileDesktopActivityProps = {
  timeline: ProfileTimelineItem[];
  maxItems?: number;
  showCta?: boolean;
  onViewAll?: () => void;
};

function ActivityRow({ item, isLast }: { item: ProfileTimelineItem; isLast: boolean }) {
  const style = KIND_STYLE[item.kind];
  const Icon = style.icon;
  const kindLabel = resolveProfileDesktopActivityKindLabel(item.kind);

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast ? (
        <span
          className="absolute left-[1.05rem] top-10 bottom-0 w-px bg-neutral-200"
          aria-hidden
        />
      ) : null}
      <span
        className={`relative z-[1] inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.className}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <Link href={item.href} className="group min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
              <span className="text-neutral-500">{kindLabel}</span>
              <span className="text-neutral-300" aria-hidden>
                {" "}
                ·{" "}
              </span>
              <span>{item.description}</span>
            </p>
          </div>
          {item.imageUrl ? (
            <div className="relative hidden h-12 w-16 shrink-0 overflow-hidden rounded-lg sm:block">
              <CulturalImage
                src={item.imageUrl}
                alt=""
                placeName={item.description}
                className="size-full"
                sizes="64px"
                showFallbackCaption={false}
                overlay={false}
              />
            </div>
          ) : (
            <time className="shrink-0 pt-0.5 text-xs text-neutral-400 sm:min-w-[5.5rem] sm:text-right">
              {item.timestampLabel}
            </time>
          )}
        </div>
        {item.imageUrl ? (
          <time className="mt-1 block text-xs text-neutral-400">{item.timestampLabel}</time>
        ) : null}
      </Link>
    </li>
  );
}

/** Timeline activité locale — maquette profil (libellé · sujet + vignette). */
export function ProfileDesktopActivity({
  timeline,
  maxItems = 6,
  showCta = true,
  onViewAll,
}: ProfileDesktopActivityProps) {
  const items = timeline.slice(0, maxItems);

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5"
      data-profile-desktop-activity=""
    >
      <h2 className="text-base font-bold text-neutral-900">{PROFILE_DESKTOP_ACTIVITY_TITLE}</h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-neutral-500">{PROFILE_DESKTOP_ACTIVITY_EMPTY}</p>
      ) : (
        <ol className="mt-4 space-y-0">{items.map((item, index) => (
            <ActivityRow key={item.id} item={item} isLast={index === items.length - 1} />
          ))}</ol>
      )}

      {showCta && items.length > 0 && onViewAll ? (
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
          onClick={onViewAll}
        >
          {PROFILE_DESKTOP_ACTIVITY_CTA} →
        </button>
      ) : null}
    </section>
  );
}
