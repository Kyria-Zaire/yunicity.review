"use client";

import {
  EVENT_DETAIL_ENDED_NOTICE,
  EVENT_DETAIL_ENDED_REMOVE,
  EVENT_DETAIL_ENDED_REMOVE_ERROR,
  EVENT_DETAIL_ENDED_REMOVED,
} from "@yunicity/utils";
import { CalendarX2, CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";

export type EventEndedRemovalStatus = "idle" | "pending" | "removed" | "error";

export type EventEndedRemoval = {
  status: EventEndedRemovalStatus;
  onRemove: () => void;
};

type EventEndedActionsProps = {
  interestedByMe: boolean;
  isAuthenticated: boolean;
  removal: EventEndedRemoval;
};

/**
 * EVENTS-PAST-01 — bloc d'actions d'un événement terminé, commun aux trois formats.
 * Aucune action d'ajout. Si l'événement est enregistré : un seul bouton de retrait ;
 * succès annoncé seulement après réponse du serveur, échec annoncé avec le bouton conservé.
 */
export function EventEndedActions({ interestedByMe, isAuthenticated, removal }: EventEndedActionsProps) {
  const removedRef = useRef<HTMLParagraphElement>(null);
  /** Retrait demandé depuis CE bloc (clic ou clavier), en attente de confirmation. */
  const requestedHere = useRef(false);
  const isRemoved = removal.status === "removed";
  const isPending = removal.status === "pending";
  const canRemove = isAuthenticated && interestedByMe && !isRemoved;

  function handleRemove() {
    if (isPending) return;
    requestedHere.current = true;
    removal.onRemove();
  }

  useEffect(() => {
    // Focus déplacé UNIQUEMENT quand le retrait demandé ici vient d'être confirmé : le bouton
    // disparaît, le message prend sa place. Ni le passage automatique à « terminé », ni un
    // montage avec un état déjà « retiré », ni un échec ne déplacent le focus.
    if (removal.status === "removed" && requestedHere.current) {
      requestedHere.current = false;
      removedRef.current?.focus();
    } else if (removal.status === "error" || removal.status === "idle") {
      requestedHere.current = false;
    }
  }, [removal.status]);

  return (
    <div className="space-y-2.5" data-event-ended-actions="">
      <p className="rounded-xl bg-neutral-100 px-4 py-3 text-center text-sm font-semibold text-neutral-700">
        {EVENT_DETAIL_ENDED_NOTICE}
      </p>
      {isRemoved ? (
        <p
          ref={removedRef}
          tabIndex={-1}
          role="status"
          className="flex items-center justify-center gap-2 rounded-xl px-2 py-1 text-sm font-semibold text-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          {EVENT_DETAIL_ENDED_REMOVED}
        </p>
      ) : null}
      {canRemove ? (
        <>
          <button
            type="button"
            // `aria-disabled` plutôt que `disabled` : le bouton garde le focus clavier pendant
            // l'envoi, et le retrouve en cas d'échec. Le double envoi est bloqué par l'écran.
            onClick={handleRemove}
            aria-disabled={isPending}
            aria-busy={isPending}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-yunicity-primary/50 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]/60 aria-disabled:cursor-wait aria-disabled:opacity-50"
          >
            <CalendarX2 className="h-4 w-4" aria-hidden />
            {EVENT_DETAIL_ENDED_REMOVE}
          </button>
          {removal.status === "error" ? (
            <p role="alert" className="text-center text-sm font-medium text-red-700">
              {EVENT_DETAIL_ENDED_REMOVE_ERROR}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
