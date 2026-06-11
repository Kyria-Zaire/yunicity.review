"use client";

import { AdminMobileNav } from "@/components/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin-sidebar";
import { isStaffUser } from "@/lib/auth/staff-permissions";
import { useAuth } from "@/lib/auth/auth-provider";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function staffPageTitle(pathname: string, isPartnerArea: boolean): string {
  if (pathname === "/") {
    return "Cockpit";
  }
  if (pathname === "/analytics" || pathname.startsWith("/analytics")) {
    return "Analytics";
  }
  if (pathname === "/partners" || pathname.startsWith("/partners")) {
    return "Partenaires";
  }
  if (pathname.startsWith("/partner-leads")) {
    return "Prospects partenaires";
  }
  if (pathname === "/passport-ops" || pathname.startsWith("/passport-ops/")) {
    return "Passport Ops";
  }
  if (pathname.startsWith("/partner-scan")) {
    return "Scanner Passport";
  }
  if (pathname.startsWith("/passport-offers")) {
    return "Offres Passport";
  }
  if (pathname === "/events" || pathname.startsWith("/events/")) {
    return "Événements";
  }
  if (pathname.startsWith("/creator-content")) {
    return "Contenus créateurs";
  }
  if (pathname.startsWith("/moderation")) {
    return "Modération";
  }
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    return "Staff";
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return "Configuration";
  }
  if (pathname.startsWith("/protected-admin")) {
    return "Zone staff";
  }
  if (isPartnerArea) {
    return "Offres pour ta ville";
  }
  return "Administration";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const staff = isStaffUser(user);
  const isPartnerArea =
    pathname.startsWith("/partner-offers") || pathname.startsWith("/partner-scan");
  const homeHref = staff ? "/" : "/partner-offers";

  return (
    <div className="flex min-h-screen bg-yunicity-background">
      <AdminSidebar staff={staff} homeHref={homeHref} />

      <div className="flex flex-1 flex-col">
        <header className="border-b border-stone-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold tracking-tight text-stone-900">
                {staffPageTitle(pathname, isPartnerArea)}
              </h1>
              {user ? (
                <p className="truncate text-xs text-stone-500">{user.email}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AdminMobileNav
                staff={staff}
                homeHref={homeHref}
                userEmail={user?.email ?? null}
                onLogout={() => void logout()}
              />
              {user ? (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg px-3 py-1.5 text-sm text-stone-600 transition-colors duration-150 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
                >
                  Déconnexion
                </button>
              ) : null}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
