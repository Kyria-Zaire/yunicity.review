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
import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

import { yunicitySemantic } from "../../semantic-tokens";
import { cx } from "../class-names";
import {
  acquireScrollLock,
  canCloseOverlay,
  closedTransform,
  enteredTransform,
  FOCUSABLE_SELECTOR,
  longestTransitionMs,
  overlayContainerClass,
  overlayPhase,
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
  /** Défaut `true`. Passer `false` lors d'un remplacement de surface (`superseded`). */
  restoreFocus?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Cible EXPLICITE de retour du focus a la fermeture (C3-FEED-M2.3A).
   *
   * Par defaut la surface memorise `document.activeElement` a l'ouverture. Or
   * WebKit/Safari ne donne pas le focus a un `<button>` au clic : l'element
   * memorise est alors `body`, et le focus n'est jamais rendu au declencheur.
   * Chromium, lui, focalise le bouton au clic — d'ou un contrat vert sur un
   * moteur et rouge sur l'autre.
   *
   * Optionnel et additif : sans cette prop, le comportement est INCHANGE pour
   * toutes les surfaces existantes.
   */
  returnFocusRef?: RefObject<HTMLElement | null>;
  zIndex?: number;
  className?: string;
  /**
   * Habillage du panneau. `default` : en-tete titre + corps rembourre.
   * `bare` (C3.1-R1L.1) : plein viewport, sans carte ni rembourrage, pour une
   * surface dont le CONTENU est le sujet — une visionneuse d'image. Le contrat
   * d'accessibilite reste identique : role, nom accessible (titre rendu en
   * `sr-only`), piege a focus, Escape, bouton de fermeture, verrou de scroll.
   */
  chrome?: "default" | "bare";
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
  restoreFocus = true,
  initialFocusRef,
  returnFocusRef,
  zIndex = yunicitySemantic.z.modal,
  className,
  chrome = "default",
  children,
}: OverlayPanelProps) {
  const bare = chrome === "bare";
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
  // `entered` déclenche la transition ; `settled` marque sa FIN. Les deux diffèrent :
  // pendant la translation, la géométrie du panneau n'est pas celle de l'état ouvert.
  // Exposée au DOM, cette phase donne aux consommateurs (et aux tests) une readiness
  // explicite au lieu d'une attente arbitraire. Purement informative : aucun
  // comportement de l'overlay n'en dépend.
  const [settled, setSettled] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const settleTargetRef = useRef<HTMLElement | null>(null);

  // Refs miroir : le gestionnaire clavier est attaché une fois par ouverture et doit lire
  // les valeurs courantes sans se ré-attacher (ni provoquer de double émission).
  const openRef = useRef(open);
  openRef.current = open;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;
  const restoreFocusRef = useRef(restoreFocus);
  restoreFocusRef.current = restoreFocus;
  const returnFocusTargetRef = useRef(returnFocusRef);
  returnFocusTargetRef.current = returnFocusRef;
  const initialFocusRefMirror = useRef(initialFocusRef);
  initialFocusRefMirror.current = initialFocusRef;

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
    function onTransitionEnd(event: TransitionEvent) {
      if (event.propertyName !== "transform") return;
      if (event.target !== panelRef.current) return;
      setSettled(true);
    }

    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
      const panel = panelRef.current;
      const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const explicitTarget = initialFocusRefMirror.current?.current;
      const fallbackTarget = focusables && focusables.length > 0 ? focusables[0] : panel;
      const target = explicitTarget?.isConnected ? explicitTarget : fallbackTarget;
      target?.focus();

      // Sans transition déclarée (`prefers-reduced-motion`, environnement sans CSS),
      // `transitionend` ne sera jamais émis : la position finale est déjà atteinte.
      if (!panel) {
        setSettled(true);
        return;
      }
      if (longestTransitionMs(window.getComputedStyle(panel).transitionDuration) <= 0) {
        setSettled(true);
        return;
      }
      settleTargetRef.current = panel;
      panel.addEventListener("transitionend", onTransitionEnd);
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
      settleTargetRef.current?.removeEventListener("transitionend", onTransitionEnd);
      settleTargetRef.current = null;
      setSettled(false);
      releaseScrollLock();
      // Le focus n'est restitué QUE si cet overlay était au sommet. Sinon (fermeture dans le
      // désordre : un overlay sous-jacent se ferme alors qu'un autre est encore ouvert), on
      // arracherait le focus au dialogue actif pour l'envoyer dans une zone inerte.
      const wasTopmost = isTopmostOverlay(overlayRoot);
      // Sortie de pile AVANT la restitution : elle réactive la couche redevenue sommet, donc
      // le focus ne peut pas atterrir dans un `inert`.
      leaveStack();
      setEntered(false);
      if (wasTopmost && restoreFocusRef.current) {
        // Cible explicite prioritaire quand elle est fournie ET toujours dans le
        // document ; sinon, comportement historique inchange.
        const explicit = returnFocusTargetRef.current?.current ?? null;
        if (explicit?.isConnected) {
          explicit.focus({ preventScroll: true });
        } else if (previouslyFocused?.isConnected) {
          previouslyFocused.focus();
        }
      }
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
        <div
          className={cx("fixed inset-0", overlayContainerClass(side))}
          style={{ zIndex }}
          data-yunicity-overlay={side}
          data-yunicity-overlay-state={overlayPhase(settled)}
        >
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
              // `bare` sort du flux : enfant flex, le panneau etait RETRECI par le
              // padding du conteneur (mesure : 358 px pour un viewport de 390).
              bare ? "absolute inset-0" : side === "center" ? "relative" : "absolute",
              "flex flex-col outline-none",
              bare ? "max-w-none" : "bg-yunicity-canvas shadow-yunicity-lg",
              "transition-transform duration-yunicity-base ease-yunicity-standard motion-reduce:transition-none",
              bare ? undefined : panelPositionClass(side),
              className,
            )}
            style={{ transform: entered ? enteredTransform(side) : closedTransform(side) }}
          >
            {bare ? (
              <>
                {/* Nom accessible conserve : `aria-labelledby` pointe toujours ici. */}
                <h2 id={titleId} className="sr-only">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="sr-only">
                    {description}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => requestClose("close-button")}
                  aria-label={closeLabel}
                  className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex min-h-yunicity-touch min-w-yunicity-touch items-center justify-center rounded-yunicity-pill bg-black/60 text-white transition-colors duration-yunicity-fast motion-reduce:transition-none hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true" focusable="false">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </>
            ) : (
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
            )}
            <div
              className={cx(
                bare ? "min-h-0 flex-1 overflow-hidden" : "min-h-0 flex-1 overflow-y-auto p-4",
                side === "bottom" && "max-h-[calc(85dvh-4.75rem)]",
              )}
              data-yunicity-overlay-scroll=""
            >
              {children}
            </div>
          </div>
        </div>,
        container,
      )}
    </>
  );
}
