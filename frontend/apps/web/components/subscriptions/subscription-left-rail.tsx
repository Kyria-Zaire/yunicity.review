"use client";

import {
  SUBSCRIPTION_HELP_BODY,
  SUBSCRIPTION_HELP_CTA,
  SUBSCRIPTION_HELP_TITLE,
  SUBSCRIPTION_LEFT_CONTRIBUTIONS,
  SUBSCRIPTION_LEFT_DISCUSSIONS,
  SUBSCRIPTION_LEFT_HOME,
  SUBSCRIPTION_LEFT_NEARBY,
  SUBSCRIPTION_LEFT_POPULAR,
  SUBSCRIPTION_LEFT_SAVED,
  SUBSCRIPTION_LEFT_SUBSCRIPTIONS,
  SUBSCRIPTION_PROMO_BODY,
  SUBSCRIPTION_PROMO_CTA,
  SUBSCRIPTION_PROMO_TITLE,
} from "@yunicity/utils";
import {
  Bookmark,
  Headphones,
  Home,
  MapPin,
  MessageCircle,
  PenLine,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";

const NAV = [
  { href: "/feed", label: SUBSCRIPTION_LEFT_HOME, icon: Home, active: false },
  { href: "/subscriptions", label: SUBSCRIPTION_LEFT_SUBSCRIPTIONS, icon: Users, active: true },
  { href: "/feed", label: SUBSCRIPTION_LEFT_POPULAR, icon: Star, active: false },
  { href: "/map", label: SUBSCRIPTION_LEFT_NEARBY, icon: MapPin, active: false },
  { href: "/feed", label: SUBSCRIPTION_LEFT_DISCUSSIONS, icon: MessageCircle, active: false },
  { href: "/feed", label: SUBSCRIPTION_LEFT_CONTRIBUTIONS, icon: PenLine, active: false },
  { href: "/events", label: SUBSCRIPTION_LEFT_SAVED, icon: Bookmark, active: false },
] as const;

export function SubscriptionLeftRail() {
  return (
    <aside className="hidden w-56 shrink-0 xl:block">
      <div className="sticky top-24 space-y-5">
        <nav className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      item.active
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

        <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-sm">
          <h2 className="text-base font-bold">{SUBSCRIPTION_PROMO_TITLE}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">{SUBSCRIPTION_PROMO_BODY}</p>
          <a
            href="#subscription-plans"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-neutral-100"
          >
            {SUBSCRIPTION_PROMO_CTA}
          </a>
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-neutral-50 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-yunicity-primary" aria-hidden />
            <h2 className="text-sm font-bold text-neutral-900">{SUBSCRIPTION_HELP_TITLE}</h2>
          </div>
          <p className="mt-2 text-sm text-neutral-600">{SUBSCRIPTION_HELP_BODY}</p>
          <Link
            href="/settings"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-yunicity-primary bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            {SUBSCRIPTION_HELP_CTA}
          </Link>
        </section>
      </div>
    </aside>
  );
}
