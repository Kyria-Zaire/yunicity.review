"use client";

import {
  PUBLICATION_DELETE_ACTION,
  PUBLICATION_DELETE_CONFIRM_BODY,
  PUBLICATION_DELETE_CONFIRM_CANCEL,
  PUBLICATION_DELETE_CONFIRM_TITLE,
  PUBLICATION_DELETE_PENDING,
} from "@yunicity/utils";
import { useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";

import type { PublicationDeletion } from "@/hooks/use-publication-deletion";

/**
 * Confirmation de suppression — surface UNIQUE pour les trois paliers.
 *
 * Purement présentationnelle : tout l'état vient de `usePublicationDeletion`.
 * Elle est montée par la carte du fil comme par les publications du profil, ce
 * qui garantit un libellé et un comportement identiques partout.
 *
 * États couverts (PRD §5) : confirmation (idle), envoi (`pending`), échec
 * (`error`, la confirmation RESTE ouverte pour permettre un retry), succès
 * (la carte disparaît — la confirmation se ferme d'elle-même).
 *
 * Accessibilité : `role="dialog"` + `aria-modal`, titre et corps liés par
 * `aria-labelledby` / `aria-describedby`, focus initial sur « Annuler »
 * (l'action non destructrice), Échap pour fermer, et retour du focus au
 * déclencheur. Pendant l'envoi, ni Échap ni le fond ne ferment : l'appel est
 * déjà parti.
 */
export function PublicationDeleteDialog({ deletion }: { deletion: PublicationDeletion }) {
  const { target, pending, error, cancel, confirm } = deletion;
  const titleId = useId();
  const bodyId = useId();
  const errorId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<Element | null>(null);

  /**
   * Maintien du focus dans la confirmation.
   *
   * `aria-modal` annonce une surface modale aux technologies d'assistance,
   * mais ne retient PAS la tabulation : sans ce cycle, Tab emmènerait vers la
   * page derrière, et l'action destructrice resterait ouverte derrière un
   * focus invisible. Le cycle se limite aux deux boutons — il n'y a rien
   * d'autre de focalisable dans la modale.
   */
  function cycleFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const annuler = cancelRef.current;
    const supprimer = confirmRef.current;
    if (!annuler || !supprimer) return;
    const premier = event.shiftKey ? annuler : supprimer;
    const suivant = event.shiftKey ? supprimer : annuler;
    if (document.activeElement === premier) {
      event.preventDefault();
      suivant.focus();
    }
  }

  // Mémorise le déclencheur AVANT de déplacer le focus, et le restaure à la
  // fermeture : sans cela, le focus retombe sur `<body>` et la navigation
  // clavier repart du haut de la page.
  useEffect(() => {
    if (!target) return;
    openerRef.current = document.activeElement;
    cancelRef.current?.focus();
    return () => {
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [target]);

  useEffect(() => {
    if (!target) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [cancel, target]);

  if (!target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        /* C4 — l'erreur s'AJOUTE à la description, elle ne la REMPLACE pas :
           une première version basculait `aria-describedby` sur le seul
           message d'erreur, et la phrase de PORTÉE de la suppression cessait
           alors d'être annoncée. L'ordre compte : la portée d'abord, l'erreur
           ensuite. `role="alert"` sur le message assure en plus son annonce
           immédiate. */
        aria-describedby={error ? `${bodyId} ${errorId}` : bodyId}
        data-publication-delete-dialog=""
        onKeyDown={cycleFocus}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 id={titleId} className="text-base font-bold text-neutral-900">
          {PUBLICATION_DELETE_CONFIRM_TITLE}
        </h2>
        <p id={bodyId} className="mt-2 text-sm leading-relaxed text-neutral-600">
          {PUBLICATION_DELETE_CONFIRM_BODY}
        </p>

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={cancel}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {PUBLICATION_DELETE_CONFIRM_CANCEL}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => void confirm()}
            disabled={pending}
            data-publication-delete-confirm=""
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {pending ? PUBLICATION_DELETE_PENDING : PUBLICATION_DELETE_ACTION}
          </button>
        </div>
      </div>
    </div>
  );
}
