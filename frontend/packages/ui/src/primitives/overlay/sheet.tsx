"use client";

/**
 * Sheet — panneau LATÉRAL (gauche/droite). Usage : filtres, navigation secondaire,
 * détail contextuel sur medium/desktop.
 *
 * Pour un panneau qui monte du bas (mobile), utiliser `Drawer`. Les deux partagent le même
 * socle `OverlayPanel` : une seule famille d'overlay, deux points d'entrée nommés par l'usage.
 */
import { OverlayPanel, type OverlayPanelProps } from "./overlay-panel";

export type SheetProps = Omit<OverlayPanelProps, "side"> & {
  side?: "left" | "right";
};

export function Sheet({ side = "right", ...props }: SheetProps) {
  return <OverlayPanel {...props} side={side} />;
}
