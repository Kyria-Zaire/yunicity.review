"use client";

import type { FeedReportReason } from "@yunicity/types";
import {
  FEED_REPORT_LABEL,
  FEED_REPORT_REASON_LABELS,
  PUBLICATION_DELETE_ACTION,
  PUBLICATION_DELETE_MENU_SECTION,
} from "@yunicity/utils";

/** Nom accessible du menu de debordement — commun aux trois bandes. */
const FEED_PUBLICATION_OVERFLOW_LABEL = "Plus d'actions";
import { MoreVertical } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";


const REASONS: FeedReportReason[] = ["spam", "inappropriate", "other"];

/**
 * Menu options publication — icône kebab maquette mobile.
 *
 * C3.1-R1L : ce menu proposait Spam / Contenu inapproprié / Autre sur TOUTE
 * publication, y compris celle de l'utilisateur connecté. Signaler sa propre
 * publication n'a aucun sens produit, et le backend ne l'interdisait pas non
 * plus (garde ajoutée dans `report_service`). L'appartenance est tranchée sur
 * l'identité serveur : pour un auteur citoyen, `FeedAuthor.id` EST le
 * `user_id`. Le rendu client n'est pas la frontière de sécurité — c'est l'API
 * qui refuse — mais il ne doit plus proposer une action impossible.
 *
 * PROFILE-POST-MENU-01 : une action propriétaire EXISTE désormais —
 * « Supprimer ». Le menu est donc rendu sur sa propre publication, mais
 * SEULEMENT quand `onDelete` est câblé : sans lui, un kebab vide serait un
 * second contrôle mort, et c'est exactement le défaut d'origine. Les surfaces
 * qui ne câblent pas la suppression (mur de Tribu, Discussions, harnais)
 * gardent donc le comportement précédent.
 *
 * `PATCH /posts/{id}` existe et reste disponible pour une extension Modifier.
 */
export function FeedPostOptionsMenu({
  onReport,
  onDelete,
  authorUserId,
  currentUserId,
}: {
  onReport: (reason: FeedReportReason) => Promise<void>;
  /**
   * Ouvre la confirmation de suppression — câblé uniquement sur les surfaces
   * qui savent retirer la carte de leur liste. N'écrit RIEN par lui-même.
   */
  onDelete?: () => void;
  /**
   * Identite du lecteur, INJECTEE (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A-TER).
   * Le menu appelait `useAuth()` pour ce seul champ, ce qui rendait toute la
   * carte non montable hors providers.
   */
  currentUserId: string | null;
  /** `user_id` de l'auteur quand c'est un citoyen, `null` pour une organisation. */
  authorUserId?: string | null;
}) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  /*
   * Fermeture clavier (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A-A11Y).
   *
   * Ce menu n'écoutait que `mousedown` : il était donc fermable à la souris et
   * pas au clavier. La lacune était mineure tant qu'il doublait un bouton
   * `Signaler` en barre ; depuis R2A il est l'UNIQUE chemin de signalement, sur
   * les trois bandes — un piège clavier sur cette surface n'est plus tolérable.
   *
   * Le listener n'existe que pendant l'ouverture et se retire à la fermeture
   * comme au démontage. `stopPropagation` empêche l'Escape de traverser vers
   * une surface parente (visionneuse, drawer) qui se fermerait au passage.
   */
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      // Le focus revient au déclencheur RÉEL, via sa ref — jamais par une
      // recherche globale qui pourrait viser la carte voisine.
      triggerRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);

  async function submit(reason: FeedReportReason) {
    setIsSubmitting(true);
    try {
      await onReport(reason);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function requestDelete() {
    // Le focus revient au déclencheur AVANT l'ouverture de la confirmation :
    // c'est lui que la modale mémorisera comme élément à refocaliser une fois
    // fermée. Sans ce passage, le focus repartirait de `<body>`.
    setOpen(false);
    triggerRef.current?.focus();
    onDelete?.();
  }

  const viewerIsAuthor = Boolean(authorUserId && currentUserId && authorUserId === currentUserId);
  // Signaler sa propre publication n'a pas de sens (C3.1-R1L) : sans action
  // propriétaire câblée, il n'y a rien à offrir.
  if (viewerIsAuthor && !onDelete) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        // C3-FEED-UNIFIED-PUBLICATION-CARD-R2A : le declencheur devient le menu
        // de debordement global. `Signaler` reste le titre de la section a
        // l'interieur, et l'unique chemin de signalement sur tous les ecrans.
        aria-label={FEED_PUBLICATION_OVERFLOW_LABEL}
        data-feed-publication-overflow=""
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[12rem] rounded-xl border border-neutral-200/90 bg-white py-1 shadow-lg"
        >
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            {viewerIsAuthor ? PUBLICATION_DELETE_MENU_SECTION : FEED_REPORT_LABEL}
          </p>
          {viewerIsAuthor ? (
            <button
              type="button"
              role="menuitem"
              onClick={requestDelete}
              data-feed-publication-delete=""
              className="block w-full px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              {PUBLICATION_DELETE_ACTION}
            </button>
          ) : (
            REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                role="menuitem"
                disabled={isSubmitting}
                onClick={() => void submit(reason)}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {FEED_REPORT_REASON_LABELS[reason]}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
