"use client";

import { CreateHubTriggerButton } from "@/components/create-hub/create-hub-trigger-button";
import {
  WEB_CITIZEN_MOBILE_BOTTOM_NAV,
  isWebNavActive,
  type WebNavItem,
} from "@/lib/layout/web-layout-config";
import { WebNavIcon } from "@/lib/layout/web-nav-icons";
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
        <span className="max-w-full truncate">{item.mobileLabel ?? item.label}</span>
      </Link>
    </li>
  );
}

/**
 * Bottom nav mobile ancrée — Navbar V3 (viewport strictement sous 640px).
 *
 * Barre pleine largeur collée au bas de l'écran (safe area incluse), sans pill flottante.
 * Quatre destinations + CTA Créer au centre (Accueil · Video · + · Carte · Sortir).
 */
export function WebMobileStrategicBottomNav() {
  const pathname = usePathname();
  const destinations = WEB_CITIZEN_MOBILE_BOTTOM_NAV;
  const half = Math.ceil(destinations.length / 2);
  const left = destinations.slice(0, half);
  const right = destinations.slice(half);

  return (
    <nav
      className="web-mobile-strategic-bottom-nav web-mobile-docked-bottom-nav fixed inset-x-0 bottom-0 z-[var(--z-chrome,40)] block min-[640px]:hidden border-t border-neutral-200/90 bg-white pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation principale"
    >
      <div className="pointer-events-auto w-full max-w-none">
        <ul className="flex items-stretch justify-around gap-0.5 px-0.5">
          {left.map((item) => (
            <BottomNavLink key={item.href} item={item} pathname={pathname} />
          ))}
          <li className="web-mobile-docked-bottom-nav-create relative z-10 flex w-12 shrink-0 items-end justify-center self-end pb-0.5">
            <CreateHubTriggerButton variant="bottom-nav" className="-translate-y-2 shadow-md ring-2 ring-white" />
          </li>
          {right.map((item) => (
            <BottomNavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </div>
    </nav>
  );
}
