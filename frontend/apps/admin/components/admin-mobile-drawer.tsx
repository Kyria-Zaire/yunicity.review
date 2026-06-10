"use client";

import { AdminNavLink } from "@/components/admin-nav-link";
import { YunicityLogo } from "@/components/yunicity-logo";
import {
  PARTNER_NAV_ITEMS,
  STAFF_NAV_FLAT,
  STAFF_NAV_GROUPS,
} from "@/lib/admin-nav-items";
import { shouldShowPartnerNavBlock } from "@/lib/admin-sidebar-nav";
import { X } from "lucide-react";
import { useEffect, useId } from "react";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staff: boolean;
  homeHref: string;
  userEmail: string | null;
  onLogout: () => void;
}

export function AdminMobileDrawer({
  isOpen,
  onClose,
  staff,
  homeHref,
  userEmail,
  onLogout,
}: AdminMobileDrawerProps) {
  const titleId = useId();
  const showPartnerNav = shouldShowPartnerNavBlock(staff);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-stone-950/40"
        aria-label="Fermer le menu"
        onClick={onClose}
      />

      <aside
        id="admin-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col border-r border-stone-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-4 py-4">
          <div className="min-w-0">
            <YunicityLogo href={homeHref} size="sm" showWordmark />
            <p id={titleId} className="mt-2 text-sm font-semibold text-stone-900">
              Administration Yunicity
            </p>
            {userEmail ? (
              <p className="mt-0.5 truncate text-xs text-stone-500">{userEmail}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
          {showPartnerNav ? (
            <ul className="space-y-1">
              {PARTNER_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <AdminNavLink item={item} variant="drawer" onNavigate={onClose} />
                </li>
              ))}
            </ul>
          ) : null}

          {staff ? (
            <ul className={`space-y-1 ${showPartnerNav ? "mt-4 border-t border-stone-100 pt-4" : ""}`}>
              {STAFF_NAV_FLAT.map((item) => (
                <li key={item.href}>
                  <AdminNavLink item={item} variant="drawer" onNavigate={onClose} />
                </li>
              ))}
            </ul>
          ) : null}
        </nav>

        {userEmail ? (
          <div className="border-t border-stone-100 px-4 py-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                void onLogout();
              }}
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
            >
              Déconnexion
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
