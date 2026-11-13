"use client";

import { PUBLICATION_DELETE_ACTION, PUBLICATION_DELETE_MENU_SECTION } from "@yunicity/utils";
import { MoreHorizontal } from "lucide-react";
import { useId } from "react";

import { useOverflowMenu } from "@/hooks/use-overflow-menu";

/** Nom accessible conservé du contrôle d'origine, qui était `disabled`. */
const PROFILE_PUBLICATION_OPTIONS_LABEL = "Options";

/**
 * Menu « Options » d'une de SES publications, sur le profil propriétaire —
 * PROFILE-POST-MENU-01.
 *
 * ── Le défaut corrigé ────────────────────────────────────────────────────────
 * Ce contrôle existait sur les trois paliers mais était `disabled` DANS LE
 * CODE : cliquer n'avait aucun effet, et aucun chemin d'interface ne permettait
 * de retirer une publication — ce qui a bloqué le nettoyage de recette.
 *
 * Il n'est rendu que si une action est câblée : un menu vide reproduirait le
 * défaut d'origine sous une autre forme.
 */
export function ProfilePublicationOptionsMenu({ onDelete }: { onDelete: () => void }) {
  const menuId = useId();
  const { open, toggle, close, containerRef, triggerRef } = useOverflowMenu<HTMLDivElement>();

  function requestDelete() {
    // Le focus retourne au déclencheur AVANT l'ouverture de la confirmation :
    // c'est lui que la modale mémorise pour le rendre à la fermeture.
    close(true);
    onDelete();
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={PROFILE_PUBLICATION_OPTIONS_LABEL}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        data-profile-publication-options=""
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[12rem] rounded-xl border border-neutral-200/90 bg-white py-1 shadow-lg"
        >
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            {PUBLICATION_DELETE_MENU_SECTION}
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={requestDelete}
            data-profile-publication-delete=""
            className="block w-full px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            {PUBLICATION_DELETE_ACTION}
          </button>
        </div>
      ) : null}
    </div>
  );
}
