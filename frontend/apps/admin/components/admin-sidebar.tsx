"use client";

import { YunicityLogo } from "@/components/yunicity-logo";
import {
  CalendarDays,
  Flag,
  IdCard,
  LayoutDashboard,
  PenLine,
  QrCode,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PARTNER_NAV = [
  { href: "/partner-scan", label: "Valider un Passport", icon: QrCode },
  { href: "/partner-offers", label: "Mes offres pour la ville", icon: Tag },
] as const;

type NavItem = { href: string; label: string; icon: LucideIcon };

const STAFF_NAV_GROUPS: { id: string; label: string; items: NavItem[] }[] = [
  {
    id: "pilotage",
    label: "Pilotage",
    items: [
      { href: "/", label: "Cockpit", icon: LayoutDashboard },
      { href: "/partners", label: "Partenaires", icon: Store },
      { href: "/passport-ops", label: "Passport Ops", icon: IdCard },
    ],
  },
  {
    id: "moderation",
    label: "Modération",
    items: [
      { href: "/passport-offers", label: "Offres", icon: Tag },
      { href: "/events", label: "Événements", icon: CalendarDays },
      { href: "/creator-content", label: "Contenus créateurs", icon: PenLine },
      { href: "/moderation", label: "Modération", icon: Flag },
    ],
  },
  {
    id: "terrain",
    label: "Terrain",
    items: [
      { href: "/partner-scan", label: "Scanner Passport", icon: QrCode },
      { href: "/staff", label: "Staff", icon: Users },
    ],
  },
];

export function isStaffNavActive(pathname: string, href: string): boolean {
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

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  compact,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  compact?: boolean;
}) {
  const base = compact
    ? "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors duration-150"
    : "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150";

  const state = active
    ? compact
      ? "bg-yunicity-primary text-white"
      : "border-l-2 border-yunicity-primary bg-yunicity-primary-soft pl-[10px] font-medium text-yunicity-primary shadow-sm"
    : compact
      ? "bg-stone-100 text-stone-600 hover:bg-stone-200"
      : "border-l-2 border-transparent pl-[10px] text-stone-600 hover:bg-stone-50 hover:text-stone-900";

  return (
    <Link href={href} className={`${base} ${state}`}>
      <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4 shrink-0 opacity-80"} aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

interface AdminSidebarProps {
  staff: boolean;
  homeHref: string;
  variant?: "sidebar" | "mobile";
}

export function AdminSidebar({ staff, homeHref, variant = "sidebar" }: AdminSidebarProps) {
  const pathname = usePathname();
  const compact = variant === "mobile";

  if (compact) {
    return (
      <nav className="flex flex-wrap gap-2" aria-label="Navigation mobile">
        {PARTNER_NAV.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isStaffNavActive(pathname, item.href)}
            compact
          />
        ))}
        {staff
          ? STAFF_NAV_GROUPS.flatMap((group) =>
              group.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isStaffNavActive(pathname, item.href)}
                  compact
                />
              )),
            )
          : null}
      </nav>
    );
  }

  return (
    <aside className="hidden w-60 shrink-0 border-r border-stone-200 bg-white md:flex md:flex-col">
      <div className="border-b border-stone-100 px-5 py-5">
        <YunicityLogo href={homeHref} size="md" showWordmark />
        <p className="mt-1.5 text-xs text-stone-500">
          {staff ? "Centre de pilotage territorial" : "Espace partenaire"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
        <div className="rounded-lg border border-stone-100 bg-stone-50/60 p-2">
          <p className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-stone-400">
            Partenaire
          </p>
          <div className="space-y-0.5">
            {PARTNER_NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isStaffNavActive(pathname, item.href)}
              />
            ))}
          </div>
        </div>

        {staff ? (
          <div className="mt-5 space-y-5">
            {STAFF_NAV_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-stone-400">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isStaffNavActive(pathname, item.href)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}

/** Flat list for legacy mobile chips — re-export group items. */
export const STAFF_NAV_FLAT = STAFF_NAV_GROUPS.flatMap((g) => g.items);
