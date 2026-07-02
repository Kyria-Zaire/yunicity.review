"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { YunicityLogo } from "@/components/brand";
import { CreateHubTriggerButton } from "@/components/create-hub/create-hub-trigger-button";
import { WebSidebarTooltip } from "@/components/layout/web-sidebar-tooltip";
import {
  WEB_CITIZEN_NAV_PRIMARY,
  WEB_CITIZEN_NAV_SECONDARY,
  isWebNavActive,
  type WebNavItem,
} from "@/lib/layout/web-layout-config";
import { WebNavIcon } from "@/lib/layout/web-nav-icons";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCitizenChrome, useNotificationUnread } from "@/hooks/use-citizen-chrome";

/** Cible tactile 52px — icône seule, style barre X en mode compact. */
function NavIconButton({
  href,
  label,
  icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: WebNavItem["icon"];
  active: boolean;
  badge?: number;
}) {
  return (
    <WebSidebarTooltip label={label}>
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`relative flex items-center justify-center rounded-full transition-colors xl:hidden ${
          active
            ? "bg-neutral-200 text-neutral-900"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        }`}
        style={{ width: "var(--web-sidebar-icon-hit)", height: "var(--web-sidebar-icon-hit)" }}
      >
        <WebNavIcon id={icon} className="h-[26px] w-[26px]" />
        {badge && badge > 0 ? (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-yunicity-primary px-1 text-[10px] font-bold leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </Link>
    </WebSidebarTooltip>
  );
}

/** Grille commune xl : primary et secondary partagent layout + font-medium. */
const NAV_LINK_EXPANDED_LAYOUT =
  "hidden min-h-[2.75rem] w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors xl:flex";

function NavLinkExpanded({
  href,
  label,
  icon,
  active,
  size = "primary",
  badge,
}: {
  href: string;
  label: string;
  icon: WebNavItem["icon"];
  active: boolean;
  size?: "primary" | "secondary";
  badge?: number;
}) {
  const isPrimary = size === "primary";

  const toneClass = active
    ? isPrimary
      ? "bg-yunicity-primary text-[15px] font-medium leading-snug text-white shadow-sm"
      : "bg-yunicity-primary-soft text-[15px] font-medium leading-snug text-yunicity-primary"
    : "text-[15px] font-medium leading-snug text-neutral-700 hover:bg-neutral-100";

  const iconClass =
    active && isPrimary
      ? "text-white"
      : active && !isPrimary
        ? "text-yunicity-primary"
        : "text-neutral-600";

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`${NAV_LINK_EXPANDED_LAYOUT} ${toneClass}`}
    >
      <span className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center">
        <WebNavIcon id={icon} className={`h-[22px] w-[22px] ${iconClass}`} />
        {badge && badge > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-yunicity-primary px-0.5 text-[10px] font-bold text-white ring-2 ring-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  size = "primary",
  badge,
}: {
  href: string;
  label: string;
  icon: WebNavItem["icon"];
  active: boolean;
  size?: "primary" | "secondary";
  badge?: number;
}) {
  return (
    <>
      <NavIconButton href={href} label={label} icon={icon} active={active} badge={badge} />
      <NavLinkExpanded
        href={href}
        label={label}
        icon={icon}
        active={active}
        size={size}
        badge={badge}
      />
    </>
  );
}

/**
 * WEB-HOME-01C — Colonne grille gauche, sticky 100dvh, Create Hub + profil en bas.
 */
export function WebSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const unreadNotifications = useNotificationUnread();
  const { displayName } = useCitizenChrome();

  const profileLabel = displayName ?? user?.email?.split("@")[0] ?? "Mon profil";

  return (
    <aside className="web-sidebar-aside" aria-label="Navigation Yunicity">
      <div className="web-sidebar-column">
        <div className="flex shrink-0 flex-col items-center pb-2 pt-3 xl:mb-5 xl:items-stretch xl:pb-0 xl:pt-0">
          <WebSidebarTooltip label="Yunicity">
            <span
              className="flex items-center justify-center xl:justify-start"
              style={{ width: "var(--web-sidebar-icon-hit)", height: "var(--web-sidebar-icon-hit)" }}
            >
              <YunicityLogo
                href="/feed"
                size="md"
                showWordmark
                className="justify-center xl:justify-start"
                wordmarkClassName="hidden xl:inline"
              />
            </span>
          </WebSidebarTooltip>
        </div>

        <div className="web-sidebar-nav-scroll px-1 xl:px-0">
          <nav
            className="flex flex-col items-center gap-0.5 xl:items-stretch"
            aria-label="Navigation principale"
          >
            {WEB_CITIZEN_NAV_PRIMARY.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isWebNavActive(pathname, item)}
                badge={item.href === "/notifications" ? unreadNotifications : undefined}
              />
            ))}
          </nav>

          <div
            className="mx-0 my-1 hidden h-px shrink-0 bg-neutral-100 xl:mx-3 xl:block"
            aria-hidden
          />

          <nav
            className="flex flex-col items-center gap-0.5 xl:items-stretch xl:gap-0.5"
            aria-label="Navigation secondaire"
          >
            {WEB_CITIZEN_NAV_SECONDARY.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isWebNavActive(pathname, item)}
                size="secondary"
              />
            ))}
          </nav>

          <div className="mt-8 flex flex-col items-center gap-3 xl:mt-10 xl:items-stretch">
            <WebSidebarTooltip label="Créer">
              <CreateHubTriggerButton variant="sidebar-icon" className="xl:hidden" />
            </WebSidebarTooltip>
            <CreateHubTriggerButton variant="sidebar-expanded" />
          </div>
        </div>

        <div className="web-sidebar-footer border-t border-neutral-200/80 px-1 py-3 xl:px-0 xl:py-4">
          <WebSidebarTooltip label={profileLabel}>
            <Link
              href="/profile/me"
              aria-label={`Profil — ${profileLabel}`}
              className="mx-auto flex h-[var(--web-sidebar-icon-hit)] w-[var(--web-sidebar-icon-hit)] items-center justify-center rounded-full transition hover:opacity-90 xl:mx-0 xl:h-auto xl:w-auto xl:justify-start xl:gap-3 xl:rounded-xl xl:p-2 xl:hover:bg-neutral-50"
            >
              <span className="xl:hidden">
                <ProfileAvatar name={profileLabel} size="sm" />
              </span>
              <span className="hidden shrink-0 xl:inline-flex">
                <ProfileAvatar name={profileLabel} size="md" />
              </span>
              <div className="hidden min-w-0 flex-1 xl:block">
                <p className="truncate text-sm font-semibold text-neutral-900">{profileLabel}</p>
                <p className="truncate text-xs text-neutral-500">{user?.email}</p>
              </div>
            </Link>
          </WebSidebarTooltip>
        </div>
      </div>
    </aside>
  );
}

