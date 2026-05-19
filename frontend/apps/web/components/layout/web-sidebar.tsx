"use client";

import { WEB_CITIZEN_NAV, isWebNavActive } from "@/lib/layout/web-layout-config";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";

function WebSidebarLogout({ className = "" }: { className?: string }) {
  const { logout } = useAuth();
  return (
    <button
      type="button"
      onClick={() => void logout().then(() => window.location.assign("/login"))}
      className={`text-neutral-700 underline-offset-2 hover:underline ${className}`}
    >
      Déconnexion
    </button>
  );
}

/**
 * Navigation latérale desktop (lg+) — fondation pour futures entrées
 * (feed, événements, messages, carte, creators).
 */
export function WebSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:block" aria-label="Navigation Yunicity">
      <div className="sticky top-[var(--web-sticky-offset)] space-y-8">
        <Link href="/profile/me" className="block text-xl font-bold tracking-tight text-neutral-900">
          Yunicity
        </Link>
        <nav className="flex flex-col gap-0.5" aria-label="Navigation principale">
          {WEB_CITIZEN_NAV.map((item) => {
            const active = isWebNavActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 pt-6 text-sm text-neutral-600">
          <p className="truncate" title={user?.email ?? undefined}>
            {user?.email}
          </p>
          <WebSidebarLogout className="mt-2 text-xs" />
        </div>
      </div>
    </aside>
  );
}

export { WebSidebarLogout };
