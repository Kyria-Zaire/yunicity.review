"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useLeaveGuard } from "@/hooks/use-leave-guard";
import type { PublicationState } from "@/hooks/use-new-post-publication";

/**
 * - `draft` : rien n'est parti côté serveur, quitter perd le brouillon.
 * - `uncertain` : une création est partie sans réponse certaine (§3.4 bis).
 *   ⛔ Quitter n'annule RIEN : promettre une annulation serait faux, et le mot
 *   « Abandonner » y est proscrit.
 */
export type NewPostLeaveVariant = "draft" | "uncertain";

/**
 * Sortie de `/feed/new` — par la flèche, le chrome (top nav, rail, barre
 * basse, Create Hub) ou la fermeture d'onglet.
 *
 * Tant que le brouillon porte du contenu, toute sortie est confirmée. La
 * variante du dialogue suit l'état de l'envoi :
 *   - création partie sans réponse certaine → `uncertain` : quitter n'annule
 *     RIEN côté serveur, et on ne le promet pas (I2 de la revue finale) ;
 *   - sinon → `draft` : rien n'est parti, le brouillon sera perdu.
 */
export function useNewPostLeave({
  hasContent,
  state,
}: {
  hasContent: boolean;
  state: PublicationState;
}) {
  const router = useRouter();
  // Fonction à exécuter si la sortie est confirmée ; `null` = dialogue fermé.
  const [sortieEnAttente, setSortieEnAttente] = useState<(() => void) | null>(null);

  const garde = hasContent && state.kind !== "done";
  const variant: NewPostLeaveVariant =
    state.kind === "creating" || state.kind === "undetermined" ? "uncertain" : "draft";

  // `setState(fn)` exécuterait `fn` : on enveloppe la fonction à conserver.
  const retenir = useCallback((proceed: () => void) => setSortieEnAttente(() => proceed), []);

  useLeaveGuard({ active: garde, onIntercept: retenir });

  const quitter = useCallback(() => {
    const versLeFil = () => router.push("/feed");
    if (garde) retenir(versLeFil);
    else versLeFil();
  }, [garde, retenir, router]);

  const confirmer = useCallback(() => {
    const proceed = sortieEnAttente;
    setSortieEnAttente(null);
    proceed?.();
  }, [sortieEnAttente]);

  const rester = useCallback(() => setSortieEnAttente(null), []);

  return { open: sortieEnAttente !== null, variant, quitter, confirmer, rester };
}
