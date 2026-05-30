"use client";

import {
  DISCUSSIONS_CTA_BODY,
  DISCUSSIONS_CTA_BUTTON,
  DISCUSSIONS_CTA_TITLE,
  DISCUSSIONS_LEFT_CONTRIBUTIONS,
  DISCUSSIONS_LEFT_DISCUSSIONS,
  DISCUSSIONS_LEFT_HOME,
  DISCUSSIONS_LEFT_NEARBY,
  DISCUSSIONS_LEFT_POPULAR,
  DISCUSSIONS_LEFT_SAVED,
  DISCUSSIONS_LEFT_SUBSCRIPTIONS,
  DISCUSSIONS_TRIBES_CTA,
  DISCUSSIONS_TRIBES_EMPTY,
  DISCUSSIONS_TRIBES_MORE,
  DISCUSSIONS_TRIBES_TITLE,
  buildDiscussionTribeSidebarItems,
} from "@yunicity/utils";
import type { Tribe } from "@yunicity/types";
import {
  Bookmark,
  Home,
  MapPin,
  MessageCircle,
  PenLine,
  Plus,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";

const NAV = [
  { href: "/feed", label: DISCUSSIONS_LEFT_HOME, icon: Home, section: "home" as const },
  { href: "/subscriptions", label: DISCUSSIONS_LEFT_SUBSCRIPTIONS, icon: Users, section: "subscriptions" as const },
  { href: "/feed", label: DISCUSSIONS_LEFT_POPULAR, icon: Star, section: "popular" as const },
  { href: "/map", label: DISCUSSIONS_LEFT_NEARBY, icon: MapPin, section: "nearby" as const },
  { href: "/discussions", label: DISCUSSIONS_LEFT_DISCUSSIONS, icon: MessageCircle, section: "discussions" as const },
  { href: "/feed", label: DISCUSSIONS_LEFT_CONTRIBUTIONS, icon: PenLine, section: "contributions" as const },
  { href: "/events", label: DISCUSSIONS_LEFT_SAVED, icon: Bookmark, section: "saved" as const },
] as const;

type DiscussionsLeftRailProps = {
  city: string;
  tribes: Tribe[];
  activeSection?: "discussions" | "new";
};

export function DiscussionsLeftRail({
  city,
  tribes,
  activeSection = "discussions",
}: DiscussionsLeftRailProps) {
  const tribeSidebar = buildDiscussionTribeSidebarItems({ city, tribes });

  return (
    <aside className="hidden w-56 shrink-0 xl:block">
      <div className="sticky top-24 space-y-5">
        <nav className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                item.section === "discussions" &&
                (activeSection === "discussions" || activeSection === "new");
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[#EEF0FF] text-yunicity-primary"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="rounded-2xl bg-yunicity-primary p-5 text-white shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/30">
            <MessageCircle className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="text-center text-base font-bold">{DISCUSSIONS_CTA_TITLE}</h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-white/90">
            {DISCUSSIONS_CTA_BODY}
          </p>
          <Link
            href="/discussions/new"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-neutral-100"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {DISCUSSIONS_CTA_BUTTON}
          </Link>
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-neutral-900">{DISCUSSIONS_TRIBES_TITLE}</h2>
            <Link href="/tribes" className="text-xs font-semibold text-yunicity-primary hover:underline">
              {DISCUSSIONS_TRIBES_CTA}
            </Link>
          </div>
          {tribeSidebar.visible.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">{DISCUSSIONS_TRIBES_EMPTY}</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {tribeSidebar.visible.map((tribe) => (
                <li key={tribe.id}>
                  <Link
                    href={tribe.href}
                    className="flex items-center gap-2.5 rounded-lg px-1 py-0.5 hover:bg-white"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-xs font-bold text-yunicity-primary">
                      {tribe.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
                      {tribe.name}
                    </span>
                    {tribe.hasActivity ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-yunicity-primary" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {tribeSidebar.moreCount > 0 ? (
            <Link
              href="/tribes"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
            >
              <Plus className="h-3 w-3" aria-hidden />
              {DISCUSSIONS_TRIBES_MORE(tribeSidebar.moreCount)}
            </Link>
          ) : null}
        </section>
      </div>
    </aside>
  );
}
