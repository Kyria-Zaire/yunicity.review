"use client";

import { YunicityLogo } from "@/components/brand";
import { WEB_CITIZEN_NAV_PRIMARY, isWebNavActive } from "@/lib/layout/web-layout-config";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header mobile uniquement (< md) — tablette+ utilise sidebar compacte. */
export function WebMobileHeader() {
  const pathname = usePathname();

  return (
    <header className="web-mobile-chrome-only sticky top-0 z-20 border-b border-neutral-200/80 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <YunicityLogo href="/feed" size="sm" showWordmark priority />
        <nav
          className="min-w-0 flex-1 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Navigation principale"
        >
          <div className="flex w-max min-w-full justify-end gap-1.5 pr-1 text-xs sm:text-sm">
            {WEB_CITIZEN_NAV_PRIMARY.map((item) => {
              const active = isWebNavActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 py-2 font-medium transition-colors ${
                    active
                      ? "bg-yunicity-primary text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
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
