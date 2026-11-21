"use client";

import type { LocalVideoFeedItem, LocalVideoReportReason } from "@yunicity/types";
import {
  LOCAL_VIDEO_REPORT_ERROR,
  LOCAL_VIDEO_SHARE_COPIED,
  applyLocalVideoLikeResponse,
  applyLocalVideoLikeToggle,
  buildLocalVideoShareUrl,
  copyLocalVideoLink,
  shareLocalVideoWithFallback,
} from "@yunicity/utils";
import { useCallback, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useOptionalLocalVideoShareFeedback } from "@/lib/videos/local-video-share-feedback-context";

type UseLocalVideoInteractionsOptions = {
  updateItem: (videoId: string, updater: (item: LocalVideoFeedItem) => LocalVideoFeedItem) => void;
};

export function useLocalVideoInteractions({ updateItem }: UseLocalVideoInteractionsOptions) {
  const api = useYunicityApi();
  const shareFeedback = useOptionalLocalVideoShareFeedback();
  /** Repli hors `/videos` (ex. fil accueil) : ancien hint « Lien copié » uniquement. */
  const [shareHint, setShareHint] = useState<string | null>(null);
  const shareHintTimerRef = useRef<number>(0);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportedVideoIds, setReportedVideoIds] = useState<Set<string>>(() => new Set());

  const showLegacyCopiedHint = useCallback(() => {
    window.clearTimeout(shareHintTimerRef.current);
    setShareHint(LOCAL_VIDEO_SHARE_COPIED);
    shareHintTimerRef.current = window.setTimeout(() => setShareHint(null), 2500);
  }, []);

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
      if (shareFeedback) {
        shareFeedback.rememberShareTrigger();
      }
      const result = await shareLocalVideoWithFallback(item);
      const url = buildLocalVideoShareUrl(item.id);

      if (shareFeedback) {
        // /videos : feedback centralisé H1/H2/H3 — pas de hint local (évite doublon).
        if (result === "copied") {
          shareFeedback.showCopied();
          return;
        }
        if (result === "failed") {
          shareFeedback.showFailed(url);
          return;
        }
        if (result === "unavailable") {
          shareFeedback.showManual(url);
          return;
        }
        return;
      }

      // Hors Provider (fil accueil, etc.) : conserver uniquement l'ancien « Lien copié ».
      if (result === "copied") {
        showLegacyCopiedHint();
      }
    },
    [shareFeedback, showLegacyCopiedHint],
  );

  const copyShareLinkFromFailed = useCallback(async () => {
    if (!shareFeedback || shareFeedback.feedback.kind !== "failed") return;
    const url = shareFeedback.feedback.url;
    const result = await copyLocalVideoLink(url);
    if (result === "copied") {
      shareFeedback.showCopied();
      return;
    }
    shareFeedback.showManual(url);
  }, [shareFeedback]);

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
    copyShareLinkFromFailed,
    reportVideo,
    /** Null sous Provider `/videos` ; hint legacy hors Provider après copie réussie. */
    shareHint: shareFeedback ? null : shareHint,
    reportError,
    hasReported: (videoId: string) => reportedVideoIds.has(videoId),
  };
}
