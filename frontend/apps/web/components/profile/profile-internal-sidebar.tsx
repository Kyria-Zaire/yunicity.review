"use client";

import type { ProfilePortalNavId } from "@yunicity/utils";
import type { ProfileImpactLabel } from "@yunicity/utils";
import {
  PROFILE_PORTAL_IMPACT_BODY,
  PROFILE_PORTAL_IMPACT_CTA,
  PROFILE_PORTAL_IMPACT_LABEL,
  PROFILE_PORTAL_IMPACT_TITLE,
  PROFILE_PORTAL_NAV_ACTIVITY,
  PROFILE_PORTAL_NAV_BADGES,
  PROFILE_PORTAL_NAV_EVENTS,
  PROFILE_PORTAL_NAV_FAVORITES,
  PROFILE_PORTAL_NAV_PROFILE,
  PROFILE_PORTAL_NAV_SETTINGS,
  PROFILE_PORTAL_NAV_TRIBES,
  PROFILE_PORTAL_PAGE_TITLE,
  PROFILE_PORTAL_SUBTITLE,
} from "@yunicity/utils";
import {
  Award,
  CalendarDays,
  Settings2,
  Sparkles,
  Star,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: { id: ProfilePortalNavId; label: string; icon: LucideIcon; targetId: string }[] =
  [
    { id: "overview", label: PROFILE_PORTAL_NAV_PROFILE, icon: User, targetId: "profile-overview" },
    { id: "activity", label: PROFILE_PORTAL_NAV_ACTIVITY, icon: Sparkles, targetId: "profile-activity" },
    { id: "favorites", label: PROFILE_PORTAL_NAV_FAVORITES, icon: Star, targetId: "profile-favorites" },
    { id: "events", label: PROFILE_PORTAL_NAV_EVENTS, icon: CalendarDays, targetId: "profile-activity" },
    { id: "tribes", label: PROFILE_PORTAL_NAV_TRIBES, icon: Users, targetId: "profile-tribes" },
    { id: "badges", label: PROFILE_PORTAL_NAV_BADGES, icon: Award, targetId: "profile-badges" },
    { id: "settings", label: PROFILE_PORTAL_NAV_SETTINGS, icon: Settings2, targetId: "profile-settings" },
  ];

type ProfileInternalSidebarProps = {
  impact: ProfileImpactLabel;
  onNavigate: (targetId: string) => void;
};

export function ProfileInternalSidebar({ impact, onNavigate }: ProfileInternalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-2">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{PROFILE_PORTAL_PAGE_TITLE}</h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{PROFILE_PORTAL_SUBTITLE}</p>
        </div>

        <nav className="mt-6 space-y-0.5" aria-label="Navigation profil">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            if (item.id === "settings") {
              return (
                <Link
                  key={item.id}
                  href="/settings"
                  aria-current={pathname.startsWith("/settings") ? "page" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-yunicity-primary/10 hover:text-yunicity-primary ${
                    pathname.startsWith("/settings")
                      ? "bg-yunicity-primary-soft text-yunicity-primary"
                      : "text-neutral-700"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.targetId)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-neutral-700 transition hover:bg-yunicity-primary/10 hover:text-yunicity-primary"
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] p-5 text-white shadow-md">
          <p className="text-sm font-semibold">{PROFILE_PORTAL_IMPACT_TITLE}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/80">{PROFILE_PORTAL_IMPACT_BODY}</p>
          <div className="relative mx-auto mt-5 flex h-28 w-28 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="rgba(147,197,253,0.95)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(impact.percent / 100) * 327} 327`}
              />
            </svg>
            <div className="text-center px-1">
              <p className={`font-bold leading-tight text-white ${impact.showPercent ? "text-2xl" : "text-sm"}`}>
                {impact.primary}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-white/75">
                {impact.showPercent ? impact.secondary : impact.secondary}
              </p>
              {!impact.showPercent ? (
                <p className="mt-1 text-[10px] text-white/60">{PROFILE_PORTAL_IMPACT_LABEL}</p>
              ) : null}
            </div>
          </div>
          <Link
            href="/passport"
            className="mt-4 flex w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            {PROFILE_PORTAL_IMPACT_CTA}
          </Link>
        </div>
      </div>
    </aside>
  );
}
