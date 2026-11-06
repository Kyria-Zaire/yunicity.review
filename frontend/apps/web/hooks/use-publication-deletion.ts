"use client";

import { humanizePublicationDeleteFailure } from "@yunicity/utils";
import { useCallback, useRef, useState } from "react";

/** Cible minimale : seul l'identifiant est nécessaire pour supprimer. */
export type PublicationDeletionTarget = { id: string };

export type PublicationDeletion = {
  /** Publication visée par la confirmation ouverte, `null` si aucune. */
  target: PublicationDeletionTarget | null;
  pending: boolean;
  /** Message FRANÇAIS prêt à afficher, jamais le détail serveur brut. */
  error: string | null;
  request: (post: PublicationDeletionTarget) => void;
  cancel: () => void;
  confirm: () => Promise<void>;
};

/**
 * Machine à états de la suppression d'une publication — PROFILE-POST-MENU-01.
 *
 * ── Pourquoi un hook, et pourquoi SANS provider ──────────────────────────────
 * Trois surfaces partagent exactement ce cycle : fil (les trois paliers),
 * publications du profil propriétaire, et toute surface future. Dupliquer
 * `confirm / pending / error` trois fois garantissait trois comportements
 * divergents au premier correctif.
 *
 * `deletePost` est INJECTÉ et non lu d'un provider : `FeedCardWithDependencies`
 * doit rester montable hors de l'arbre de contexte
 * (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A-TER, verrouillé par
 * `lib/feed/feed-card-seam.test.ts`). Le hook n'appelle donc ni `useAuth` ni
 * `useYunicityApi`.
 *
 * Invariants :
 *   • rien ne partage l'écran sans confirmation explicite — `request` n'écrit
 *     RIEN, seul `confirm` appelle le réseau ;
 *   • un échec GARDE la confirmation ouverte avec son message : l'utilisateur
 *     voit ce qui a échoué et peut réessayer ou annuler ;
 *   • un second `confirm` dans le même tick est ignoré (verrou par ref), sans
 *     quoi un double-clic enverrait deux `DELETE`.
 */
export function usePublicationDeletion({
  deletePost,
  onDeleted,
}: {
  deletePost: (postId: string) => Promise<void>;
  /** Appelé APRÈS un `204`, pour retirer la carte de la liste qui la porte. */
  onDeleted?: (postId: string) => void;
}): PublicationDeletion {
  const [target, setTarget] = useState<PublicationDeletionTarget | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const request = useCallback((post: PublicationDeletionTarget) => {
    setError(null);
    setTarget(post);
  }, []);

  const cancel = useCallback(() => {
    if (inFlightRef.current) return;
    setError(null);
    setTarget(null);
  }, []);

  const confirm = useCallback(async () => {
    if (!target || inFlightRef.current) return;
    inFlightRef.current = true;
    const postId = target.id;
    setPending(true);
    setError(null);
    try {
      await deletePost(postId);
      setTarget(null);
      onDeleted?.(postId);
    } catch (err) {
      setError(humanizePublicationDeleteFailure(err));
    } finally {
      inFlightRef.current = false;
      setPending(false);
    }
  }, [deletePost, onDeleted, target]);

  return { target, pending, error, request, cancel, confirm };
}
