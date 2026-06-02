"use client";

import {
  PROFILE_PORTAL_NAV_ACTIVITY,
  PROFILE_PORTAL_NAV_BADGES,
  PROFILE_PORTAL_NAV_EVENTS,
  PROFILE_PORTAL_NAV_FAVORITES,
  PROFILE_PORTAL_NAV_PROFILE,
  PROFILE_PORTAL_NAV_SETTINGS,
  PROFILE_PORTAL_NAV_TRIBES,
  SETTINGS_LOGOUT,
  SETTINGS_SIDEBAR_HELP_BODY,
  SETTINGS_SIDEBAR_HELP_CTA,
  SETTINGS_SIDEBAR_HELP_TITLE,
  SETTINGS_SIDEBAR_TITLE,
  settingsSectionDomId,
} from "@yunicity/utils";
import {
  Award,
  Bell,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  LogOut,
  Settings2,
  Sparkles,
  Star,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-provider";

type NavLinkItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
  badge?: number;
};

type SettingsInternalSidebarProps = {
  unreadCount: number;
  onScrollToHelp: () => void;
};

function SidebarLink({ item }: { item: NavLinkItem }) {
  const Icon = item.icon;
  const className = `flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
    item.active
      ? "bg-yunicity-primary-soft text-yunicity-primary"
      : "text-neutral-700 hover:bg-white"
  }`;

  return (
    <Link href={item.href} className={className} aria-current={item.active ? "page" : undefined}>
      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge && item.badge > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-yunicity-primary px-1 text-[10px] font-bold text-white">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function SettingsInternalSidebar({
  unreadCount,
  onScrollToHelp,
}: SettingsInternalSidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const profileLinks: NavLinkItem[] = [
    { label: PROFILE_PORTAL_NAV_PROFILE, icon: User, href: "/profile/me" },
    { label: PROFILE_PORTAL_NAV_ACTIVITY, icon: ClipboardList, href: "/profile/me#profile-activity" },
    { label: PROFILE_PORTAL_NAV_FAVORITES, icon: Star, href: "/profile/me#profile-favorites" },
    { label: PROFILE_PORTAL_NAV_EVENTS, icon: CalendarDays, href: "/profile/me#profile-events" },
    { label: PROFILE_PORTAL_NAV_TRIBES, icon: Users, href: "/profile/me#profile-tribes" },
    { label: PROFILE_PORTAL_NAV_BADGES, icon: Award, href: "/profile/me#profile-badges" },
    {
      label: PROFILE_PORTAL_NAV_SETTINGS,
      icon: Settings2,
      href: "/settings",
      active: true,
    },
  ];

  const utilityLinks: NavLinkItem[] = [
    {
      label: "Notifications",
      icon: Bell,
      href: "/notifications",
      badge: unreadCount,
    },
    {
      label: "Aide & support",
      icon: CircleHelp,
      href: `#${settingsSectionDomId("help")}`,
    },
  ];

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-2">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{SETTINGS_SIDEBAR_TITLE}</h2>
        </div>

        <nav className="mt-6 space-y-0.5" aria-label="Navigation compte">
          {profileLinks.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </nav>

        <nav className="mt-4 space-y-0.5 border-t border-neutral-200/70 pt-4" aria-label="Utilitaires">
          {utilityLinks.map((item) =>
            item.label === "Aide & support" ? (
              <button
                key={item.label}
                type="button"
                onClick={onScrollToHelp}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium text-neutral-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
              >
                <CircleHelp className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {item.label}
              </button>
            ) : (
              <SidebarLink key={item.href} item={item} />
            ),
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium text-neutral-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {SETTINGS_LOGOUT}
          </button>
        </nav>

        <div className="mt-8 rounded-2xl bg-[#EEF0FF] p-5">
          <Sparkles className="h-8 w-8 text-yunicity-primary" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-neutral-900">{SETTINGS_SIDEBAR_HELP_TITLE}</p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{SETTINGS_SIDEBAR_HELP_BODY}</p>
          <button
            type="button"
            onClick={onScrollToHelp}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            {SETTINGS_SIDEBAR_HELP_CTA}
          </button>
        </div>
      </div>
    </aside>
  );
}
