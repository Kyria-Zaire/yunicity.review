"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isWebNavActive } from "@/lib/layout/web-layout-config";
import { WebNavIcon } from "@/lib/layout/web-nav-icons";
import {
  buildYunicityMenuGroups,
  type YunicityMenuItem,
} from "@/lib/layout/yunicity-menu-contract";
import { ChevronRight } from "lucide-react";

type CitizenYunicityMenuContentProps = {
  isAuthenticated: boolean;
  onNavigate: (href: string) => void;
  onLogout: () => void;
};

function MenuItemRow({
  item,
  pathname,
  onNavigate,
  onLogout,
}: {
  item: YunicityMenuItem;
  pathname: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
}) {
  const active =
    item.href &&
    isWebNavActive(pathname, {
      href: item.href,
      label: item.label,
      icon: item.icon,
      match: item.match,
    });

  if (item.kind === "logout") {
    return (
      <button
        type="button"
        onClick={onLogout}
        className="flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-inset"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
          <WebNavIcon id={item.icon} className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">{item.label}</span>
      </button>
    );
  }

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(item.href!);
      }}
      className={`flex min-h-11 items-center gap-3 px-3 py-2.5 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-inset ${
        active ? "bg-yunicity-primary-soft/60" : ""
      }`}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-yunicity-primary">
        <WebNavIcon id={item.icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">{item.label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
    </Link>
  );
}

export function CitizenYunicityMenuContent({
  isAuthenticated,
  onNavigate,
  onLogout,
}: CitizenYunicityMenuContentProps) {
  const pathname = usePathname();
  const groups = buildYunicityMenuGroups({ isAuthenticated });

  return (
    <nav aria-label="Menu Yunicity" className="py-2">
      {groups.map((group) => (
        <section key={group.id} className="px-1 py-1">
          <h2 className="px-3 pb-1 pt-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {group.title}
          </h2>
          <ul className="py-1">
            {group.items.map((item) => (
              <li key={item.id}>
                <MenuItemRow
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  onLogout={onLogout}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
