"use client";

/**
 * Dialog — modal CENTRÉ. Usage : Explorer Reims, Hub Créer, confirmations.
 *
 * Façade publique mince sur `OverlayPanel` avec `side="center"`. Le type public
 * `DialogProps` est explicite et n'expose pas `OverlayPanelProps`.
 */
import { type ReactNode, type RefObject } from "react";

import { OverlayPanel, type OverlayTriggerProps } from "./overlay-panel";

export type DialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: (props: OverlayTriggerProps) => ReactNode;
  title: string;
  description?: string;
  closeLabel?: string;
  dismissible?: boolean;
  /** Défaut `true`. Passer `false` lors d'un remplacement de surface (`superseded`). */
  restoreFocus?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  zIndex?: number;
  className?: string;
  chrome?: "default" | "bare";
  children: ReactNode;
};

export function Dialog(props: DialogProps) {
  return <OverlayPanel {...props} side="center" />;
}
