"use client";

import type {
  PostCrossPostTargets,
  PostFormatId,
  PostMediaItem,
  PostVisibilityId,
} from "@yunicity/types";
import {
  COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
  COMPOSER_MEDIA_INVALID_TYPE,
  POST_COMPOSER_BODY_MAX,
  POST_MEDIA_MAX_COUNT,
  POST_NEW_BODY_REQUIRED,
  POST_NEW_POLL_MIN_OPTIONS,
  STORIES_MEDIA_MAX_MB,
  composerMediaKindFromMetadata,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SelectedMediaDraft = {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: "image" | "video";
};

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,video/mp4,video/webm";
const MAX_BYTES = STORIES_MEDIA_MAX_MB * 1024 * 1024;

function newMediaId(): string {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useNewPostDraft(city: string) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [format, setFormat] = useState<PostFormatId>("photo");
  const [visibility, setVisibility] = useState<PostVisibilityId>("public");
  const [allowComments, setAllowComments] = useState(true);
  const [allowShares, setAllowShares] = useState(true);
  const [useMediaCaption, setUseMediaCaption] = useState(true);
  const [locationLabel, setLocationLabel] = useState("");
  const [activityLabel, setActivityLabel] = useState("");
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [linkedTribeId, setLinkedTribeId] = useState<string | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [audienceUserIds, setAudienceUserIds] = useState<string[]>([]);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [crossPost, setCrossPost] = useState<PostCrossPostTargets>({
    instagram: true,
    tiktok: true,
    facebook: false,
    twitter: false,
  });
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaDraft[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const charCount = body.length;
  const trimmedBody = body.trim();

  const canPublish = useMemo(() => {
    if (charCount > POST_COMPOSER_BODY_MAX) return false;
    if (format === "poll") {
      const options = pollOptions.map((item) => item.trim()).filter(Boolean);
      return trimmedBody.length > 0 && options.length >= 2;
    }
    if (format === "text") {
      return trimmedBody.length > 0;
    }
    if (format === "photo" || format === "video") {
      return trimmedBody.length > 0 || selectedMedia.length > 0;
    }
    if (format === "location") {
      return trimmedBody.length > 0 || locationLabel.trim().length > 0;
    }
    return trimmedBody.length > 0 || selectedMedia.length > 0;
  }, [charCount, format, locationLabel, pollOptions, selectedMedia.length, trimmedBody]);

  /**
   * Un fichier que l'utilisateur a choisi et que nous avons refusé. Tant qu'il
   * n'a pas tranché, publier enverrait un post sans le média qu'il croit
   * joindre — et ici le refus n'était même pas affiché.
   */
  const mediaRejected = uploadError !== null;

  /** Abandon EXPLICITE du média refusé : n'envoie rien, ne publie rien. */
  const continueWithoutMedia = useCallback(() => {
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const publishBlockReason = useMemo(() => {
    if (charCount > POST_COMPOSER_BODY_MAX) {
      return `Texte limité à ${POST_COMPOSER_BODY_MAX} caractères.`;
    }
    if (format === "poll") {
      const options = pollOptions.map((item) => item.trim()).filter(Boolean);
      if (options.length < 2) return POST_NEW_POLL_MIN_OPTIONS;
    }
    if (mediaRejected) return uploadError;
    if (!canPublish) return POST_NEW_BODY_REQUIRED;
    if (visibility === "custom" && audienceUserIds.length === 0) {
      return "Sélectionnez au moins une personne pour une audience personnalisée.";
    }
    return null;
  }, [
    audienceUserIds.length,
    canPublish,
    charCount,
    format,
    mediaRejected,
    pollOptions,
    uploadError,
    visibility,
  ]);

  // Le nettoyage ne doit se produire qu'au démontage. Rattaché à `selectedMedia`,
  // il s'exécutait à CHAQUE modification du tableau : ajouter un second média
  // révoquait l'aperçu du premier, toujours affiché — l'image se cassait sous
  // les yeux de l'utilisateur. La ref porte l'état courant sans réarmer l'effet.
  const selectedMediaRef = useRef<SelectedMediaDraft[]>([]);
  useEffect(() => {
    selectedMediaRef.current = selectedMedia;
  }, [selectedMedia]);
  useEffect(() => {
    return () => {
      for (const item of selectedMediaRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const revokeMedia = useCallback((item: SelectedMediaDraft) => {
    URL.revokeObjectURL(item.previewUrl);
  }, []);

  const handleSelectedFiles = useCallback(
    async (files: FileList | null) => {
      setUploadError(null);
      if (!files || files.length === 0) return;

      const next: SelectedMediaDraft[] = [];
      for (const file of Array.from(files)) {
        if (selectedMedia.length + next.length >= POST_MEDIA_MAX_COUNT) {
          setUploadError(`Maximum ${POST_MEDIA_MAX_COUNT} médias.`);
          break;
        }
        if (file.size > MAX_BYTES) {
          setUploadError(`Fichier trop volumineux (max. ${STORIES_MEDIA_MAX_MB} Mo).`);
          continue;
        }
        // Même contrat que les quatre autres composers : HEIC/HEIF refusé
        // explicitement (par MIME ou extension), et un type que le navigateur
        // n'a pas renseigné est tranché par l'extension plutôt que refusé —
        // c'est le cas courant du partage iOS et de certains sélecteurs Android.
        const nature = composerMediaKindFromMetadata(file);
        if (nature === "heic") {
          setUploadError(COMPOSER_MEDIA_HEIC_NOT_SUPPORTED);
          continue;
        }
        if (nature === "unknown") {
          setUploadError(COMPOSER_MEDIA_INVALID_TYPE);
          continue;
        }
        const isVideo = nature === "video";
        const isImage = nature === "image";
        if (format === "photo" && isVideo) continue;
        if (format === "video" && isImage) continue;
        next.push({
          id: newMediaId(),
          file,
          previewUrl: URL.createObjectURL(file),
          mediaType: isVideo ? "video" : "image",
        });
      }

      if (next.length > 0) {
        setSelectedMedia((prev) => [...prev, ...next]);
      }
    },
    [format, selectedMedia.length],
  );

  function removeMedia(id: string) {
    setSelectedMedia((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) revokeMedia(target);
      return prev.filter((item) => item.id !== id);
    });
  }

  function toggleCrossPost(key: keyof PostCrossPostTargets) {
    setCrossPost((prev: PostCrossPostTargets) => ({ ...prev, [key]: !prev[key] }));
  }

  function updatePollOption(index: number, value: string) {
    setPollOptions((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function addPollOption() {
    setPollOptions((prev) => (prev.length >= 4 ? prev : [...prev, ""]));
  }

  function buildCreatePayload(uploadedMedia: PostMediaItem[]) {
    const poll =
      format === "poll"
        ? {
            question: trimmedBody,
            options: pollOptions.map((item) => item.trim()).filter(Boolean),
          }
        : null;

    return {
      body: trimmedBody || (poll?.question ?? "Publication"),
      media_urls: uploadedMedia,
      media_url: uploadedMedia[0]?.url ?? null,
      visibility,
      post_format: format,
      allow_comments: allowComments,
      allow_shares: allowShares,
      scheduled_at: scheduledAt,
      location_label: locationLabel.trim() || null,
      activity_label: activityLabel.trim() || null,
      linked_tribe_id: linkedTribeId,
      tagged_user_ids: taggedUserIds,
      audience_user_ids: visibility === "custom" ? audienceUserIds : [],
      poll,
      cross_post_targets: crossPost,
      use_media_caption: useMediaCaption,
    };
  }

  return {
    city,
    fileInputRef,
    acceptedTypes: ACCEPTED_TYPES,
    body,
    setBody,
    format,
    setFormat,
    visibility,
    setVisibility,
    allowComments,
    setAllowComments,
    allowShares,
    setAllowShares,
    useMediaCaption,
    setUseMediaCaption,
    locationLabel,
    setLocationLabel,
    activityLabel,
    setActivityLabel,
    scheduledAt,
    setScheduledAt,
    linkedTribeId,
    setLinkedTribeId,
    taggedUserIds,
    setTaggedUserIds,
    audienceUserIds,
    setAudienceUserIds,
    pollOptions,
    updatePollOption,
    addPollOption,
    crossPost,
    toggleCrossPost,
    selectedMedia,
    handleSelectedFiles,
    removeMedia,
    uploadError,
    setUploadError,
    mediaRejected,
    continueWithoutMedia,
    charCount,
    canPublish,
    publishBlockReason,
    buildCreatePayload,
  };
}

export type NewPostDraft = ReturnType<typeof useNewPostDraft>;
