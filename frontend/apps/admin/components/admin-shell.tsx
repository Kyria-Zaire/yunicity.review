"use client";

import { isStaffUser } from "@/lib/auth/staff-permissions";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const PARTNER_NAV = [
  { href: "/partner-scan", label: "Valider un Passport" },
  { href: "/partner-offers", label: "Mes offres pour la ville" },
] as const;

const STAFF_NAV = [
  { href: "/partner-leads", label: "Partenaires terrain" },
  { href: "/passport-offers", label: "Modération offres" },
  { href: "/protected-admin", label: "Zone staff" },
] as const;

function NavLinks({
  items,
  pathname,
  className,
}: {
  items: readonly { href: string; label: string }[];
  pathname: string;
  className: { active: string; idle: string };
}) {
  return (
    <>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={active ? className.active : className.idle}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const staff = isStaffUser(user);
  const isPartnerArea =
    pathname.startsWith("/partner-offers") || pathname.startsWith("/partner-scan");
  const homeHref = staff ? "/partner-leads" : "/partner-offers";

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-stone-50 via-amber-50/30 to-white">
      <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white/90 p-4 md:block">
        <Link href={homeHref} className="text-sm font-semibold tracking-tight text-stone-900">
          Yunicity
        </Link>
        <p className="mt-1 text-xs text-stone-500">
          {staff ? "Cockpit modération" : "Espace partenaire"}
        </p>
        <nav className="mt-6 space-y-1" aria-label="Navigation">
          <NavLinks
            items={PARTNER_NAV}
            pathname={pathname}
            className={{
              active: "block rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white",
              idle:
                "block rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            }}
          />
          {staff ? (
            <div className="mt-4 space-y-1 border-t border-stone-200 pt-4">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Staff
              </p>
              <NavLinks
                items={STAFF_NAV}
                pathname={pathname}
                className={{
                  active: "block rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-white",
                  idle:
                    "block rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                }}
              />
            </div>
          ) : null}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-stone-900">
                {pathname.startsWith("/partner-scan")
                  ? "Validation sur place"
                  : isPartnerArea
                    ? "Offres pour ta ville"
                    : "Administration"}
              </h1>
              {user ? <p className="text-xs text-stone-500">{user.email}</p> : null}
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
              >
                Déconnexion
              </button>
            ) : null}
          </div>
          <nav className="mt-3 flex flex-wrap gap-2 md:hidden" aria-label="Navigation mobile">
            <NavLinks
              items={PARTNER_NAV}
              pathname={pathname}
              className={{
                active: "rounded-full bg-stone-900 px-3 py-1 text-xs text-white",
                idle: "rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600",
              }}
            />
            {staff
              ? STAFF_NAV.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-full px-3 py-1 text-xs ${
                        active ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })
              : null}
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}