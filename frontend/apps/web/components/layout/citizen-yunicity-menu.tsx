"use client";

import { CitizenYunicityMenuContent } from "@/components/layout/citizen-yunicity-menu-content";
import { WebSidebarTooltip } from "@/components/layout/web-sidebar-tooltip";
import { useNavigationSurfaces } from "@/hooks/use-navigation-surfaces";
import {
  YUNICITY_MENU_LABEL,
  YUNICITY_MENU_SHORT_LABEL,
  isYunicityMenuActive,
} from "@/lib/layout/web-layout-config";
import {
  resolveYunicityMenuHostVariant,
  resolveYunicityMenuPopoverPlacement,
} from "@/lib/layout/yunicity-menu-host";
import { useAuth } from "@/lib/auth/auth-provider";
import type { NavigationSurfaceCloseReason } from "@/lib/layout/navigation-surfaces";
import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";
import { Drawer, Popover, Sheet, type PopoverPlacement } from "@yunicity/ui/primitives";
import { ChevronDown, Grid3x3 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

type CitizenYunicityMenuProps = {
  variant?: "sidebar" | "top-nav" | "mobile-header" | "fab" | "bottom-nav";
};

type TriggerTone = {
  menuActive: boolean;
  open: boolean;
};

function placementForVariant(variant: CitizenYunicityMenuProps["variant"]): PopoverPlacement {
  return resolveYunicityMenuPopoverPlacement(variant ?? "sidebar");
}

function triggerTone({ menuActive, open }: TriggerTone): boolean {
  return menuActive || open;
}

function CompactTrigger({
  triggerRef,
  menuActive,
  open,
  onToggle,
  variant,
  surfacesReady,
}: {
  triggerRef: React.Ref<HTMLButtonElement>;
  menuActive: boolean;
  open: boolean;
  onToggle: () => void;
  variant: "sidebar" | "top-nav" | "mobile-header" | "fab" | "bottom-nav";
  surfacesReady: boolean;
}) {
  const tone = triggerTone({ menuActive, open });
  const triggerProps = {
    ref: triggerRef,
    type: "button" as const,
    onClick: onToggle,
    "aria-label": YUNICITY_MENU_LABEL,
    "aria-haspopup": "dialog" as const,
    "aria-expanded": open,
    "aria-busy": !surfacesReady,
    disabled: !surfacesReady,
  };

  if (variant === "bottom-nav") {
    return (
      <button
        {...triggerProps}
        className={`flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-yunicity-primary transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          tone ? "bg-yunicity-primary-soft/50 opacity-100" : "opacity-90 hover:opacity-100"
        }`}
      >
        <Grid3x3 className="h-[22px] w-[22px] shrink-0" aria-hidden />
        <span className="max-w-full truncate text-[10px] font-semibold leading-tight">
          {YUNICITY_MENU_SHORT_LABEL}
        </span>
      </button>
    );
  }

  if (variant === "fab") {
    return (
      <button
        {...triggerProps}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          tone
            ? "bg-yunicity-primary-hover text-white"
            : "bg-yunicity-primary text-white hover:bg-yunicity-primary-hover"
        }`}
      >
        <Grid3x3 className="h-7 w-7" aria-hidden />
      </button>
    );
  }

  if (variant === "top-nav" || variant === "mobile-header") {
    return (
      <button
        {...triggerProps}
        data-yunicity-header-control={variant === "top-nav" ? "menu" : undefined}
        data-yunicity-mobile-header-control={variant === "mobile-header" ? "menu" : undefined}
        className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium transition hover:bg-yunicity-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          tone ? "text-yunicity-primary" : "text-yunicity-primary hover:text-yunicity-primary-hover"
        }`}
      >
        <Grid3x3 className="h-4 w-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap xl:hidden">{YUNICITY_MENU_SHORT_LABEL}</span>
        <span className="hidden whitespace-nowrap xl:inline">{YUNICITY_MENU_LABEL}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <WebSidebarTooltip label={YUNICITY_MENU_LABEL}>
      <button
        {...triggerProps}
        className={`relative flex flex-col items-center justify-center gap-0.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 xl:hidden ${
          tone
            ? "bg-yunicity-primary-soft text-yunicity-primary"
            : "text-yunicity-primary hover:bg-yunicity-primary-soft hover:text-yunicity-primary-hover"
        }`}
        style={{ width: "var(--web-sidebar-icon-hit)", height: "var(--web-sidebar-icon-hit)" }}
      >
        <Grid3x3 className="h-[26px] w-[26px]" aria-hidden />
        <span className="max-w-full truncate text-[10px] font-semibold leading-tight">
          {YUNICITY_MENU_SHORT_LABEL}
        </span>
      </button>
    </WebSidebarTooltip>
  );
}

function ExpandedSidebarTrigger({
  triggerRef,
  menuActive,
  open,
  onToggle,
  surfacesReady,
}: {
  triggerRef: React.Ref<HTMLButtonElement>;
  menuActive: boolean;
  open: boolean;
  onToggle: () => void;
  surfacesReady: boolean;
}) {
  const tone = triggerTone({ menuActive, open });

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={onToggle}
      aria-label={YUNICITY_MENU_LABEL}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-busy={!surfacesReady}
      disabled={!surfacesReady}
      className={`hidden min-h-[2.75rem] w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 xl:flex ${
        tone ? "bg-yunicity-primary-soft text-yunicity-primary" : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center text-yunicity-primary">
        <Grid3x3 className="h-[22px] w-[22px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left">{YUNICITY_MENU_LABEL}</span>
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
  );
}

function MenuSurfaceContent({
  isAuthenticated,
  onNavigate,
  onLogout,
}: {
  isAuthenticated: boolean;
  onNavigate: (href: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="max-h-[min(80dvh,32rem)] overflow-y-auto">
      <CitizenYunicityMenuContent
        isAuthenticated={isAuthenticated}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
    </div>
  );
}

export function CitizenYunicityMenu({ variant = "sidebar" }: CitizenYunicityMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const surfaces = useNavigationSurfaces();
  const compactTriggerRef = useRef<HTMLButtonElement>(null);
  const expandedTriggerRef = useRef<HTMLButtonElement>(null);

  const isOpen = surfaces.isSurfaceOpen("menu");
  const menuSurface = surfaces.menuSurface;
  const surfacesReady = surfaces.surfacesInitialized;
  const menuHostVariant = resolveYunicityMenuHostVariant(surfaces.viewportWidth);
  const rendersMenuSurface = variant === menuHostVariant;
  const menuActive = isYunicityMenuActive(pathname);
  const restoreFocus = surfaces.shouldRestoreFocus;

  const openMenu = useCallback(() => {
    surfaces.openSurface("menu");
  }, [surfaces]);

  const closeMenu = useCallback(
    (reason: NavigationSurfaceCloseReason = "programmatic") => {
      surfaces.closeSurface("menu", reason);
    },
    [surfaces],
  );

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu("programmatic");
      return;
    }
    openMenu();
  }, [closeMenu, isOpen, openMenu]);

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    closeMenu("navigation");
  }, [closeMenu, pathname]);

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      closeMenu("navigation");
    },
    [closeMenu, router],
  );

  const handleLogout = useCallback(async () => {
    closeMenu("navigation");
    await logout();
    router.push("/login");
  }, [closeMenu, logout, router]);

  const content = (
    <MenuSurfaceContent
      isAuthenticated={isAuthenticated}
      onNavigate={handleNavigate}
      onLogout={() => {
        void handleLogout();
      }}
    />
  );

  const renderModalTrigger = (targetVariant: CitizenYunicityMenuProps["variant"]): ReactNode => {
    if (variant === "sidebar" && targetVariant === "sidebar") {
      return (
        <div className="relative flex w-full justify-center xl:block">
          <CompactTrigger
            triggerRef={compactTriggerRef}
            menuActive={menuActive}
            open={isOpen}
            onToggle={toggleMenu}
            variant="sidebar"
            surfacesReady={surfacesReady}
          />
          <ExpandedSidebarTrigger
            triggerRef={expandedTriggerRef}
            menuActive={menuActive}
            open={isOpen}
            onToggle={toggleMenu}
            surfacesReady={surfacesReady}
          />
        </div>
      );
    }

    return (
      <CompactTrigger
        triggerRef={compactTriggerRef}
        menuActive={menuActive}
        open={isOpen}
        onToggle={toggleMenu}
        variant={targetVariant ?? "sidebar"}
        surfacesReady={surfacesReady}
      />
    );
  };

  if (!rendersMenuSurface) {
    return renderModalTrigger(variant);
  }

  if (!menuSurface) {
    return renderModalTrigger(variant);
  }

  if (menuSurface === "drawer") {
    return (
      <>
        {renderModalTrigger(variant)}
        <Drawer
          returnFocusRef={compactTriggerRef}
          open={isOpen}
          onOpenChange={(next) => {
            if (!next) closeMenu("escape");
          }}
          title={YUNICITY_MENU_LABEL}
          restoreFocus={restoreFocus}
          zIndex={NAVIGATION_MODAL_Z_INDEX}
        >
          {content}
        </Drawer>
      </>
    );
  }

  if (menuSurface === "sheet") {
    return (
      <>
        {renderModalTrigger(variant)}
        <Sheet
          returnFocusRef={compactTriggerRef}
          open={isOpen}
          onOpenChange={(next) => {
            if (!next) closeMenu("escape");
          }}
          title={YUNICITY_MENU_LABEL}
          side="right"
          restoreFocus={restoreFocus}
        >
          {content}
        </Sheet>
      </>
    );
  }

  if (menuSurface === "popover" && variant === "sidebar") {
    return (
      <Popover
        open={isOpen}
        onOpenChange={(next, reason) => {
          if (next) openMenu();
          else closeMenu(reason ?? "programmatic");
        }}
        placement={placementForVariant("sidebar")}
        trigger={(props) => (
          <button
            {...props}
            type="button"
            aria-label={YUNICITY_MENU_LABEL}
            data-yunicity-header-control="menu"
            className={`hidden min-h-[2.75rem] w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 xl:flex ${
              triggerTone({ menuActive, open: isOpen })
                ? "bg-yunicity-primary-soft text-yunicity-primary"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center text-yunicity-primary">
              <Grid3x3 className="h-[22px] w-[22px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left">{YUNICITY_MENU_LABEL}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
        )}
        className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-neutral-200/90 bg-white shadow-xl"
      >
        {content}
      </Popover>
    );
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(next, reason) => {
        if (next) openMenu();
        else closeMenu(reason ?? "programmatic");
      }}
      placement={placementForVariant(variant)}
      trigger={(props) => {
        const tone = triggerTone({ menuActive, open: isOpen });

        return (
          <button
            {...props}
            type="button"
            aria-label={YUNICITY_MENU_LABEL}
            data-yunicity-header-control={variant === "top-nav" ? "menu" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium transition hover:bg-yunicity-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${
              tone ? "text-yunicity-primary" : "text-yunicity-primary hover:text-yunicity-primary-hover"
            }`}
          >
            <Grid3x3 className="h-4 w-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap xl:hidden">{YUNICITY_MENU_SHORT_LABEL}</span>
            <span className="hidden whitespace-nowrap xl:inline">{YUNICITY_MENU_LABEL}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        );
      }}
      className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-neutral-200/90 bg-white shadow-xl"
    >
      {content}
    </Popover>
  );
}
