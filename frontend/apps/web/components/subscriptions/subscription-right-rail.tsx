"use client";

import type { SubscriptionCommunityStats } from "@yunicity/types";
import {
  SUBSCRIPTION_PLUS_BENEFIT_HIGHLIGHTS,
  SUBSCRIPTION_BENEFITS_TITLE,
  SUBSCRIPTION_COMMUNITY_BODY,
  SUBSCRIPTION_COMMUNITY_COUNT,
  SUBSCRIPTION_COMMUNITY_TITLE,
  SUBSCRIPTION_PAYMENT_METHODS_TITLE,
  SUBSCRIPTION_SECURITY_BODY,
  SUBSCRIPTION_SECURITY_LINK,
  SUBSCRIPTION_SECURITY_TITLE,
} from "@yunicity/utils";
import {
  BadgeCheck,
  CalendarClock,
  Crown,
  Filter,
  MessageCircleHeart,
  Shield,
} from "lucide-react";
import Link from "next/link";

const BENEFIT_ICONS = {
  messages: MessageCircleHeart,
  tonight: CalendarClock,
  filters: Filter,
  early: CalendarClock,
  badge: BadgeCheck,
} as const;

type SubscriptionRightRailProps = {
  community: SubscriptionCommunityStats | null;
};

export function SubscriptionRightRail({ community }: SubscriptionRightRailProps) {
  const count = community?.supporter_count ?? 0;
  const avatars = community?.avatars ?? [];

  return (
    <>
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-sm">
        <Crown className="h-6 w-6 text-amber-300" aria-hidden />
        <h2 className="mt-3 text-lg font-bold">{SUBSCRIPTION_COMMUNITY_TITLE}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/90">{SUBSCRIPTION_COMMUNITY_BODY}</p>
        {avatars.length > 0 ? (
          <div className="mt-4 flex items-center">
            <div className="flex -space-x-2">
              {avatars.map((avatar) => (
                <span
                  key={avatar.display_name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-indigo-600 bg-white/20 text-xs font-bold"
                  title={avatar.display_name}
                >
                  {avatar.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar.avatar_url}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    avatar.display_name.slice(0, 1).toUpperCase()
                  )}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <p className="mt-3 text-sm font-medium text-white/95">
          {count > 0
            ? SUBSCRIPTION_COMMUNITY_COUNT(count)
            : "Soyez parmi les premiers à soutenir Yunicity."}
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{SUBSCRIPTION_BENEFITS_TITLE}</h2>
        <ul className="mt-3 space-y-3">
          {SUBSCRIPTION_PLUS_BENEFIT_HIGHLIGHTS.map((item: (typeof SUBSCRIPTION_PLUS_BENEFIT_HIGHLIGHTS)[number]) => {
            const Icon = BENEFIT_ICONS[item.id as keyof typeof BENEFIT_ICONS] ?? BadgeCheck;
            return (
              <li key={item.id} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">{item.title}</span>
                  <span className="block text-xs text-neutral-500">{item.description}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{SUBSCRIPTION_PAYMENT_METHODS_TITLE}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {["Visa", "Mastercard", "Apple Pay", "PayPal"].map((label) => (
            <span
              key={label}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-center text-xs font-semibold text-neutral-700"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
          <div>
            <h2 className="text-sm font-bold text-neutral-900">{SUBSCRIPTION_SECURITY_TITLE}</h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              {SUBSCRIPTION_SECURITY_BODY}
            </p>
            <Link
              href="/settings"
              className="mt-2 inline-flex text-xs font-semibold text-yunicity-primary hover:underline"
            >
              {SUBSCRIPTION_SECURITY_LINK} →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
