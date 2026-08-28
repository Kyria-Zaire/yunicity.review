"use client";

import { NotificationBellIcon, notificationAriaLabel } from "@/components/layout/notification-bell-icon";
import { ExplorerTriggerButton } from "@/components/explorer";
import { CreateHubTriggerButton } from "@/components/create-hub/create-hub-trigger-button";
import { CitizenAccountMenu } from "@/components/layout/citizen-account-menu";
import { CitizenYunicityMenu } from "@/components/layout/citizen-yunicity-menu";
import { YunicityLogo } from "@/components/brand";
import {
  WEB_CITIZEN_TOP_NAV_CENTER,
  WEB_CITIZEN_TOP_NAV_UTILITY,
  isWebNavActive,
  type WebNavItem,
} from "@/lib/layout/web-layout-config";
import { destinationControlId } from "@/lib/layout/desktop-header-geometry";
import { useCitizenChrome } from "@/hooks/use-citizen-chrome";
import Link from "next/link";
import { usePathname } from "next/navigation";

function TopNavLink({
  item,
  pathname,
  badge,
}: {
  item: WebNavItem;
  pathname: string;
  badge?: number;
}) {
  const active = isWebNavActive(pathname, item);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      data-yunicity-header-control={destinationControlId(item.href)}
      className={`relative shrink-0 whitespace-nowrap px-1.5 py-2 text-sm font-medium transition-colors xl:px-2 ${
        active ? "text-yunicity-primary" : "text-yunicity-primary hover:text-yunicity-primary-hover"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        {item.label}
        {badge && badge > 0 ? (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF2D78] px-1 text-[10px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      {active ? (
        <span
          className="absolute inset-x-1 -bottom-[1.125rem] h-0.5 rounded-full bg-yunicity-primary"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

function NotificationsTopNavLink({
  item,
  pathname,
  badge,
}: {
  item: WebNavItem;
  pathname: string;
  badge?: number;
}) {
  const active = isWebNavActive(pathname, item);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={notificationAriaLabel(item.label, badge ?? 0)}
      data-yunicity-header-control="notifications"
      className={`relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-2 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${
        active ? "text-yunicity-primary" : ""
      }`}
      title={item.label}
    >
      <NotificationBellIcon
        unreadCount={badge ?? 0}
        withTestMarkers
        iconClassName={`h-5 w-5 shrink-0 ${active ? "text-yunicity-primary" : "text-neutral-900"}`}
      />
      {/* R2F — l'ecart avec la cloche est une MARGE, pas un padding : la boite du
          libellé etait jointive au wrapper, donc tout badge debordant du wrapper
          la recouvrait (mesure R2E : 4px a 1536 et 1920). */}
      <span
        data-yunicity-header-label="notifications"
        data-notification-label=""
        className="hidden whitespace-nowrap 2xl:ml-2 2xl:inline"
      >
        {item.label}
      </span>
      {active ? (
        <span
          className="absolute inset-x-2 -bottom-[1.125rem] hidden h-0.5 rounded-full bg-yunicity-primary 2xl:block"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

/** Top nav desktop (xl+) — remplace la sidebar compacte sur feed, carte, etc. */
export function CitizenTopNav() {
  const pathname = usePathname();
  const { unreadCount: unread } = useCitizenChrome();

  return (
    <>
      <header className="citizen-top-nav z-40 hidden border-b border-neutral-200/90 bg-white/95 backdrop-blur-md">
        <div className="citizen-top-nav-inner mx-auto grid h-[4.25rem] max-w-[1400px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 xl:gap-3 xl:px-6">
        <div
          className="inline-flex min-h-11 shrink-0 items-center"
          data-yunicity-header-control="logo"
        >
          <YunicityLogo href="/feed" size="sm" showWordmark priority />
        </div>

        <nav
          className="min-w-0 justify-self-center overflow-hidden"
          aria-label="Navigation principale"
        >
          <div className="flex min-w-0 items-center justify-center gap-0.5 xl:gap-1">
            {WEB_CITIZEN_TOP_NAV_CENTER.map((item) => (
              <TopNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </nav>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 xl:gap-2">
          <ExplorerTriggerButton variant="desktop-text" />

          <CreateHubTriggerButton variant="nav" />

          <CitizenYunicityMenu variant="top-nav" />

          <nav
            className="flex items-center border-r border-neutral-200 pr-1.5 xl:pr-2"
            aria-label="Notifications"
          >
            {WEB_CITIZEN_TOP_NAV_UTILITY.map((item) => (
              <NotificationsTopNavLink
                key={item.href}
                item={item}
                pathname={pathname}
                badge={item.href === "/notifications" ? unread : undefined}
              />
            ))}
          </nav>

          <CitizenAccountMenu variant="top-nav" />
        </div>
        </div>
      </header>
      <div className="citizen-top-nav-spacer" aria-hidden="true" />
    </>
  );
}
