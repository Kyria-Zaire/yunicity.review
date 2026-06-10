"use client";

import { isStaffNavActive } from "@/lib/admin-sidebar-nav";
import type { AdminNavItem } from "@/lib/admin-nav-items";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminNavLinkProps {
  item: AdminNavItem;
  variant: "sidebar" | "drawer";
  onNavigate?: () => void;
}

export function AdminNavLink({ item, variant, onNavigate }: AdminNavLinkProps) {
  const pathname = usePathname();
  const active = isStaffNavActive(pathname, item.href);
  const Icon = item.icon;

  if (variant === "drawer") {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
          active
            ? "bg-yunicity-primary-soft font-medium text-yunicity-primary"
            : "text-stone-700 hover:bg-stone-50 hover:text-stone-950"
        }`}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
        active
          ? "border-l-2 border-yunicity-primary bg-yunicity-primary-soft pl-[10px] font-medium text-yunicity-primary shadow-sm"
          : "border-l-2 border-transparent pl-[10px] text-stone-600 hover:bg-stone-50 hover:text-stone-900"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
