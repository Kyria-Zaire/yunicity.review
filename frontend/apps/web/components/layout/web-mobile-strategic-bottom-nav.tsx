"use client";

import { CitizenYunicityMenuFab } from "@/components/layout/citizen-yunicity-menu-fab";
import { CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP } from "@/lib/layout/feed-mobile-refonte";
import {
  WEB_CITIZEN_MOBILE_BOTTOM_NAV,
  isWebNavActive,
  type WebNavItem,
} from "@/lib/layout/web-layout-config";
import { WebNavIcon } from "@/lib/layout/web-nav-icons";
import { Z_INDEX } from "@/lib/layout/z-index";
import Link from "next/link";
import { usePathname } from "next/navigation";

function ActiveFeedIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-[22px] w-[22px] shrink-0"}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
    </svg>
  );
}

function BottomNavLink({ item, pathname }: { item: WebNavItem; pathname: string }) {
  const active = isWebNavActive(pathname, item);

  return (
    <li className="min-w-0 flex-1">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[10px] font-semibold leading-tight text-yunicity-primary transition ${
          active ? "opacity-100" : "opacity-90 hover:opacity-100"
        }`}
      >
        {item.icon === "feed" && active ? (
          <ActiveFeedIcon className="h-[22px] w-[22px] text-yunicity-primary" />
        ) : (
          <WebNavIcon id={item.icon} className="h-[22px] w-[22px] text-yunicity-primary" />
        )}
        <span className="max-w-full truncate">{item.label}</span>
      </Link>
    </li>
  );
}

/**
 * Bottom nav mobile flottante — MOBILE-REFONDE-01 (≤639px).
 * Menu Yunicity : FAB à droite (`CitizenYunicityMenuFab`).
 */
export function WebMobileStrategicBottomNav() {
  const pathname = usePathname();

  return (
    <>
      <nav
        className="web-mobile-strategic-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 hidden max-[639.98px]:block px-3"
        style={{
          zIndex: Z_INDEX.CHROME,
          paddingBottom: `max(${CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP}, env(safe-area-inset-bottom))`,
        }}
        aria-label="Navigation principale"
      >
        <div className="pointer-events-auto mx-auto max-w-lg overflow-hidden rounded-2xl border border-yunicity-primary/25 bg-white/95 shadow-[0_10px_40px_rgba(15,23,42,0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
          <ul className="flex items-stretch justify-around px-0.5 py-0.5">
            {WEB_CITIZEN_MOBILE_BOTTOM_NAV.map((item) => (
              <BottomNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>
        </div>
      </nav>
      <CitizenYunicityMenuFab />
    </>
  );
}
