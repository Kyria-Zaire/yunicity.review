"use client";

import type { TribesMobileMemberRow } from "@yunicity/utils";
import {
  TRIBES_MOBILE_MY_EMPTY,
  TRIBES_MOBILE_MY_MANAGE,
  TRIBES_MOBILE_MY_TITLE,
  tribeDiscoveryTheme,
} from "@yunicity/utils";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Camera,
  ChevronRight,
  Heart,
  Music,
  Rocket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

function TribeListIcon({ category }: { category: string }) {
  const theme = tribeDiscoveryTheme(category);
  const className = "h-5 w-5 text-white";
  const icons: Record<string, ReactNode> = {
    motion: <Rocket className={className} aria-hidden />,
    photo: <Camera className={className} aria-hidden />,
    culture: <Music className={className} aria-hidden />,
    heart: <Heart className={className} aria-hidden />,
    students: <Users className={className} aria-hidden />,
    music: <Music className={className} aria-hidden />,
    book: <BookOpen className={className} aria-hidden />,
    users: <Users className={className} aria-hidden />,
  };

  const bg =
    theme.icon === "motion"
      ? "bg-emerald-500"
      : theme.icon === "photo"
        ? "bg-pink-500"
        : theme.icon === "music" || theme.icon === "culture"
          ? "bg-violet-500"
          : theme.icon === "students"
            ? "bg-sky-500"
            : theme.icon === "heart"
              ? "bg-amber-500"
              : "bg-yunicity-primary";

  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${bg}`}
    >
      {icons[theme.icon] ?? icons.users}
    </span>
  );
}

type TribesMobileMyTribesListProps = {
  rows: TribesMobileMemberRow[];
};

/** Section « Mes tribus » mobile (MOBILE-TRIBES-01). */
export function TribesMobileMyTribesList({ rows }: TribesMobileMyTribesListProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? rows : rows.slice(0, 4);

  return (
    <section
      id="tribes-mobile-my"
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
        <h2 className="text-base font-bold text-neutral-900">{TRIBES_MOBILE_MY_TITLE}</h2>
        {rows.length > 4 && !showAll ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm font-semibold text-yunicity-primary"
          >
            {TRIBES_MOBILE_MY_MANAGE}
          </button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-neutral-600">{TRIBES_MOBILE_MY_EMPTY}</p>
      ) : (
        <ul>
          {visibleRows.map((row, index) => (
            <li key={row.id} className={index > 0 ? "border-t border-neutral-100" : undefined}>
              <Link
                href={row.href}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50/80"
              >
                <TribeListIcon category={row.category} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-neutral-900">{row.name}</p>
                    {row.isFeatured ? (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-yunicity-primary" aria-hidden />
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {row.memberCountLabel} · {row.lastActivityLabel}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-400">
                    <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  </span>
                  <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
