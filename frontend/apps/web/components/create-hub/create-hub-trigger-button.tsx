"use client";

import { CREATE_HUB_FAB_LABEL } from "@/components/create-hub/create-hub-labels";
import { useCreateHubOptional } from "@/components/create-hub/create-hub-provider";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCreateHubVisibility } from "@/hooks/use-create-hub-visibility";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

type CreateHubTriggerButtonProps = {
  variant?: "nav" | "sidebar-icon" | "sidebar-expanded";
  className?: string;
  children?: ReactNode;
};

/**
 * Bouton d'ouverture du Create Hub pour la navigation desktop / sidebar.
 * No-op silencieux si le provider est absent (pages auth).
 */
export function CreateHubTriggerButton({
  variant = "nav",
  className = "",
  children,
}: CreateHubTriggerButtonProps) {
  const createHub = useCreateHubOptional();
  const { isAuthenticated, isLoading } = useAuth();
  const visible = useCreateHubVisibility();

  if (!createHub || !isAuthenticated || isLoading || !visible) {
    return null;
  }

  const { openCreateHub, isOpen } = createHub;

  if (variant === "sidebar-icon") {
    return (
      <button
        type="button"
        onClick={openCreateHub}
        aria-label={CREATE_HUB_FAB_LABEL}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${className}`}
      >
        <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </button>
    );
  }

  if (variant === "sidebar-expanded") {
    return (
      <button
        type="button"
        onClick={openCreateHub}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`hidden w-full rounded-full bg-neutral-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 xl:block ${className}`}
      >
        {children ?? CREATE_HUB_FAB_LABEL}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openCreateHub}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${className}`}
    >
      {children ?? CREATE_HUB_FAB_LABEL}
    </button>
  );
}
