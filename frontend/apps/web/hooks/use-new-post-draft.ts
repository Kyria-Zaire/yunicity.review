"use client";

import type { PostCreatePayload, PostMediaItem } from "@yunicity/types";
import { POST_COMPOSER_BODY_MAX } from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNewPostLegacyOptions } from "@/hooks/use-new-post-legacy-options";
import {
  mediaResolutionLabels,
  publishBlockReason as computePublishBlockReason,
} from "@/lib/feed/post-draft-gates";
import {
  type MediaDraft,
  type MediaDraftStatus,
  type MediaMoveDirection,
  type RejectedFile,
  collectMediaDrafts,
  deducePostFormat,
  moveMediaDraft,
  withMediaStatus,
} from "@/lib/feed/post-media-drafts";

export type {
  MediaDraft,
  MediaDraftStatus,
  MediaMoveDirection,
  RejectedFile,
} from "@/lib/feed/post-media-drafts";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,video/mp4,video/webm";

export function useNewPostDraft(city: string) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const options = useNewPostLegacyOptions();
  const { allowComments, allowShares, audienceUserIds, format, pollOptions, useMediaCaption, visibility } =
    options;
  const [medias, setMedias] = useState<MediaDraft[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);
  /** Le dernier passage du sélecteur n'a livré AUCUN fichier — dit, jamais tu. */
  const [selectionEmpty, setSelectionEmpty] = useState(false);

  const charCount = body.length;
  const trimmedBody = body.trim();

  /** Format déduit du lot : plus aucun onglet ne décide à la place du contenu. */
  const postFormat = useMemo(() => deducePostFormat(medias), [medias]);

  const canPublish = useMemo(() => {
    if (charCount > POST_COMPOSER_BODY_MAX) return false;
    return trimmedBody.length > 0 || medias.length > 0;
  }, [charCount, medias.length, trimmedBody]);

  const hasContent = trimmedBody.length > 0 || medias.length > 0;

  /**
   * Un ou plusieurs fichiers ont été refusés A LA SELECTION — format, taille,
   * quota. Tant que l'utilisateur n'a pas tranché, publier enverrait un post
   * amputé de ce qu'il croit joindre.
   *
   * A ne pas confondre avec un ECHEC D'ENVOI : un fichier localement valide
   * dont l'upload a échoué n'est pas « refusé », il reste dans le brouillon
   * avec le statut `failed` et la tentative est rejouable.
   */
  const mediaRejected = rejectedFiles.length > 0;
  const uploadError = mediaRejected ? (rejectedFiles[rejectedFiles.length - 1]?.reason ?? null) : null;

  const mediaResolution = useMemo(() => mediaResolutionLabels(medias.length > 0), [medias.length]);

  const publishBlockReason = useMemo(
    () =>
      computePublishBlockReason({
        charCount,
        format,
        pollOptions,
        rejectionReason: uploadError,
        canPublish,
        visibility,
        audienceCount: audienceUserIds.length,
      }),
    [audienceUserIds.length, canPublish, charCount, format, pollOptions, uploadError, visibility],
  );

  /**
   * Miroir SYNCHRONE de `medias`, et unique source de vérité pour une lecture
   * immédiate.
   *
   * Deux besoins, un seul mécanisme :
   *   - `moveMedia` doit RENDRE la nouvelle position tout de suite, pour
   *     l'annonce `aria-live`. La fonction de mise à jour passée à `setMedias`
   *     n'est PAS exécutée avant le retour du gestionnaire — s'en servir pour
   *     calculer la position rendait toujours 0 (preuve :
   *     `use-new-post-draft-order.test.tsx`).
   *   - le nettoyage au démontage doit révoquer les aperçus restants sans
   *     réarmer son effet à chaque modification du tableau : rattaché à
   *     `medias`, il révoquait l'aperçu d'un média toujours affiché.
   */
  const mediasRef = useRef<MediaDraft[]>([]);
  useEffect(() => {
    return () => {
      for (const item of mediasRef.current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  /**
   * Applique une transformation au lot : la ref d'abord, l'état ensuite. Deux
   * appels dans le même tick s'enchaînent donc correctement, sans dépendre du
   * moment où React re-rend.
   */
  const commitMedias = useCallback((transform: (current: MediaDraft[]) => MediaDraft[]) => {
    const next = transform(mediasRef.current);
    if (next === mediasRef.current) return;
    mediasRef.current = next;
    setMedias(next);
  }, []);

  const addFiles = useCallback(
    (files: FileList | null) => {
      // ⛔ Plus de retour muet : une livraison vide (annulation, ou sélection
      // perdue par le navigateur) est annoncée. Brouillon et refus en cours
      // sont laissés intacts — rien n'est retiré.
      if (!files || files.length === 0) {
        setSelectionEmpty(true);
        return;
      }
      setSelectionEmpty(false);
      // Une NOUVELLE sélection remplace l'annonce précédente : les fichiers
      // refusés au tour d'avant ne sont plus ceux que l'utilisateur regarde.
      setRejectedFiles([]);
      const { accepted, rejected } = collectMediaDrafts(
        Array.from(files),
        mediasRef.current.length,
      );
      if (accepted.length > 0) commitMedias((current) => [...current, ...accepted]);
      if (rejected.length > 0) setRejectedFiles(rejected);
    },
    [commitMedias],
  );

  /**
   * Abandon EXPLICITE des seuls fichiers refusés : n'envoie rien, ne publie
   * rien, et ne retire aucun média valide déjà sélectionné.
   */
  const dismissRejectedFiles = useCallback(() => {
    setRejectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /**
   * Compatibilité : l'écran actuel appelle encore cette forme asynchrone, et
   * son contrat historique veut qu'une NOUVELLE sélection efface l'annonce
   * précédente avant d'ajouter.
   */
  const handleSelectedFiles = useCallback(
    async (files: FileList | null) => {
      addFiles(files);
    },
    [addFiles],
  );

  const removeMedia = useCallback(
    (id: string) => {
      commitMedias((current) => {
        const target = current.find((item) => item.id === id);
        if (!target) return current;
        URL.revokeObjectURL(target.previewUrl);
        return current.filter((item) => item.id !== id);
      });
    },
    [commitMedias],
  );

  /**
   * Identifiants du lot TEL QU'IL EST MAINTENANT, dans l'ordre affiché.
   *
   * Le hook d'envoi travaille sur un instantané pris au clic ; il relit ce lot
   * avant chaque envoi et au moment de composer la publication. Un média retiré
   * pendant l'envoi n'est donc ni envoyé ni publié, et l'ordre publié suit
   * l'ordre visible (I8 de la revue finale).
   */
  const mediaIdsNow = useCallback(() => mediasRef.current.map((item) => item.id), []);

  /**
   * Empreinte de ce qui partirait MAINTENANT : texte normalisé + identités des
   * médias dans l'ordre affiché. Le hook d'envoi lie la clé d'idempotence à
   * cette empreinte — une clé ne sert jamais un contenu modifié.
   */
  const contentSignature = useCallback(
    () => JSON.stringify([trimmedBody, mediasRef.current.map((item) => item.id)]),
    [trimmedBody],
  );

  /** Rend la nouvelle position affichée (base 1) — lue tout de suite par l'UI. */
  const moveMedia = useCallback(
    (id: string, direction: MediaMoveDirection): number => {
      const result = moveMediaDraft(mediasRef.current, id, direction);
      // Un déplacement impossible rend le MÊME tableau : pas de rendu inutile.
      commitMedias((current) => (result.medias === current ? current : [...result.medias]));
      return result.position;
    },
    [commitMedias],
  );

  const setStatus = useCallback(
    (id: string, status: MediaDraftStatus) => {
      commitMedias((current) => withMediaStatus(current, id, status));
    },
    [commitMedias],
  );

  const markUploading = useCallback((id: string) => setStatus(id, { kind: "uploading" }), [setStatus]);
  const markUploaded = useCallback(
    (id: string, url: string, mediaType: "image" | "video") =>
      setStatus(id, { kind: "uploaded", url, mediaType }),
    [setStatus],
  );
  const markFailed = useCallback(
    (id: string, reason: string) => setStatus(id, { kind: "failed", reason }),
    [setStatus],
  );

  /**
   * ⚠️ `uploaded` est un ARGUMENT, pas une lecture de l'état.
   *
   * Le hook d'envoi appelle cette fonction depuis une closure asynchrone figée
   * au rendu du clic : `medias` y est l'état d'AVANT les envois, donc lire les
   * URL depuis l'état produirait `media_urls: []`.
   *
   * `postFormat`, lui, vient bien de l'état : il ne dépend que des médias
   * SÉLECTIONNÉS, connus dès le clic — pas de leur envoi.
   */
  const buildCreatePayload = useCallback(
    (uploaded: PostMediaItem[]): PostCreatePayload => {
      const poll =
        format === "poll"
          ? {
              question: trimmedBody,
              options: pollOptions.map((item) => item.trim()).filter(Boolean),
            }
          : null;

      return {
        body: trimmedBody || (poll?.question ?? "Publication"),
        media_urls: uploaded,
        media_url: uploaded[0]?.url ?? null,
        visibility,
        // Sondage et lieu restent portés par l'onglet tant que leur UI existe ;
        // pour tout le reste le format se déduit du contenu joint.
        post_format: format === "poll" || format === "location" ? format : postFormat,
        allow_comments: allowComments,
        allow_shares: allowShares,
        use_media_caption: useMediaCaption,
        poll,
      };
    },
    [allowComments, allowShares, format, pollOptions, postFormat, trimmedBody, useMediaCaption, visibility],
  );

  return {
    city,
    fileInputRef,
    acceptedTypes: ACCEPTED_TYPES,
    body,
    setBody,
    charCount,
    // Options héritées de l'écran actuel — voir `use-new-post-legacy-options`.
    ...options,
    medias,
    /** Compatibilité : nom historique du même tableau. */
    selectedMedia: medias,
    rejectedFiles,
    selectionEmpty,
    dismissRejectedFiles,
    /** Compatibilité : nom historique de `dismissRejectedFiles`. */
    dismissRejectedMedia: dismissRejectedFiles,
    addFiles,
    handleSelectedFiles,
    removeMedia,
    moveMedia,
    markUploading,
    markUploaded,
    markFailed,
    mediaIdsNow,
    contentSignature,
    uploadError,
    mediaRejected,
    mediaResolution,
    postFormat,
    canPublish,
    hasContent,
    publishBlockReason,
    buildCreatePayload,
  };
}

export type NewPostDraft = ReturnType<typeof useNewPostDraft>;
