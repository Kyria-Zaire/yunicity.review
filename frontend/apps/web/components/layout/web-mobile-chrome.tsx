"use client";

import { WEB_CITIZEN_NAV, isWebNavActive } from "@/lib/layout/web-layout-config";
import { WebSidebarLogout } from "@/components/layout/web-sidebar";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header compact mobile / tablette (< lg). */
export function WebMobileHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/profile/me" className="text-lg font-bold tracking-tight text-neutral-900">
          Yunicity
        </Link>
        <nav className="flex flex-wrap justify-end gap-1 text-sm" aria-label="Navigation principale">
          {WEB_CITIZEN_NAV.map((item) => {
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

/** Pied de page mobile : compte + déconnexion. */
export function WebMobileFooter() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-neutral-200/60 px-4 py-6 text-center text-xs text-neutral-500 lg:hidden">
      <p>{user?.email}</p>
      <WebSidebarLogout className="mt-2" />
    </footer>
  );
}
