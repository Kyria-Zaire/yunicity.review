"use client";

import type { FeedPortalView } from "@yunicity/utils";
import {
  FEED_PORTAL_CTA_BODY,
  FEED_PORTAL_CTA_BUTTON,
  FEED_PORTAL_CTA_TITLE,
  FEED_PORTAL_INTERESTS_MANAGE,
  FEED_PORTAL_INTERESTS_SEE_ALL,
  FEED_PORTAL_INTERESTS_TITLE,
  FEED_PORTAL_LEFT_CONTRIBUTIONS,
  FEED_PORTAL_LEFT_DISCUSSIONS,
  FEED_PORTAL_LEFT_HOME,
  FEED_PORTAL_LEFT_NEARBY,
  FEED_PORTAL_LEFT_POPULAR,
  FEED_PORTAL_LEFT_SAVED,
  FEED_PORTAL_LEFT_SUBSCRIPTIONS,
  INTEREST_LABELS,
} from "@yunicity/utils";
import {
  Bookmark,
  CircleDot,
  Coffee,
  Home,
  Leaf,
  MapPin,
  MessageCircle,
  PenLine,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";

type FeedLeftNavId =
  | FeedPortalView
  | "home"
  | "discussions"
  | "stories"
  | "contributions"
  | "saved"
  | "subscriptions"
  | "nearby"
  | null;

type FeedLeftRailProps = {
  activeView: FeedPortalView;
  leftNav: FeedLeftNavId;
  onNavSelect: (nav: FeedLeftNavId) => void;
  interests: string[];
  onCreatePost: () => void;
};

const NAV_ITEMS: Array<{
  id: FeedLeftNavId;
  label: string;
  icon: typeof Users;
  view?: FeedPortalView;
  href?: string;
}> = [
  { id: "home", label: FEED_PORTAL_LEFT_HOME, icon: Home, href: "/feed" },
  { id: "subscriptions", label: FEED_PORTAL_LEFT_SUBSCRIPTIONS, icon: Users, href: "/subscriptions" },
  { id: "popular", label: FEED_PORTAL_LEFT_POPULAR, icon: Star, view: "popular" },
  { id: "nearby", label: FEED_PORTAL_LEFT_NEARBY, icon: MapPin, href: "/map" },
  {
    id: "discussions",
    label: FEED_PORTAL_LEFT_DISCUSSIONS,
    icon: MessageCircle,
    href: "/discussions",
  },
  { id: "stories", label: "Stories", icon: CircleDot, href: "/stories" },
  { id: "contributions", label: FEED_PORTAL_LEFT_CONTRIBUTIONS, icon: PenLine },
  { id: "saved", label: FEED_PORTAL_LEFT_SAVED, icon: Bookmark },
];

export function FeedLeftRail({
  activeView,
  leftNav,
  onNavSelect,
  interests,
  onCreatePost,
}: FeedLeftRailProps) {
  return (
    <aside className="hidden w-56 shrink-0 xl:block">
      <div className="sticky top-24 space-y-5">
        <nav className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                (item.id === "home" && leftNav === null) ||
                leftNav === item.id ||
                (item.view != null && activeView === item.view && leftNav === null);
              return (
                <li key={item.id ?? item.label}>
                  {item.href ? (
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavSelect(item.view ?? item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                        active
                          ? "bg-[#EEF0FF] text-yunicity-primary"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="rounded-2xl bg-yunicity-primary p-5 text-white shadow-sm">
          <h2 className="text-base font-bold">{FEED_PORTAL_CTA_TITLE}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/85">{FEED_PORTAL_CTA_BODY}</p>
          <button
            type="button"
            onClick={onCreatePost}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-neutral-100"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yunicity-primary text-white">
              +
            </span>
            {FEED_PORTAL_CTA_BUTTON}
          </button>
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-neutral-900">{FEED_PORTAL_INTERESTS_TITLE}</h2>
            <Link href="/settings" className="text-xs font-semibold text-yunicity-primary hover:underline">
              {FEED_PORTAL_INTERESTS_MANAGE}
            </Link>
          </div>
          {interests.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {interests.slice(0, 5).map((interest) => (
                <li key={interest} className="flex items-center gap-2 text-sm text-neutral-700">
                  <InterestIcon interest={interest} />
                  {INTEREST_LABELS[interest] ?? interest}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              Ajoutez vos centres d&apos;intérêt dans les paramètres.
            </p>
          )}
          <Link
            href="/settings"
            className="mt-3 inline-flex text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {FEED_PORTAL_INTERESTS_SEE_ALL}
          </Link>
        </section>
      </div>
    </aside>
  );
}

function InterestIcon({ interest }: { interest: string }) {
  const className = "h-4 w-4 text-yunicity-primary";
  if (interest === "food") return <Coffee className={className} aria-hidden />;
  if (interest === "culture" || interest === "art") return <Star className={className} aria-hidden />;
  if (interest === "sports" || interest === "fitness") return <Leaf className={className} aria-hidden />;
  return <Star className={className} aria-hidden />;
}
