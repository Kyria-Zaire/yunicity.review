/**
 * Logique PURE du Popover non modal (C3.1-T3) — aucun accès DOM, aucun React.
 */
export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "right-start";

export type PopoverCloseReason =
  | "escape"
  | "outside-pointer"
  | "focus-exit"
  | "navigation"
  | "programmatic"
  | "superseded";

export type PopoverRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type PopoverViewport = {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
};

export type PopoverPosition = {
  top: number;
  left: number;
  maxHeight: number;
  resolvedPlacement: PopoverPlacement;
};

const POPOVER_GAP = 8;
const VIEWPORT_PADDING = 8;

export function shouldRestorePopoverFocus(
  reason: PopoverCloseReason,
  focusInsidePopover: boolean,
  triggerConnected: boolean,
): boolean {
  if (reason === "escape") return triggerConnected;
  if (reason === "programmatic") return focusInsidePopover && triggerConnected;
  return false;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function anchorForPlacement(
  placement: PopoverPlacement,
  trigger: PopoverRect,
  panel: { width: number; height: number },
): { top: number; left: number } {
  switch (placement) {
    case "bottom-start":
      return { top: trigger.top + trigger.height + POPOVER_GAP, left: trigger.left };
    case "bottom-end":
      return {
        top: trigger.top + trigger.height + POPOVER_GAP,
        left: trigger.left + trigger.width - panel.width,
      };
    case "top-start":
      return { top: trigger.top - panel.height - POPOVER_GAP, left: trigger.left };
    case "top-end":
      return {
        top: trigger.top - panel.height - POPOVER_GAP,
        left: trigger.left + trigger.width - panel.width,
      };
    case "right-start":
      return { top: trigger.top, left: trigger.left + trigger.width + POPOVER_GAP };
  }
}

export function computePopoverPosition(
  placement: PopoverPlacement,
  trigger: PopoverRect,
  panel: { width: number; height: number },
  viewport: PopoverViewport,
): PopoverPosition {
  const anchored = anchorForPlacement(placement, trigger, panel);
  // Trigger/panel rects are viewport-relative (`getBoundingClientRect`) and the
  // panel is `position: fixed`. Document scroll must not be subtracted again.
  const top = anchored.top;
  const left = anchored.left;

  const maxLeft = viewport.width - panel.width - VIEWPORT_PADDING;
  const maxTop = viewport.height - panel.height - VIEWPORT_PADDING;
  const nextLeft = clamp(left, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, maxLeft));

  const spaceBelowAnchor = viewport.height - VIEWPORT_PADDING - top;
  const keepBelowTrigger = placement.startsWith("bottom") && spaceBelowAnchor >= 48;
  const nextTop = keepBelowTrigger
    ? Math.max(top, VIEWPORT_PADDING)
    : clamp(top, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, maxTop));

  return {
    top: nextTop,
    left: nextLeft,
    maxHeight: Math.max(viewport.height - VIEWPORT_PADDING - nextTop, 0),
    resolvedPlacement: placement,
  };
}

/** Premier élément focalisable après le déclencheur hors du panneau (Tab depuis le dernier item). */
export function nextDocumentFocusAfterTrigger(
  documentFocusables: readonly HTMLElement[],
  trigger: HTMLElement | null,
  panelFocusables: readonly HTMLElement[],
): HTMLElement | null {
  if (!trigger || documentFocusables.length === 0) return null;
  const triggerIndex = documentFocusables.indexOf(trigger);
  if (triggerIndex < 0) return null;
  for (let index = triggerIndex + 1; index < documentFocusables.length; index += 1) {
    const candidate = documentFocusables[index];
    if (candidate !== undefined && !panelFocusables.includes(candidate)) return candidate;
  }
  return null;
}

/** Élément focalisable précédant le déclencheur (Shift+Tab depuis le premier item du panneau). */
export function previousDocumentFocusBeforeTrigger(
  documentFocusables: readonly HTMLElement[],
  trigger: HTMLElement | null,
): HTMLElement | null {
  if (!trigger || documentFocusables.length === 0) return null;
  const index = documentFocusables.indexOf(trigger);
  if (index <= 0) return null;
  return documentFocusables[index - 1] ?? null;
}
