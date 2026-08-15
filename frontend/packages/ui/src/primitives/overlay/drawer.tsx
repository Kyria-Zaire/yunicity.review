"use client";

/**
 * Drawer — panneau qui monte du BAS. Usage mobile-first : actions, commentaires,
 * formulaires courts, « Créer ». Respecte la safe-area iOS via `OverlayPanel`.
 *
 * Pour un panneau latéral, utiliser `Sheet`.
 */
import { yunicitySemantic } from "../../semantic-tokens";
import { OverlayPanel, type OverlayPanelProps } from "./overlay-panel";

export type DrawerProps = Omit<OverlayPanelProps, "side">;

export function Drawer({ zIndex = yunicitySemantic.z.drawer, ...props }: DrawerProps) {
  return <OverlayPanel {...props} side="bottom" zIndex={zIndex} />;
}
