"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { useCitizenChrome } from "@/hooks/use-citizen-chrome";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  WEB_CITIZEN_ACCOUNT_MENU,
  isCitizenAccountMenuActive,
  isWebNavActive,
} from "@/lib/layout/web-layout-config";
import { computeCitizenFlyoutPosition, type CitizenFlyoutPosition } from "@/lib/layout/citizen-flyout-position";
import { WebNavIcon } from "@/lib/layout/web-nav-icons";
import { Z_INDEX } from "@/lib/layout/z-index";
import { SETTINGS_LOGOUT } from "@yunicity/utils";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CitizenAccountMenuProps = {
  /** Sidebar compacte (icône) ou barre haute. */
  variant?: "sidebar" | "top-nav";
};

/**
 * Menu compte — Profil, Paramètres, Passport (+ déconnexion).
 * Inspiré du menu profil Facebook (chevron bas).
 */
export function CitizenAccountMenu({ variant = "sidebar" }: CitizenAccountMenuProps) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<CitizenFlyoutPosition | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { displayName } = useCitizenChrome();

  const profileLabel = displayName ?? user?.email?.split("@")[0] ?? "Mon profil";
  const isTopNav = variant === "top-nav";

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setMenuPosition(computeCitizenFlyoutPosition(trigger, isTopNav ? "top-nav" : "sidebar"));
  }, [isTopNav]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      close();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, open]);

  async function handleLogout() {
    close();
    await logout();
    router.push("/login");
  }

  const accountMenuActive = isCitizenAccountMenuActive(pathname);

  const menuPanel =
    open && menuPosition ? (
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label="Compte"
        className="fixed w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-2 shadow-xl"
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          transform: menuPosition.transform,
          zIndex: Z_INDEX.CHROME + 1,
        }}
      >
        <div className="border-b border-neutral-100 px-2 pb-2">
          <Link
            href="/profile/me"
            role="menuitem"
            onClick={close}
            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-neutral-50"
          >
            <ProfileAvatar name={profileLabel} size="md" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-neutral-900">
                {profileLabel}
              </span>
              <span className="block truncate text-xs text-neutral-500">{user?.email}</span>
            </span>
          </Link>
        </div>

        <ul className="py-1">
          {WEB_CITIZEN_ACCOUNT_MENU.map((item) => {
            const active = isWebNavActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  onClick={close}
                  className={`flex items-center gap-3 px-3 py-2.5 transition hover:bg-neutral-50 ${
                    active ? "bg-yunicity-primary-soft/60" : ""
                  }`}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                    <WebNavIcon id={item.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-1 border-t border-neutral-100 pt-1">
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-red-600">
              <LogOut className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-red-600">{SETTINGS_LOGOUT}</span>
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div ref={containerRef} className="relative flex w-full justify-center xl:block">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={`Menu compte — ${profileLabel}`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          className={
            isTopNav
              ? "inline-flex items-center gap-1 rounded-full py-1 pl-1 pr-2 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
              : `flex w-[var(--web-sidebar-icon-hit)] flex-col items-center justify-center gap-0.5 rounded-full py-1 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 xl:w-full xl:flex-row xl:justify-start xl:gap-2 xl:rounded-xl xl:p-2 ${
                  accountMenuActive ? "bg-neutral-100 xl:bg-neutral-50" : ""
                }`
          }
        >
          {isTopNav ? (
            <>
              <ProfileAvatar name={profileLabel} size="sm" />
              <ChevronDown
                className={`hidden h-4 w-4 shrink-0 text-neutral-500 transition-transform sm:block ${
                  open ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </>
          ) : (
            <>
              <span className="flex flex-col items-center gap-0.5 xl:hidden">
                <ProfileAvatar name={profileLabel} size="sm" />
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-yunicity-primary transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </span>
              <span className="hidden shrink-0 xl:inline-flex">
                <ProfileAvatar name={profileLabel} size="md" />
              </span>
              <span className="hidden min-w-0 flex-1 text-left xl:block">
                <span className="block truncate text-sm font-semibold text-neutral-900">
                  {profileLabel}
                </span>
                <span className="block truncate text-xs text-neutral-500">{user?.email}</span>
              </span>
              <ChevronDown
                className={`hidden h-4 w-4 shrink-0 text-neutral-500 transition-transform xl:block ${
                  open ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </>
          )}
        </button>
      </div>

      {mounted && menuPanel ? createPortal(menuPanel, document.body) : null}
    </>
  );
}
