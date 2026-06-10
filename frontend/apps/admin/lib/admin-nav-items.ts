import type { LucideIcon } from "lucide-react";
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

export const STAFF_NAV_FLAT: AdminNavItem[] = STAFF_NAV_GROUPS.flatMap((group) => group.items);
