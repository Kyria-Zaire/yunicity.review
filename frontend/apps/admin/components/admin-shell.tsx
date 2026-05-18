"use client";

import { isStaffUser } from "@/lib/auth/staff-permissions";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const STAFF_NAV = [
  { href: "/partner-leads", label: "Partenaires terrain" },
  { href: "/protected-admin", label: "Zone staff" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const staff = isStaffUser(user);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-neutral-50 via-white to-violet-50/20">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card/80 p-4 backdrop-blur md:block">
        <Link
          href={staff ? "/partner-leads" : "/"}
          className="text-sm font-semibold tracking-tight"
        >
          Yunicity Admin
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Cockpit partenaires</p>
        {staff ? (
          <nav className="mt-6 space-y-1" aria-label="Navigation staff">
            {STAFF_NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-neutral-900 font-medium text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-border bg-white/80 px-4 py-3 backdrop-blur md:px-6 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Administration</h1>
              {user ? (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              ) : null}
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              >
                Déconnexion
              </button>
            ) : null}
          </div>
          {staff ? (
            <nav className="mt-3 flex gap-2 md:hidden" aria-label="Navigation staff mobile">
              {STAFF_NAV.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3 py-1 text-xs ${
                      active ? "bg-neutral-900 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
