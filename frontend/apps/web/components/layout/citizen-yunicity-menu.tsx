"use client";

import { WebSidebarTooltip } from "@/components/layout/web-sidebar-tooltip";
import {
  computeCitizenFlyoutPosition,
  type CitizenFlyoutPosition,
} from "@/lib/layout/citizen-flyout-position";
import {
  WEB_CITIZEN_YUNICITY_MENU,
  YUNICITY_MENU_LABEL,
  isWebNavActive,
  isYunicityMenuActive,
} from "@/lib/layout/web-layout-config";
import { WebNavIcon } from "@/lib/layout/web-nav-icons";
import { Z_INDEX } from "@/lib/layout/z-index";
import { ChevronDown, ChevronRight, Grid3x3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CitizenYunicityMenuProps = {
  variant?: "sidebar" | "top-nav";
};

/**
 * Menu Yunicity — grille d'exploration (Recherche, Quartiers, Tribus, Lieux, Proposer).
 */
export function CitizenYunicityMenu({ variant = "sidebar" }: CitizenYunicityMenuProps) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const compactTriggerRef = useRef<HTMLButtonElement>(null);
  const expandedTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<CitizenFlyoutPosition | null>(null);
  const pathname = usePathname();
  const isTopNav = variant === "top-nav";
  const menuActive = isYunicityMenuActive(pathname);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  const updateMenuPosition = useCallback(() => {
    const trigger = isTopNav
      ? compactTriggerRef.current
      : window.matchMedia("(min-width: 1280px)").matches
        ? expandedTriggerRef.current
        : compactTriggerRef.current;
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

  const menuPanel =
    open && menuPosition ? (
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label={YUNICITY_MENU_LABEL}
        className="fixed w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-2 shadow-xl"
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          transform: menuPosition.transform,
          zIndex: Z_INDEX.CHROME + 1,
        }}
      >
        <p className="px-3 pb-1 pt-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {YUNICITY_MENU_LABEL}
        </p>
        <ul className="py-1">
          {WEB_CITIZEN_YUNICITY_MENU.map((item) => {
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
      </div>
    ) : null;

  const triggerTone = menuActive || open;

  if (isTopNav) {
    return (
      <>
        <div ref={containerRef} className="relative">
          <button
            ref={compactTriggerRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={YUNICITY_MENU_LABEL}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${
              triggerTone ? "text-yunicity-primary" : "text-neutral-600"
            }`}
          >
            <Grid3x3 className="h-4 w-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{YUNICITY_MENU_LABEL}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
        </div>
        {mounted && menuPanel ? createPortal(menuPanel, document.body) : null}
      </>
    );
  }

  return (
    <>
      <div ref={containerRef} className="relative flex w-full justify-center xl:block">
        <WebSidebarTooltip label={YUNICITY_MENU_LABEL}>
          <button
            ref={compactTriggerRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={YUNICITY_MENU_LABEL}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            className={`relative flex items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 xl:hidden ${
              triggerTone
                ? "bg-neutral-200 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
            style={{ width: "var(--web-sidebar-icon-hit)", height: "var(--web-sidebar-icon-hit)" }}
          >
            <Grid3x3 className="h-[26px] w-[26px]" aria-hidden />
          </button>
        </WebSidebarTooltip>

        <button
          ref={expandedTriggerRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={YUNICITY_MENU_LABEL}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          className={`hidden min-h-[2.75rem] w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 xl:flex ${
            triggerTone
              ? "bg-yunicity-primary-soft text-yunicity-primary"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
            <Grid3x3 className="h-[22px] w-[22px]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left">
            {YUNICITY_MENU_LABEL}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      </div>
      {mounted && menuPanel ? createPortal(menuPanel, document.body) : null}
    </>
  );
}
