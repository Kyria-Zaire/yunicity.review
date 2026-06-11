import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Flag,
  IdCard,
  LayoutDashboard,
  PenLine,
  QrCode,
  Settings,
  Store,
  Tag,
  Users,
} from "lucide-react";

export type AdminNavItem = { href: string; label: string; icon: LucideIcon };

export const PARTNER_NAV_ITEMS: AdminNavItem[] = [
  { href: "/partner-scan", label: "Scanner Passport", icon: QrCode },
  { href: "/partner-offers", label: "Mes offres pour la ville", icon: Tag },
];

export const STAFF_NAV_GROUPS: { id: string; label: string; items: AdminNavItem[] }[] = [
  {
    id: "pilotage",
    label: "Pilotage",
    items: [
      { href: "/", label: "Cockpit", icon: LayoutDashboard },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/activity", label: "Activité", icon: Bell },
      { href: "/settings", label: "Configuration", icon: Settings },
    ],
  },
  {
    id: "operations",
    label: "Opérations",
    items: [
      { href: "/partners", label: "Partenaires", icon: Store },
      { href: "/passport-ops", label: "Passport Ops", icon: IdCard },
      { href: "/passport-offers", label: "Offres", icon: Tag },
      { href: "/events", label: "Événements", icon: CalendarDays },
      { href: "/creator-content", label: "Créateurs", icon: PenLine },
      { href: "/moderation", label: "Modération", icon: Flag },
      { href: "/partner-scan", label: "Scanner Passport", icon: QrCode },
      { href: "/staff", label: "Staff", icon: Users },
    ],
  },
];

export const STAFF_NAV_FLAT: AdminNavItem[] = STAFF_NAV_GROUPS.flatMap((group) => group.items);
