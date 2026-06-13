"use client";

import type { LocalVideoFeedItem, LocalVideoReportReason } from "@yunicity/types";
import {
  LOCAL_VIDEO_REPORT_ERROR,
  LOCAL_VIDEO_SHARE_COPIED,
  applyLocalVideoLikeResponse,
  applyLocalVideoLikeToggle,
  shareLocalVideoWithFallback,
} from "@yunicity/utils";
import { useCallback, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

type UseLocalVideoInteractionsOptions = {
  updateItem: (videoId: string, updater: (item: LocalVideoFeedItem) => LocalVideoFeedItem) => void;
};

export function useLocalVideoInteractions({ updateItem }: UseLocalVideoInteractionsOptions) {
  const api = useYunicityApi();
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportedVideoIds, setReportedVideoIds] = useState<Set<string>>(() => new Set());

  const toggleLike = useCallback(
    async (item: LocalVideoFeedItem) => {
      const nextLiked = !item.liked_by_me;
      updateItem(item.id, (current) => applyLocalVideoLikeToggle(current, nextLiked));
      try {
        const response = nextLiked
          ? await api.likeLocalVideo(item.id)
          : await api.unlikeLocalVideo(item.id);
        updateItem(item.id, (current) => applyLocalVideoLikeResponse(current, response));
      } catch {
        updateItem(item.id, (current) => applyLocalVideoLikeToggle(current, item.liked_by_me));
        throw new Error("Impossible de mettre à jour le like.");
      }
    },
    [api, updateItem],
  );

  const shareVideo = useCallback(
    async (item: LocalVideoFeedItem) => {
      const result = await shareLocalVideoWithFallback(item);
      if (result === "copied") {
        setShareHint(LOCAL_VIDEO_SHARE_COPIED);
        window.setTimeout(() => setShareHint(null), 2500);
      }
    },
    [],
  );

  const reportVideo = useCallback(
    async (videoId: string, reason: LocalVideoReportReason) => {
      setReportError(null);
      try {
        await api.reportLocalVideo(videoId, { reason });
        setReportedVideoIds((prev) => new Set(prev).add(videoId));
      } catch {
        setReportError(LOCAL_VIDEO_REPORT_ERROR);
        throw new Error(LOCAL_VIDEO_REPORT_ERROR);
      }
    },
    [api],
  );

  return {
    toggleLike,
    shareVideo,
    reportVideo,
    shareHint,
    reportError,
    hasReported: (videoId: string) => reportedVideoIds.has(videoId),
  };
}
