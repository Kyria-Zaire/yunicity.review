"use client";

/**
 * OverlayPanel — socle commun `Sheet` (latéral) / `Drawer` (bas). Interne au package.
 *
 * Adaptateur DOM mince : la logique délicate vit dans `overlay-behavior.ts` (pur) et
 * `overlay-stack.ts` (pile modale : qui est au sommet, qui devient inerte).
 * SSR : aucun accès `window`/`document` au niveau module ni au premier rendu — le portail
 * n'est monté qu'après `useEffect`, donc le HTML serveur et le premier rendu client sont
 * identiques (pas de mismatch d'hydratation).
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { yunicitySemantic } from "../../semantic-tokens";
import { cx } from "../class-names";
import {
  acquireScrollLock,
  canCloseOverlay,
  closedTransform,
  FOCUSABLE_SELECTOR,
  panelPositionClass,
  resolveTabTrap,
  type OverlayCloseReason,
  type OverlaySide,
} from "./overlay-behavior";
import { isTopmostOverlay, OVERLAY_ROOT_ATTRIBUTE, registerOverlay } from "./overlay-stack";

export type OverlayTriggerProps = {
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": "dialog";
  "aria-controls": string;
};

export type OverlayPanelProps = {
  /** Contrôlé si fourni ; sinon état interne initialisé par `defaultOpen`. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Déclencheur en render-prop (mode non contrôlé) — pas de `cloneElement`. */
  trigger?: (props: OverlayTriggerProps) => ReactNode;
  side: OverlaySide;
  /** Titre visible ET nom accessible du dialogue. */
  title: string;
  description?: string;
  closeLabel?: string;
  /** `false` : Escape et clic sur l'overlay ne ferment plus. Le bouton Close reste actif. */
  dismissible?: boolean;
  zIndex?: number;
  className?: string;
  children: ReactNode;
};

export function OverlayPanel({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  side,
  title,
  description,
  closeLabel = "Fermer",
  dismissible = true,
  zIndex = yunicitySemantic.z.modal,
  className,
  children,
}: OverlayPanelProps) {
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const descriptionId = `${panelId}-description`;

  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isControlled ? openProp : internalOpen;

  const [container, setContainer] = useState<HTMLElement | null>(null);
  // Ref jumelle du state : à la toute première passe d'effets, `container` vaut encore null
  // (le `setContainer` n'a pas rendu) alors que l'effet d'ouverture doit déjà s'enregistrer
  // dans la pile avec sa racine.
  const containerRef = useRef<HTMLElement | null>(null);
  const [entered, setEntered] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Refs miroir : le gestionnaire clavier est attaché une fois par ouverture et doit lire
  // les valeurs courantes sans se ré-attacher (ni provoquer de double émission).
  const openRef = useRef(open);
  openRef.current = open;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;

  // Racine de portail dédiée et MARQUÉE : elle identifie les overlays parmi les enfants de
  // `body`, pour qu'un overlay n'aille jamais rendre un autre overlay inerte (imbrication).
  useEffect(() => {
    const element = document.createElement("div");
    element.setAttribute(OVERLAY_ROOT_ATTRIBUTE, "");
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
      if (next === openRef.current) return; // une transition = une seule émission
      openRef.current = next;
      if (!isControlled) setInternalOpen(next);
      onOpenChangeRef.current?.(next);
    },
    [isControlled],
  );

  const requestClose = useCallback(
    (reason: OverlayCloseReason) => {
      if (!canCloseOverlay(dismissibleRef.current, reason)) return;
      setOpen(false);
    },
    [setOpen],
  );

  useEffect(() => {
    if (!open) return;

    const overlayRoot = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const releaseScrollLock = acquireScrollLock(document.body);
    // Entrée dans la pile : cet overlay devient le sommet, tout le reste (application ET
    // overlays sous-jacents) passe inerte.
    const leaveStack = overlayRoot ? registerOverlay(overlayRoot) : () => undefined;
    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
      const panel = panelRef.current;
      const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusables && focusables.length > 0 ? focusables[0] : panel)?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      const panel = panelRef.current;
      if (!panel) return;
      // Seul le sommet de la pile réagit : un overlay sous-jacent reste monté mais muet,
      // sinon Escape fermerait deux dialogues d'un coup et deux pièges de focus lutteraient.
      if (!isTopmostOverlay(overlayRoot)) return;

      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose("escape");
        return;
      }
      if (event.key !== "Tab") return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const decision = resolveTabTrap({
        focusableCount: items.length,
        activeIndex: items.indexOf(document.activeElement as HTMLElement),
        shiftKey: event.shiftKey,
      });
      if (decision.preventDefault) event.preventDefault();
      if (decision.focusIndex !== null) items[decision.focusIndex]?.focus();
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.cancelAnimationFrame(frame);
      releaseScrollLock();
      // Le focus n'est restitué QUE si cet overlay était au sommet. Sinon (fermeture dans le
      // désordre : un overlay sous-jacent se ferme alors qu'un autre est encore ouvert), on
      // arracherait le focus au dialogue actif pour l'envoyer dans une zone inerte.
      const wasTopmost = isTopmostOverlay(overlayRoot);
      // Sortie de pile AVANT la restitution : elle réactive la couche redevenue sommet, donc
      // le focus ne peut pas atterrir dans un `inert`.
      leaveStack();
      setEntered(false);
      if (wasTopmost && previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open, requestClose]);

  const triggerNode = trigger?.({
    onClick: () => setOpen(true),
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
        <div className="fixed inset-0" style={{ zIndex }} data-yunicity-overlay={side}>
          {/* Overlay : rend l'arrière-plan non cliquable. Non focalisable — la sortie clavier
              passe par Escape et par le bouton Close, tous deux dans le piège de focus. */}
          <div
            aria-hidden="true"
            data-yunicity-overlay-backdrop=""
            onClick={() => requestClose("overlay-click")}
            className="absolute inset-0 bg-black/40 transition-opacity duration-yunicity-base ease-yunicity-standard motion-reduce:transition-none"
            style={{ opacity: entered ? 1 : 0 }}
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cx(
              "absolute flex flex-col bg-yunicity-canvas shadow-yunicity-lg outline-none",
              "transition-transform duration-yunicity-base ease-yunicity-standard motion-reduce:transition-none",
              panelPositionClass(side),
              className,
            )}
            style={{ transform: entered ? "translate(0, 0)" : closedTransform(side) }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-yunicity-divider px-4 py-3">
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-bold text-yunicity-ink">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm text-yunicity-ink-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => requestClose("close-button")}
                aria-label={closeLabel}
                className="flex min-h-yunicity-touch min-w-yunicity-touch shrink-0 items-center justify-center rounded-yunicity-pill text-yunicity-ink-muted transition-colors duration-yunicity-fast motion-reduce:transition-none hover:bg-yunicity-surface hover:text-yunicity-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-focus"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          </div>
        </div>,
        container,
      )}
    </>
  );
}
