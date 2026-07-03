"use client";

import { YunicityLogo } from "@/components/brand";
import { CreateHubTriggerButton } from "@/components/create-hub/create-hub-trigger-button";
import { CitizenAccountMenu } from "@/components/layout/citizen-account-menu";
import { CitizenYunicityMenu } from "@/components/layout/citizen-yunicity-menu";
import { WebSidebarTooltip } from "@/components/layout/web-sidebar-tooltip";
import { useNotificationUnread } from "@/hooks/use-citizen-chrome";
import { useCreateHubVisibility } from "@/hooks/use-create-hub-visibility";
import {
  WEB_CITIZEN_NOTIFICATIONS_NAV,
  WEB_CITIZEN_SIDEBAR_STRATEGIC,
  isWebNavActive,
  type WebNavItem,
} from "@/lib/layout/web-layout-config";
import { WebNavIcon } from "@/lib/layout/web-nav-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
 * WEB-HOME-01C — 4 onglets stratégiques + Menu Yunicity ; footer : Créer, Notifications, Compte.
 */
export function WebSidebar() {
  const pathname = usePathname();
  const unreadNotifications = useNotificationUnread();
  const showCreateHub = useCreateHubVisibility();
  const notificationsActive = isWebNavActive(pathname, WEB_CITIZEN_NOTIFICATIONS_NAV);

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
            {WEB_CITIZEN_SIDEBAR_STRATEGIC.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isWebNavActive(pathname, item)}
                size="primary"
              />
            ))}
            <CitizenYunicityMenu variant="sidebar" />
          </nav>
        </div>

        <div className="web-sidebar-footer flex flex-col items-center gap-0.5 border-t border-neutral-200/80 px-1 py-3 xl:items-stretch xl:px-0 xl:py-4">
          {showCreateHub ? (
            <div className="flex w-full justify-center xl:justify-stretch">
              <WebSidebarTooltip label="Créer">
                <CreateHubTriggerButton variant="sidebar-icon" />
              </WebSidebarTooltip>
            </div>
          ) : null}
          <NavItem
            href={WEB_CITIZEN_NOTIFICATIONS_NAV.href}
            label={WEB_CITIZEN_NOTIFICATIONS_NAV.label}
            icon={WEB_CITIZEN_NOTIFICATIONS_NAV.icon}
            active={notificationsActive}
            size="primary"
            badge={unreadNotifications}
          />
          <CitizenAccountMenu variant="sidebar" />
        </div>
      </div>
    </aside>
  );
}
