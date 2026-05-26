"use client";

import { WEB_CITIZEN_NAV_PRIMARY, isWebNavActive } from "@/lib/layout/web-layout-config";
import { HOME_PUBLISH_MOMENT } from "@yunicity/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header mobile uniquement (< md) — tablette+ utilise sidebar compacte. */
export function WebMobileHeader() {
  const pathname = usePathname();

  return (
    <header className="web-mobile-chrome-only sticky top-0 z-20 border-b border-neutral-200/80 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/profile/me" className="text-lg font-bold tracking-tight text-neutral-900">
          Yunicity
        </Link>
        <Link
          href="/feed#feed-composer"
          className="hidden shrink-0 rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex"
        >
          {HOME_PUBLISH_MOMENT}
        </Link>
        <nav className="flex flex-wrap justify-end gap-1 text-xs sm:text-sm" aria-label="Navigation principale">
          {WEB_CITIZEN_NAV_PRIMARY.map((item) => {
            const active = isWebNavActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  active
                    ? "bg-yunicity-primary text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/** Pied de page mobile : compte connecté. */
export function WebMobileFooter() {
  const { user } = useAuth();

  return (
    <footer className="web-mobile-chrome-only border-t border-neutral-200/60 px-4 py-6 text-center text-xs text-neutral-500">
      <p>{user?.email}</p>
    </footer>
  );
}
