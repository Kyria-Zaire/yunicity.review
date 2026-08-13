"use client";

import { CREATE_HUB_FAB_LABEL } from "@/components/create-hub/create-hub-labels";
import { useCreateHub } from "@/components/create-hub/create-hub-provider";
import { CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP } from "@/lib/layout/feed-mobile-refonte";
import { Z_INDEX } from "@/lib/layout/z-index";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

type CreateHubFabProps = {
  /** Classes additionnelles (ex. masquer sur une route). */
  className?: string;
};

function isFeedPath(pathname: string): boolean {
  return pathname === "/feed" || pathname.startsWith("/feed/");
}

/**
 * FAB Create Hub — visible uniquement sur le fil local mobile (MOBILE-REFONDE-01).
 * Masqué sur /map et les autres onglets stratégiques (bottom nav suffit).
 */
export function CreateHubFab({ className = "" }: CreateHubFabProps) {
  const { openCreateHub, isOpen } = useCreateHub();
  const pathname = usePathname();

  if (!isFeedPath(pathname)) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openCreateHub}
      aria-label={CREATE_HUB_FAB_LABEL}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className={`create-hub-fab fixed hidden max-[639.98px]:inline-flex h-14 w-14 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-lg transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${className}`}
      style={{
        zIndex: Z_INDEX.CREATE_FAB,
        left: "max(1rem, env(safe-area-inset-left))",
        bottom: `calc(6rem + ${CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP} + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <Plus className="h-7 w-7" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
