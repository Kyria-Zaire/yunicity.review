"use client";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useCallback } from "react";

/** Soumission publication feed depuis un contexte territorial. */
export function useTerritoryPostSubmit() {
  const api = useYunicityApi();

  return useCallback(
    async (body: string, mediaUrl?: string | null) => {
      await api.createFeedPost({
        body,
        media_url: mediaUrl?.trim() ? mediaUrl.trim() : null,
      });
    },
    [api],
  );
}
