"use client";

import { YunicityLogo } from "@/components/yunicity-logo";
import { isStaffUser } from "@/lib/auth/staff-permissions";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const PARTNER_NAV = [
  { href: "/partner-scan", label: "Valider un Passport" },
  { href: "/partner-offers", label: "Mes offres pour la ville" },
] as const;

type StaffNavLink = { kind: "link"; href: string; label: string };
type StaffNavDisabled = { kind: "disabled"; label: string; hint: string };

const STAFF_NAV_ITEMS: readonly (StaffNavLink | StaffNavDisabled)[] = [
  { kind: "link", href: "/", label: "Cockpit" },
  { kind: "link", href: "/partners", label: "Partenaires" },
  { kind: "link", href: "/passport-ops", label: "Passport Ops" },
  { kind: "link", href: "/partner-scan", label: "Scanner Passport" },
  { kind: "link", href: "/passport-offers", label: "Offres" },
  { kind: "link", href: "/events", label: "Events" },
  { kind: "link", href: "/creator-content", label: "Creator Content" },
  { kind: "link", href: "/moderation", label: "Moderation" },
  { kind: "link", href: "/protected-admin", label: "Staff" },
];

function isStaffNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/partners") {
    return pathname === "/partners" || pathname.startsWith("/partners/");
  }
  if (href === "/passport-ops") {
    return pathname === "/passport-ops" || pathname.startsWith("/passport-ops/");
  }
  if (href === "/events") {
    return pathname === "/events" || pathname.startsWith("/events/");
  }
  if (href === "/creator-content") {
    return pathname === "/creator-content" || pathname.startsWith("/creator-content/");
  }
  if (href === "/moderation") {
    return pathname === "/moderation" || pathname.startsWith("/moderation/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function StaffNavLinks({
  pathname,
  className,
}: {
  pathname: string;
  className: { active: string; idle: string; disabled: string };
}) {
  return (
    <>
      {STAFF_NAV_ITEMS.map((item) => {
        if (item.kind === "disabled") {
          return (
            <span
              key={item.label}
              title={item.hint}
              className={className.disabled}
              aria-disabled="true"
            >
              {item.label}
              <span className="ml-1 text-[10px] font-normal opacity-70">({item.hint})</span>
            </span>
          );
        }
        const active = isStaffNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? className.active : className.idle}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function PartnerNavLinks({
  pathname,
  className,
}: {
  pathname: string;
  className: { active: string; idle: string };
}) {
  return (
    <>
      {PARTNER_NAV.map((item) => {
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

function staffPageTitle(pathname: string, isPartnerArea: boolean): string {
  if (pathname === "/") {
    return "Cockpit Yunicity";
  }
  if (pathname === "/partners" || pathname.startsWith("/partners")) {
    return "Partenaires";
  }
  if (pathname.startsWith("/partner-leads")) {
    return "Leads terrain";
  }
  if (pathname === "/passport-ops" || pathname.startsWith("/passport-ops/")) {
    return "Passport Ops";
  }
  if (pathname.startsWith("/partner-scan")) {
    return "Scanner Passport";
  }
  if (pathname.startsWith("/passport-offers")) {
    return "Modération offres";
  }
  if (pathname === "/events" || pathname.startsWith("/events/")) {
    return "Events";
  }
  if (pathname.startsWith("/creator-content")) {
    return "Contenus créateurs";
  }
  if (pathname.startsWith("/moderation")) {
    return "Modération";
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

  const staffNavClass = {
    active: "block rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-white",
    idle: "block rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900",
    disabled:
      "block cursor-not-allowed rounded-lg px-3 py-2 text-sm text-stone-400",
  };

  return (
    <div className="flex min-h-screen bg-yunicity-background">
      <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white/90 p-4 md:block">
        <YunicityLogo href={homeHref} size="md" showWordmark />
        <p className="mt-1 text-xs text-stone-500">
          {staff ? "Cockpit modération" : "Espace partenaire"}
        </p>
        <nav className="mt-6 space-y-1" aria-label="Navigation">
          <PartnerNavLinks
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
              <StaffNavLinks pathname={pathname} className={staffNavClass} />
            </div>
          ) : null}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-stone-200 bg-white px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-stone-900">
                {staffPageTitle(pathname, isPartnerArea)}
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
            <PartnerNavLinks
              pathname={pathname}
              className={{
                active: "rounded-full bg-stone-900 px-3 py-1 text-xs text-white",
                idle: "rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600",
              }}
            />
            {staff
              ? STAFF_NAV_ITEMS.map((item) => {
                  if (item.kind === "disabled") {
                    return (
                      <span
                        key={item.label}
                        className="rounded-full bg-stone-50 px-3 py-1 text-xs text-stone-400"
                        title={item.hint}
                      >
                        {item.label}
                      </span>
                    );
                  }
                  const active = isStaffNavActive(pathname, item.href);
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
