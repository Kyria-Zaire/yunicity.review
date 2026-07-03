"use client";

import { CREATE_HUB_FAB_LABEL } from "@/components/create-hub/create-hub-labels";
import { useCreateHub } from "@/components/create-hub/create-hub-provider";
import { Z_INDEX } from "@/lib/layout/z-index";
import { Plus } from "lucide-react";

type CreateHubFabProps = {
  /** Classes additionnelles (ex. masquer sur une route). */
  className?: string;
};

/**
 * FAB global — bas-gauche (CREATORS-ARCH-01).
 * Visible uniquement < 480px (sans sidebar) : au-delà, le trigger noir dans la sidebar suffit.
 */
export function CreateHubFab({ className = "" }: CreateHubFabProps) {
  const { openCreateHub, isOpen } = useCreateHub();

  return (
    <button
      type="button"
      onClick={openCreateHub}
      aria-label={CREATE_HUB_FAB_LABEL}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className={`create-hub-fab fixed hidden max-[479px]:inline-flex h-14 w-14 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-lg transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${className}`}
      style={{
        zIndex: Z_INDEX.CREATE_FAB,
        left: "max(1rem, env(safe-area-inset-left))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <Plus className="h-7 w-7" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
