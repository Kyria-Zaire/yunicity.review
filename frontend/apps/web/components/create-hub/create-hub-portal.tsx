"use client";

import { CreateHubFab } from "@/components/create-hub/create-hub-fab";
import { CreateHubOverlayPortal } from "@/components/create-hub/create-hub-overlay-portal";
import { CreateHubSheet } from "@/components/create-hub/create-hub-sheet";

type CreateHubPortalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/** FAB + sheet rendus via portal — indépendants du layout page. */
export function CreateHubPortal({ isOpen, onClose }: CreateHubPortalProps) {
  return (
    <CreateHubOverlayPortal>
      <CreateHubFab />
      <CreateHubSheet open={isOpen} onClose={onClose} />
    </CreateHubOverlayPortal>
  );
}
