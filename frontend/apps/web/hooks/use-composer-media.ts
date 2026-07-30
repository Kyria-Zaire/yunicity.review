"use client";

import { useCallback, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { COMPOSER_MEDIA_UPLOAD_FAILED, validateComposerMediaFile } from "@yunicity/utils";

/**
 * Upload média d'un composer (feed + territorial). Sélection fichier → validation client
 * (type/taille) → upload R2 via `uploadPostMedia` → `mediaUrl` prêt pour `onSubmit`.
 * Partagé pour ne pas dupliquer la logique entre FeedComposer et le composer mobile.
 */
export function useComposerMedia() {
  const api = useYunicityApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const openPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (file: File | null) => {
      if (!file) return;
      const check = validateComposerMediaFile({ type: file.type, size: file.size });
      if (!check.ok) {
        setMediaError(check.error);
        return;
      }
      setMediaError(null);
      setUploading(true);
      try {
        const response = await api.uploadPostMedia(file);
        setMediaUrl(response.url);
      } catch {
        setMediaError(COMPOSER_MEDIA_UPLOAD_FAILED);
      } finally {
        setUploading(false);
      }
    },
    [api],
  );

  const clearMedia = useCallback(() => {
    setMediaUrl(null);
    setMediaError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return { fileInputRef, mediaUrl, uploading, mediaError, openPicker, onFileChange, clearMedia };
}
