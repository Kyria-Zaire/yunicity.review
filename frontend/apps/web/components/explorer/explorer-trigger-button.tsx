"use client";

import { useExplorerOptional } from "@/components/explorer/explorer-provider";
import { useNavigationSurfacesOptional } from "@/hooks/use-navigation-surfaces";
import { WEB_CITIZEN_SEARCH_ACCESS } from "@/lib/layout/web-layout-config";
import { Search } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";

type ExplorerTriggerButtonProps = {
  variant: "compact-mobile" | "medium-rail" | "desktop-text" | "sidebar-expanded";
  className?: string;
};

export function ExplorerTriggerButton({ variant, className = "" }: ExplorerTriggerButtonProps) {
  const explorer = useExplorerOptional();
  const surfaces = useNavigationSurfacesOptional();
  const [isApplePlatform, setIsApplePlatform] = useState(false);
  const surfacesReady = surfaces?.surfacesInitialized ?? false;

  useEffect(() => {
    setIsApplePlatform(/Mac|iPhone|iPod|iPad/.test(navigator.platform));
  }, []);

  if (!explorer) return null;

  const { openExplorer, isOpen } = explorer;
  const label = WEB_CITIZEN_SEARCH_ACCESS.label;
  const triggerProps = {
    type: "button" as const,
    onClick: (event: MouseEvent<HTMLButtonElement>) => openExplorer(event.currentTarget),
    "aria-label": label,
    "aria-haspopup": "dialog" as const,
    "aria-expanded": isOpen,
    "aria-busy": !surfacesReady,
    disabled: !surfacesReady,
  };

  if (variant === "compact-mobile") {
    return (
      <button
        {...triggerProps}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-yunicity-primary transition-colors hover:bg-yunicity-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        data-yunicity-mobile-header-control="explorer"
      >
        <Search className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
      </button>
    );
  }

  if (variant === "medium-rail") {
    return (
      <button
        {...triggerProps}
        className={`relative flex items-center justify-center rounded-full text-yunicity-primary transition-colors hover:bg-yunicity-primary-soft xl:hidden disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        style={{ width: "var(--web-sidebar-icon-hit)", height: "var(--web-sidebar-icon-hit)" }}
      >
        <Search className="h-[26px] w-[26px]" aria-hidden />
      </button>
    );
  }

  if (variant === "sidebar-expanded") {
    return (
      <button
        {...triggerProps}
        className={`hidden min-h-[2.75rem] w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium leading-snug text-neutral-700 transition-colors hover:bg-neutral-100 xl:flex disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <Search className="h-[22px] w-[22px] shrink-0 text-yunicity-primary" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      </button>
    );
  }

  return (
    <button
      {...triggerProps}
      data-yunicity-header-control="explorer"
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-neutral-200 px-2.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 xl:px-3 ${className}`}
    >
      <Search className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
      <kbd className="hidden rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 2xl:inline">
        {isApplePlatform ? "⌘ K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
