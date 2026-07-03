"use client";

import { CitizenAccountMenu } from "@/components/layout/citizen-account-menu";
import { YunicityLogo } from "@/components/brand";
import {
  WEB_CITIZEN_TOP_NAV_CENTER,
  WEB_CITIZEN_TOP_NAV_UTILITY,
  isWebNavActive,
  type WebNavItem,
} from "@/lib/layout/web-layout-config";
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
      className={`relative shrink-0 whitespace-nowrap px-2 py-2 text-sm font-medium transition-colors xl:px-2.5 ${
        active ? "text-yunicity-primary" : "text-neutral-600 hover:text-neutral-900"
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

/** Top nav desktop (xl+) — remplace la sidebar compacte sur feed, carte, etc. */
export function CitizenTopNav() {
  const pathname = usePathname();
  const { unreadCount: unread } = useCitizenChrome();

  return (
    <header className="citizen-top-nav sticky top-0 z-40 hidden border-b border-neutral-200/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-[1400px] items-center gap-6 px-6">
        <YunicityLogo href="/feed" size="sm" showWordmark priority />

        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] xl:gap-1.5 [&::-webkit-scrollbar]:hidden"
          aria-label="Navigation principale"
        >
          {WEB_CITIZEN_TOP_NAV_CENTER.map((item) => (
            <TopNavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 xl:gap-3">
          <nav
            className="hidden items-center gap-0.5 border-r border-neutral-200 pr-2 lg:flex xl:gap-1 xl:pr-3"
            aria-label="Compte et lieux"
          >
            {WEB_CITIZEN_TOP_NAV_UTILITY.map((item) => (
              <TopNavLink
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
  );
}
