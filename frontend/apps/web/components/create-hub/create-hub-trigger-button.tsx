"use client";

import { CREATE_HUB_FAB_LABEL } from "@/components/create-hub/create-hub-labels";
import { useCreateHubOptional } from "@/components/create-hub/create-hub-provider";
import { useCreateHubVisibility } from "@/hooks/use-create-hub-visibility";
import { useNavigationSurfacesOptional } from "@/hooks/use-navigation-surfaces";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

type CreateHubTriggerButtonProps = {
  variant?: "nav" | "sidebar-icon" | "sidebar-expanded" | "bottom-nav";
  className?: string;
  children?: ReactNode;
};

/**
 * Bouton d'ouverture du Create Hub — visible connecté et visiteur hors routes masquées.
 */
export function CreateHubTriggerButton({
  variant = "nav",
  className = "",
  children,
}: CreateHubTriggerButtonProps) {
  const createHub = useCreateHubOptional();
  const surfaces = useNavigationSurfacesOptional();
  const visible = useCreateHubVisibility();
  const surfacesReady = surfaces?.surfacesInitialized ?? false;

  if (!createHub || !visible) {
    return null;
  }

  const { openCreateHub, isOpen } = createHub;
  const triggerProps = {
    type: "button" as const,
    onClick: openCreateHub,
    "aria-label": CREATE_HUB_FAB_LABEL,
    "aria-haspopup": "dialog" as const,
    "aria-expanded": isOpen,
    "aria-busy": !surfacesReady,
    disabled: !surfacesReady,
  };

  if (variant === "sidebar-icon") {
    return (
      <button
        {...triggerProps}
        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-sm transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </button>
    );
  }

  if (variant === "bottom-nav") {
    return (
      <button
        {...triggerProps}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-md transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <Plus className="h-6 w-6" strokeWidth={2.25} aria-hidden />
      </button>
    );
  }

  if (variant === "sidebar-expanded") {
    return (
      <button
        {...triggerProps}
        className={`hidden w-full rounded-full bg-neutral-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 xl:block disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {children ?? CREATE_HUB_FAB_LABEL}
      </button>
    );
  }

  return (
    <button
      {...triggerProps}
      data-yunicity-header-control="create"
      className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-yunicity-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 xl:px-4 ${className}`}
    >
      {children ?? CREATE_HUB_FAB_LABEL}
    </button>
  );
}
