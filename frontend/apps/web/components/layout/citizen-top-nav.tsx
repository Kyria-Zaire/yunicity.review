"use client";

import { CreateHubTriggerButton } from "@/components/create-hub/create-hub-trigger-button";
import { CitizenAccountMenu } from "@/components/layout/citizen-account-menu";
import { CitizenYunicityMenu } from "@/components/layout/citizen-yunicity-menu";
import { YunicityLogo } from "@/components/brand";
import {
  WEB_CITIZEN_SEARCH_ACCESS,
  WEB_CITIZEN_TOP_NAV_CENTER,
  WEB_CITIZEN_TOP_NAV_UTILITY,
  isWebNavActive,
  type WebNavItem,
} from "@/lib/layout/web-layout-config";
import { useCitizenChrome } from "@/hooks/use-citizen-chrome";
import { Search } from "lucide-react";
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

/** Top nav desktop (xl+) — remplace la sidebar compacte sur feed, carte, etc. */
export function CitizenTopNav() {
  const pathname = usePathname();
  const { unreadCount: unread } = useCitizenChrome();

  return (
    <header className="citizen-top-nav sticky top-0 z-40 hidden border-b border-neutral-200/90 bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-[4.25rem] max-w-[1400px] items-center justify-between px-6">
        <div className="relative z-10 shrink-0">
          <YunicityLogo href="/feed" size="sm" showWordmark priority />
        </div>

        <nav
          className="pointer-events-none absolute inset-x-6 top-1/2 flex -translate-y-1/2 justify-center"
          aria-label="Navigation principale"
        >
          <div className="pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto [scrollbar-width:none] xl:gap-1.5 [&::-webkit-scrollbar]:hidden">
            {WEB_CITIZEN_TOP_NAV_CENTER.map((item) => (
              <TopNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-2 xl:gap-3">
          {/* Explorer Reims — fonction stratégique hors destinations (T3 remplacera ce lien
              par l'overlay). Nom accessible explicite, jamais une icône seule muette. */}
          <Link
            href={WEB_CITIZEN_SEARCH_ACCESS.href}
            aria-label={WEB_CITIZEN_SEARCH_ACCESS.label}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <Search className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
            <span className="whitespace-nowrap">{WEB_CITIZEN_SEARCH_ACCESS.label}</span>
          </Link>

          {/* CTA Créer — toujours visible pour un citoyen connecté (null sinon : aucun CTA mort). */}
          <CreateHubTriggerButton variant="nav" />

          <CitizenYunicityMenu variant="top-nav" />

          <nav
            className="hidden items-center gap-0.5 border-r border-neutral-200 pr-2 lg:flex xl:gap-1 xl:pr-3"
            aria-label="Notifications"
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
