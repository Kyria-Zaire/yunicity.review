"use client";

import type { ProfileTimelineItem } from "@yunicity/utils";
import {
  PROFILE_DESKTOP_ACTIVITY_EMPTY,
  PROFILE_DESKTOP_ACTIVITY_TITLE,
  PROFILE_MEDIUM_ACTIVITY_SEE_ALL,
  resolveProfileDesktopActivityKindLabel,
} from "@yunicity/utils";
import {
  Award,
  Building2,
  CalendarDays,
  ClipboardList,
  Pencil,
  Tag,
} from "lucide-react";
import Link from "next/link";

const KIND_STYLE = {
  post: { icon: Pencil, className: "bg-violet-100 text-violet-700" },
  event_saved: { icon: CalendarDays, className: "bg-emerald-100 text-emerald-700" },
  event_interest: { icon: CalendarDays, className: "bg-emerald-100 text-emerald-700" },
  stamp: { icon: Building2, className: "bg-sky-100 text-sky-700" },
  badge_earned: { icon: Award, className: "bg-amber-100 text-amber-700" },
  passport_activated: { icon: Tag, className: "bg-orange-100 text-orange-700" },
} as const;

function formatMediumActivityDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

type ProfileMediumActivityProps = {
  timeline: ProfileTimelineItem[];
  maxItems?: number;
  onViewAll?: () => void;
};

function ActivityRow({ item, isLast }: { item: ProfileTimelineItem; isLast: boolean }) {
  const style = KIND_STYLE[item.kind] ?? { icon: ClipboardList, className: "bg-neutral-100 text-neutral-600" };
  const Icon = style.icon;
  const kindLabel = resolveProfileDesktopActivityKindLabel(item.kind);
  const dateLabel = formatMediumActivityDate(item.sortAt) || item.timestampLabel;

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast ? (
        <span
          className="absolute left-[1.05rem] top-10 bottom-0 w-px bg-sky-100"
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
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500">{kindLabel}</p>
            <p className="mt-0.5 text-sm font-bold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
              {item.description}
            </p>
          </div>
          <time className="shrink-0 pt-0.5 text-xs text-neutral-400">{dateLabel}</time>
        </div>
      </Link>
    </li>
  );
}

/** Activité locale — timeline maquette medium. */
export function ProfileMediumActivity({
  timeline,
  maxItems = 4,
  onViewAll,
}: ProfileMediumActivityProps) {
  const items = timeline.slice(0, maxItems);

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5"
      data-profile-medium-activity=""
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_DESKTOP_ACTIVITY_TITLE}</h2>
        {items.length > 0 && onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_MEDIUM_ACTIVITY_SEE_ALL} →
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-neutral-500">{PROFILE_DESKTOP_ACTIVITY_EMPTY}</p>
      ) : (
        <ol className="mt-4 space-y-0">
          {items.map((item, index) => (
            <ActivityRow key={item.id} item={item} isLast={index === items.length - 1} />
          ))}
        </ol>
      )}
    </section>
  );
}
