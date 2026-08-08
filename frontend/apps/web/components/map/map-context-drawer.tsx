"use client";

import { Z_INDEX } from "@/lib/layout/z-index";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type MapContextDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Côté d'ouverture. Filtres = gauche (modal), détail = droite (non-modal, T6.2). */
  side: "left" | "right";
  /**
   * `modal` : backdrop + focus trap + scroll-lock (filtres).
   * `non-modal` : pas de backdrop bloquant, carte derrière interactive (détail, T6.2).
   */
  variant: "modal" | "non-modal";
  /** Titre visible (filtres) + label accessible du panneau. */
  title: string;
  /** Label accessible du bouton de fermeture (ex. « Fermer les filtres » / « Fermer le détail »). */
  closeLabel?: string;
  /** Classe appliquée au conteneur — le medium l'utilise pour rester `xl:hidden`. */
  className?: string;
  children: ReactNode;
};

/**
 * Drawer contextuel carte (T6). Deux variantes via `variant`. Rendu uniquement quand `open`.
 *
 * Invariant clé : la VISIBILITÉ est pilotée par CSS (le conteneur reçoit `xl:hidden` du medium),
 * jamais par un breakpoint JS. Les effets de bord se défèrent à cette visibilité :
 * - scroll-lock = classe body `map-drawer-scroll-lock`, elle-même bornée à `<1280` en CSS (globals) ;
 * - focus-trap = no-op si le panneau est masqué (`offsetParent === null`).
 * Ainsi, si le state reste ouvert au passage ≥1280, le drawer disparaît proprement sans bloquer
 * le scroll ni le focus desktop, et réapparaît si l'on revient en medium.
 */
export function MapContextDrawer({
  open,
  onClose,
  side,
  variant,
  title,
  closeLabel = "Fermer",
  className,
  children,
}: MapContextDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) return;
    const modal = variant === "modal";
    const trigger = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const raf = requestAnimationFrame(() => setEntered(true));

    if (modal) document.body.classList.add("map-drawer-scroll-lock");

    // Focus initial : seulement en modal (le détail non-modal ne doit pas voler le focus alors
    // que la carte reste explorable derrière).
    if (modal) {
      const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusables && focusables.length > 0 ? focusables[0] : panel)?.focus();
    }

    function onKeyDown(event: KeyboardEvent) {
      const el = panelRef.current;
      // Panneau masqué par CSS (≥1280) : on ne fait rien, on défère au CSS.
      if (!el || el.offsetParent === null) return;

      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (modal && event.key === "Tab") {
        const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
          (node) => node.offsetParent !== null,
        );
        if (items.length === 0) {
          event.preventDefault();
          return;
        }
        const first = items[0]!;
        const last = items[items.length - 1]!;
        const active = document.activeElement;
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        } else if (active instanceof Node && !el.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.classList.remove("map-drawer-scroll-lock");
      cancelAnimationFrame(raf);
      setEntered(false);
      // Retour du focus au déclencheur s'il existe encore (pertinent surtout en modal ; en
      // non-modal le déclencheur est un marqueur carte, on ne restaure que s'il est encore là).
      if (trigger?.isConnected) trigger.focus?.();
    };
  }, [open, variant]);

  if (!open) return null;

  const modal = variant === "modal";
  const closedTransform = side === "left" ? "translateX(-100%)" : "translateX(100%)";
  // Filtres (modal) plus large ; détail (non-modal) borné pour laisser la carte visible derrière.
  const widthClass = modal ? "w-[min(400px,88vw)]" : "w-[clamp(288px,40vw,380px)]";

  return (
    <div className={className}>
      {modal ? (
        <div
          aria-hidden
          onClick={onClose}
          className="fixed inset-0 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none"
          style={{ zIndex: Z_INDEX.MAP_DRAWER, opacity: entered ? 1 : 0 }}
        />
      ) : null}

      <div
        ref={panelRef}
        role={modal ? "dialog" : "complementary"}
        aria-modal={modal ? true : undefined}
        aria-label={title}
        tabIndex={-1}
        className={`fixed inset-y-0 ${
          side === "left" ? "left-0" : "right-0"
        } flex ${widthClass} flex-col bg-[#F4F5F7] shadow-xl outline-none transition-transform duration-200 motion-reduce:transition-none`}
        style={{
          zIndex: Z_INDEX.MAP_DRAWER,
          transform: entered ? "translateX(0)" : closedTransform,
        }}
      >
        {modal ? (
          // Filtres : entête drawer (titre + fermeture), fixe en haut.
          <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
            <span className="text-sm font-bold text-neutral-900">{title}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : (
          // Détail : bouton de fermeture STICKY (T6.3) — `absolute` dans le panneau `fixed`, il ne
          // défile pas avec le contenu et reste donc toujours accessible même très défilé. 44×44
          // (h-11 w-11). Le drawer est l'unique propriétaire de la fermeture en medium (la fiche
          // masque son propre X via `hideClose`), donc pas de double bouton ×.
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
