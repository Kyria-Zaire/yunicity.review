"use client";

import type { LocalVideo, LocalVideoFeedItem } from "@yunicity/types";
import {
  humanizeLocalVideoError,
  isLocalVideoProcessingFailed,
  isLocalVideoProcessingReady,
  LocalVideoError,
  mapLocalVideoToFeedPreview,
  readLocalVideoPendingRecords,
  removeLocalVideoPending,
  type LocalVideoPendingRecord,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

const POLL_INTERVAL_MS = 3_000;

export type LocalVideoPendingTrack = {
  record: LocalVideoPendingRecord;
  video: LocalVideo | null;
  error: string | null;
};

type UseLocalVideoPendingTrackerOptions = {
  onPublished?: (videoId: string) => void;
};

export function useLocalVideoPendingTracker(options: UseLocalVideoPendingTrackerOptions = {}) {
  const api = useYunicityApi();
  const [tracks, setTracks] = useState<LocalVideoPendingTrack[]>([]);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const onPublishedRef = useRef(options.onPublished);
  onPublishedRef.current = options.onPublished;

  const syncFromStorage = useCallback(() => {
    const records = readLocalVideoPendingRecords();
    setTracks((prev) => {
      const byId = new Map(prev.map((track) => [track.record.videoId, track]));
      return records.map((record) => {
        const existing = byId.get(record.videoId);
        return existing ?? { record, video: null, error: null };
      });
    });
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  const pendingIdsKey = useMemo(
    () => tracks.map((track) => track.record.videoId).sort().join("|"),
    [tracks],
  );

  useEffect(() => {
    if (!pendingIdsKey) return;

    let cancelled = false;

    async function pollOnce() {
      const current = tracksRef.current;
      for (const track of current) {
        try {
          const video = await api.getVideo(track.record.videoId);
          if (cancelled) return;

          if (isLocalVideoProcessingReady(video)) {
            removeLocalVideoPending(track.record.videoId);
            onPublishedRef.current?.(track.record.videoId);
            setTracks((prev) => prev.filter((item) => item.record.videoId !== track.record.videoId));
            continue;
          }

          if (isLocalVideoProcessingFailed(video)) {
            removeLocalVideoPending(track.record.videoId);
            setTracks((prev) =>
              prev.map((item) =>
                item.record.videoId === track.record.videoId
                  ? {
                      ...item,
                      video,
                      error: humanizeLocalVideoError(
                        new LocalVideoError(
                          "LOCAL_VIDEO_TRANSCODE_FAILED",
                          video.processing_error ?? "Impossible de préparer la vidéo.",
                          500,
                        ),
                        "Le traitement a échoué.",
                      ),
                    }
                  : item,
              ),
            );
            continue;
          }

          setTracks((prev) =>
            prev.map((item) =>
              item.record.videoId === track.record.videoId
                ? { ...item, video, error: null }
                : item,
            ),
          );
        } catch (err) {
          if (cancelled) return;
          setTracks((prev) =>
            prev.map((item) =>
              item.record.videoId === track.record.videoId
                ? {
                    ...item,
                    error: humanizeLocalVideoError(err, "Impossible de suivre le traitement."),
                  }
                : item,
            ),
          );
        }
      }
    }

    void pollOnce();
    const timer = window.setInterval(() => void pollOnce(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [api, pendingIdsKey]);

  const processingFeedItems = useMemo((): LocalVideoFeedItem[] => {
    return tracks.map((track) => {
      if (track.video) return mapLocalVideoToFeedPreview(track.video);
      return mapLocalVideoToFeedPreview({
        id: track.record.videoId,
        author_user_id: "",
        city: "Reims",
        neighborhood_id: "",
        video_type: "moment",
        title: track.record.title,
        description: null,
        cultural_place_id: null,
        local_event_id: null,
        tribe_id: null,
        organization_id: null,
        media_url: "",
        thumbnail_url: "",
        duration_seconds: 0,
        file_size_bytes: 0,
        mime_type: "video/mp4",
        latitude: null,
        longitude: null,
        status: "processing",
        processing_status: "processing",
        processing_error: null,
        published_at: null,
        created_at: track.record.registeredAt,
      });
    });
  }, [tracks]);

  const dismissTrack = useCallback((videoId: string) => {
    removeLocalVideoPending(videoId);
    setTracks((prev) => prev.filter((track) => track.record.videoId !== videoId));
  }, []);

  return {
    tracks,
    processingFeedItems,
    dismissTrack,
    syncFromStorage,
  };
}
