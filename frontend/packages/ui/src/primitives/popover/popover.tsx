"use client";

/**
 * Popover — panneau NON MODAL ancré au déclencheur. Usage : Menu Yunicity desktop.
 *
 * Distinct de `OverlayPanel` : pas de backdrop, pas de scroll lock, pas d'inert,
 * pas de focus trap modal. La stratégie de focus dépend de `PopoverCloseReason`.
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefCallback,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { yunicitySemantic } from "../../semantic-tokens";
import { cx } from "../class-names";
import { FOCUSABLE_SELECTOR } from "../overlay/overlay-behavior";
import {
  computePopoverPosition,
  nextDocumentFocusAfterTrigger,
  previousDocumentFocusBeforeTrigger,
  shouldRestorePopoverFocus,
  type PopoverCloseReason,
  type PopoverPlacement,
} from "./popover-behavior";

export const POPOVER_ROOT_ATTRIBUTE = "data-yunicity-popover-root";

export type PopoverContentControls = {
  close: (reason: PopoverCloseReason) => void;
};

export type PopoverTriggerProps = {
  ref: RefCallback<HTMLElement>;
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": "dialog";
  "aria-controls": string;
  id?: string;
};

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
  trigger: (props: PopoverTriggerProps) => ReactNode;
  placement: PopoverPlacement;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode | ((controls: PopoverContentControls) => ReactNode);
};

export function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  placement,
  initialFocusRef,
  className,
  children,
}: PopoverProps) {
  const panelId = useId();
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? openProp : internalOpen;

  const [container, setContainer] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 0 });

  const openRef = useRef(open);
  openRef.current = open;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const closeReasonRef = useRef<PopoverCloseReason>("programmatic");
  const focusInsideRef = useRef(false);
  const initialFocusRefMirror = useRef(initialFocusRef);
  initialFocusRefMirror.current = initialFocusRef;

  useEffect(() => {
    const element = document.createElement("div");
    element.setAttribute(POPOVER_ROOT_ATTRIBUTE, "");
    document.body.appendChild(element);
    containerRef.current = element;
    setContainer(element);
    return () => {
      element.remove();
      containerRef.current = null;
      setContainer(null);
    };
  }, []);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next === openRef.current) return;
      openRef.current = next;
      if (!isControlled) setInternalOpen(next);
      onOpenChangeRef.current?.(next, closeReasonRef.current);
    },
    [isControlled],
  );

  const requestClose = useCallback(
    (reason: PopoverCloseReason) => {
      if (!openRef.current) return;
      focusInsideRef.current = panelRef.current?.contains(document.activeElement) ?? false;
      closeReasonRef.current = reason;
      setOpen(false);
    },
    [setOpen],
  );

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const panelEl = panelRef.current;
    if (!triggerEl || !panelEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    const panelRect = panelEl.getBoundingClientRect();
    const next = computePopoverPosition(
      placement,
      {
        top: triggerRect.top,
        left: triggerRect.left,
        width: triggerRect.width,
        height: triggerRect.height,
      },
      { width: panelRect.width || 240, height: panelRect.height || 1 },
      {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
    );
    setPosition({ top: next.top, left: next.left, maxHeight: next.maxHeight });
  }, [placement]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      const explicitTarget = initialFocusRefMirror.current?.current;
      const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const fallbackTarget = focusables && focusables.length > 0 ? focusables[0] : panel;
      const target = explicitTarget?.isConnected ? explicitTarget : fallbackTarget;
      target?.focus();
      updatePosition();
    });

    function onKeyDown(event: KeyboardEvent) {
      const panel = panelRef.current;
      if (!panel) return;

      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose("escape");
        return;
      }

      if (event.key !== "Tab") return;

      const active = document.activeElement as HTMLElement | null;
      if (!active || !panel.contains(active)) return;

      const documentFocusables = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const panelFocusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

      if (!event.shiftKey) {
        const last = panelFocusables[panelFocusables.length - 1];
        if (active !== last) return;
        const nextTarget = nextDocumentFocusAfterTrigger(
          documentFocusables,
          triggerRef.current,
          panelFocusables,
        );
        if (!nextTarget) return;
        event.preventDefault();
        requestClose("focus-exit");
        nextTarget.focus();
        return;
      }

      const first = panelFocusables[0];
      if (active !== first) return;
      const previousTarget = previousDocumentFocusBeforeTrigger(documentFocusables, triggerRef.current);
      if (!previousTarget) return;
      event.preventDefault();
      requestClose("focus-exit");
      previousTarget.focus();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      const panel = panelRef.current;
      const trigger = triggerRef.current;
      if (!target || !panel) return;
      if (panel.contains(target) || trigger?.contains(target)) return;
      requestClose("outside-pointer");
    }

    function onFocusIn(event: FocusEvent) {
      if (panelRef.current?.contains(event.target as Node)) {
        focusInsideRef.current = true;
      }
    }

    function onFocusOut(event: FocusEvent) {
      const related = event.relatedTarget as Node | null;
      if (!panelRef.current?.contains(related)) {
        focusInsideRef.current = panelRef.current?.contains(document.activeElement) ?? false;
      }
    }

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);

      const reason = closeReasonRef.current;
      const focusInside = focusInsideRef.current;
      const triggerConnected = triggerElementRef.current?.isConnected ?? false;
      if (shouldRestorePopoverFocus(reason, focusInside, triggerConnected)) {
        triggerElementRef.current?.focus();
      }
      focusInsideRef.current = false;
    };
  }, [open, requestClose, updatePosition]);

  const setTriggerRef = useCallback<RefCallback<HTMLElement>>((node) => {
    triggerRef.current = node;
    if (node) triggerElementRef.current = node;
  }, []);

  const onTriggerClick = useCallback(() => {
    closeReasonRef.current = "programmatic";
    setOpen(!openRef.current);
  }, [setOpen]);

  const controls: PopoverContentControls = {
    close: requestClose,
  };

  const renderedChildren = typeof children === "function" ? children(controls) : children;

  const triggerNode = trigger({
    ref: setTriggerRef,
    onClick: onTriggerClick,
    "aria-expanded": open,
    "aria-haspopup": "dialog",
    "aria-controls": panelId,
  });

  if (!container || !open) {
    return <>{triggerNode}</>;
  }

  return (
    <>
      {triggerNode}
      {createPortal(
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          data-yunicity-popover-panel=""
          className={cx(
            "fixed z-[50] min-w-[12rem] rounded-yunicity-xl border border-yunicity-divider bg-yunicity-canvas p-2 shadow-yunicity-lg outline-none",
            className,
          )}
          style={{
            top: position.top,
            left: position.left,
            zIndex: yunicitySemantic.z.popover,
            maxHeight: position.maxHeight,
            overflowY: "auto",
          }}
        >
          {renderedChildren}
        </div>,
        container,
      )}
    </>
  );
}

export type { PopoverCloseReason, PopoverPlacement };
