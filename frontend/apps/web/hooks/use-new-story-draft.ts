"use client";

import type { StoryAudienceId } from "@yunicity/types";
import {
  STORIES_MEDIA_MAX_MB,
  STORIES_NEW_MEDIA_REQUIRED,
  STORIES_NEW_VIDEO_TOO_LONG,
  STORIES_VIDEO_MAX_SECONDS,
} from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export type StoryTextOverlayStyle = "classic" | "large";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,video/mp4,video/webm";
const MAX_BYTES = STORIES_MEDIA_MAX_MB * 1024 * 1024;

export type NewStoryDraftState = {
  file: File | null;
  localPreviewUrl: string | null;
  previewMediaType: "image" | "video" | null;
  caption: string;
  tags: string[];
  locationLabel: string;
  audience: StoryAudienceId;
  uploadError: string | null;
  elementNotice: string | null;
};

export function useNewStoryDraft() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [previewMediaType, setPreviewMediaType] = useState<"image" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [locationLabel, setLocationLabel] = useState("");
  const [audience, setAudience] = useState<StoryAudienceId>("public");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [elementNotice, setElementNotice] = useState<string | null>(null);
  const [textOverlayStyle, setTextOverlayStyle] = useState<StoryTextOverlayStyle>("large");

  const resetFile = useCallback(() => {
    setFile(null);
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewMediaType(null);
  }, []);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  async function validateVideoDuration(selected: File): Promise<boolean> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration <= STORIES_VIDEO_MAX_SECONDS);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(false);
      };
      video.src = URL.createObjectURL(selected);
    });
  }

  const handleSelectedFile = useCallback(
    async (selected: File | null) => {
      setUploadError(null);
      setElementNotice(null);
      if (!selected) return;

      if (selected.size > MAX_BYTES) {
        setUploadError(`Fichier trop volumineux (max. ${STORIES_MEDIA_MAX_MB} Mo).`);
        return;
      }

      const isVideo = selected.type.startsWith("video/");
      const isImage = selected.type.startsWith("image/");
      if (!isVideo && !isImage) {
        setUploadError("Format non supporté. Utilisez JPG, PNG, WEBP ou MP4.");
        return;
      }

      if (isVideo) {
        const ok = await validateVideoDuration(selected);
        if (!ok) {
          setUploadError(STORIES_NEW_VIDEO_TOO_LONG);
          return;
        }
      }

      resetFile();
      setFile(selected);
      const objectUrl = URL.createObjectURL(selected);
      setLocalPreviewUrl(objectUrl);
      setPreviewMediaType(isVideo ? "video" : "image");
    },
    [resetFile],
  );

  function addTag(raw: string) {
    const tag = raw.trim().replace(/^[@#]/, "");
    if (!tag || tags.length >= 8) return;
    if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return;
    setTags((prev) => [...prev, tag]);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((item) => item !== tag));
  }

  function clearLocation() {
    setLocationLabel("");
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function validateForPublish(): string | null {
    if (!file) return STORIES_NEW_MEDIA_REQUIRED;
    return uploadError;
  }

  return {
    fileInputRef,
    acceptedTypes: ACCEPTED_TYPES,
    file,
    localPreviewUrl,
    previewMediaType,
    caption,
    setCaption,
    tags,
    addTag,
    removeTag,
    locationLabel,
    setLocationLabel,
    clearLocation,
    audience,
    setAudience,
    uploadError,
    setUploadError,
    elementNotice,
    setElementNotice,
    textOverlayStyle,
    setTextOverlayStyle,
    resetFile,
    handleSelectedFile,
    openFilePicker,
    validateForPublish,
    canPublish: Boolean(file) && !uploadError,
  };
}
