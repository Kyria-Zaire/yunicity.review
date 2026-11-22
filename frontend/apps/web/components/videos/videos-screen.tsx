"use client";

import { SessionExpiredPanel } from "@/components/auth/session-expired-panel";
import { LocalVideoReportSheet } from "@/components/videos/local-video-report-sheet";
import { LocalVideoShareFeedback } from "@/components/videos/local-video-share-feedback";
import { VideosDesktopOverlayPlayer } from "@/components/videos/desktop/videos-desktop-overlay-player";
import { VideoDetailScreen } from "@/components/videos/video-detail-screen";
import { VideosAppShell } from "@/components/videos/videos-app-shell";
import { VideosDiscoveryScreen } from "@/components/videos/videos-discovery-screen";
import { VideosFeedError } from "@/components/videos/videos-feed-error";
import { VideosFeedSkeleton } from "@/components/videos/videos-feed-skeleton";
import { useLocalVideoInteractions } from "@/hooks/use-local-video-interactions";
import { useVideosViewportTier } from "@/hooks/use-videos-viewport-tier";
import { ActiveReportVideoContext } from "@/lib/videos/active-report-video-context";
import { LocalVideoShareFeedbackProvider } from "@/lib/videos/local-video-share-feedback-context";
import { useLocalVideoPendingTracker } from "@/hooks/use-local-video-pending-tracker";
import { useLocalVideosFeed } from "@/hooks/use-local-videos-feed";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider } from "@/providers/geo-provider";
import {
  LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE,
  bumpLocalVideoCommentCount,
  isLocalVideoFeedItemPlayable,
  registerLocalVideoPending,
} from "@yunicity/utils";
import type { LocalVideoFeedItem } from "@yunicity/types";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  classifyDesktopOverlayDirectError,
  type DesktopOverlayDirectError,
} from "@/lib/videos/desktop-overlay-direct-error";

export function VideosScreen() {
  const { user } = useAuth();
  const defaultCity = user?.city?.trim() || "Reims";

  return (
    <GeoProvider defaultCity={defaultCity}>
      <LocalVideoShareFeedbackProvider>
        <VideosScreenInner />
      </LocalVideoShareFeedbackProvider>
    </GeoProvider>
  );
}

function VideosScreenInner() {
  const api = useYunicityApi();
  const searchParams = useSearchParams();
  const focusVideoId = searchParams.get("video")?.trim() || null;
  const viewportTier = useVideosViewportTier();
  // L8 : desktop → superposition sur grille ; mobile → page détail ; medium → fil L5.
  const isMobileDetail = Boolean(focusVideoId) && viewportTier === "mobile";
  const isDesktopOverlay = Boolean(focusVideoId) && viewportTier === "desktop";

  const feed = useLocalVideosFeed();
  const pending = useLocalVideoPendingTracker({
    onPublished: () => {
      // VID-27 — la vidéo épinglée (`?video=`) est rechargée par l'effet
      // `fetchPinnedVideo` ci-dessous, relancé à la fin de chaque `refresh()` :
      // erreurs classées (C4 / C7 / session), réponse obsolète ignorée.
      void feed.refresh();
    },
  });
  const interactions = useLocalVideoInteractions({ updateItem: feed.updateItem });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportVideoId, setReportVideoId] = useState<string | null>(null);
  const [pinnedVideo, setPinnedVideo] = useState<LocalVideoFeedItem | null>(null);
  // L'erreur garde l'id de la vidéo qui l'a produite : jamais affichée pour une autre.
  const [directError, setDirectError] = useState<{
    videoId: string;
    error: DesktopOverlayDirectError;
  } | null>(null);
  const [directRetryBusy, setDirectRetryBusy] = useState(false);
  // Numéro du dernier chargement de la vidéo épinglée (ouverture ou Réessayer) : lui seul
  // écrit l'état. L'effet l'incrémente à son nettoyage (changement de vidéo ou de fil,
  // démontage), ce qui invalide aussi une relance en vol.
  const pinnedLoadRef = useRef(0);
  // Évite une boucle d'effet si l'objet `pending` change d'identité à chaque rendu.
  const syncPendingFromStorageRef = useRef(pending.syncFromStorage);
  syncPendingFromStorageRef.current = pending.syncFromStorage;

  const fetchPinnedVideo = useCallback(
    async (videoId: string) => {
      pinnedLoadRef.current += 1;
      const loadId = pinnedLoadRef.current;
      const isCurrent = () => pinnedLoadRef.current === loadId;
      // VIDEO-MOBILE-DIRECT-ERROR-01 — remise à zéro au début de chaque chargement :
      // l'écran passe par le chargement, jamais par l'erreur d'une requête précédente.
      setDirectError(null);
      try {
        const video = await api.getLocalVideo(videoId);
        if (!isCurrent()) return;
        // Feed item : pas de processing_status — pending si non jouable.
        if (!isLocalVideoFeedItemPlayable(video)) {
          registerLocalVideoPending({
            videoId: video.id,
            title: video.title,
            registeredAt: video.created_at,
          });
          syncPendingFromStorageRef.current();
        }
        setPinnedVideo(video);
      } catch (error) {
        if (!isCurrent()) return;
        setPinnedVideo(null);
        setDirectError({ videoId, error: classifyDesktopOverlayDirectError(error) });
      } finally {
        if (isCurrent()) setDirectRetryBusy(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!focusVideoId || feed.isLoading) return;
    if (feed.items.some((item) => item.id === focusVideoId)) {
      setPinnedVideo(null);
      setDirectError(null);
      return;
    }

    void fetchPinnedVideo(focusVideoId);
    return () => {
      pinnedLoadRef.current += 1;
    };
  }, [feed.isLoading, feed.items, focusVideoId, fetchPinnedVideo]);

  const retryDirectVideo = useCallback(() => {
    if (!focusVideoId || directRetryBusy) return;
    setDirectRetryBusy(true);
    void fetchPinnedVideo(focusVideoId);
  }, [directRetryBusy, fetchPinnedVideo, focusVideoId]);

  const activeDirectError =
    directError && directError.videoId === focusVideoId ? directError.error : null;

  const displayItems = useMemo(() => {
    const byId = new Map<string, LocalVideoFeedItem>();

    for (const item of feed.items) {
      byId.set(item.id, item);
    }

    for (const processingItem of pending.processingFeedItems) {
      const existing = byId.get(processingItem.id);
      if (existing && isLocalVideoFeedItemPlayable(existing)) continue;
      byId.set(processingItem.id, processingItem);
    }

    if (pinnedVideo) {
      const existing = byId.get(pinnedVideo.id);
      if (!existing || !isLocalVideoFeedItemPlayable(existing)) {
        byId.set(pinnedVideo.id, pinnedVideo);
      }
    }

    return Array.from(byId.values());
  }, [feed.items, pending.processingFeedItems, pinnedVideo]);

  const processingErrors = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const track of pending.tracks) {
      if (track.error) map[track.record.videoId] = track.error;
    }
    return map;
  }, [pending.tracks]);

  const detailProcessingError = focusVideoId ? processingErrors[focusVideoId] : null;
  const focusInDisplay = Boolean(focusVideoId) && displayItems.some((item) => item.id === focusVideoId);
  // Ouverture directe : vidéo ni dans le fil ni chargée, sans erreur → requête en cours.
  const awaitingPinnedVideo = Boolean(focusVideoId) && !focusInDisplay && !activeDirectError;

  return (
    <VideosAppShell detailMode={isMobileDetail} immersiveMode={isMobileDetail}>
      {/* CLOSE-24 : retour immersif mobile (composant hors lot B — cible via aria-label). */}
      <style>{`
        [data-videos-immersive-mobile] a[aria-label="Retour aux vidéos"] {
          display: inline-flex;
          min-height: 44px;
          min-width: 44px;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <ActiveReportVideoContext.Provider value={reportOpen ? reportVideoId : null}>
        <div className="relative">
          {isMobileDetail && focusVideoId ? (
            feed.sessionExpired || activeDirectError?.kind === "auth" ? (
              <SessionExpiredPanel
                message={LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE}
                returnPath={`/videos?video=${encodeURIComponent(focusVideoId)}`}
              />
            ) : feed.isLoading && pending.processingFeedItems.length === 0 ? (
              <VideosFeedSkeleton />
            ) : feed.error && !focusInDisplay ? (
              <VideosFeedError onRetry={() => void feed.refresh()} />
            ) : (
              <VideoDetailScreen
                videoId={focusVideoId}
                items={displayItems}
                isLoading={feed.isLoading || awaitingPinnedVideo}
                directLoadError={
                  activeDirectError?.kind === "load_error"
                    ? { onRetry: retryDirectVideo, busy: directRetryBusy }
                    : null
                }
                processingError={detailProcessingError}
                onDismissProcessing={() => pending.dismissTrack(focusVideoId)}
                onToggleLike={(item) => void interactions.toggleLike(item)}
                onShare={(item) => void interactions.shareVideo(item)}
                onOpenReport={(videoId) => {
                  setReportVideoId(videoId);
                  setReportOpen(true);
                }}
                onCommentCountDelta={(videoId, delta) => {
                  feed.updateItem(videoId, (item) => bumpLocalVideoCommentCount(item, delta));
                }}
                onLoadMore={() => {
                  if (!feed.isLoadingMore && feed.nextCursor) {
                    void feed.loadMore();
                  }
                }}
              />
            )
          ) : feed.sessionExpired ||
            (isDesktopOverlay && activeDirectError?.kind === "auth") ? (
            <SessionExpiredPanel
              message={LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE}
              returnPath={
                focusVideoId
                  ? `/videos?video=${encodeURIComponent(focusVideoId)}`
                  : "/videos"
              }
            />
          ) : (
            <>
              <VideosDiscoveryScreen
                city={feed.city}
                items={displayItems}
                isLoading={feed.isLoading && pending.processingFeedItems.length === 0}
                error={feed.error}
                hasMoreFeed={Boolean(feed.nextCursor)}
                isLoadingMore={feed.isLoadingMore}
                loadMoreError={feed.loadMoreError}
                onRetry={() => void feed.refresh()}
                onLoadMoreFeed={() => {
                  if (!feed.isLoadingMore && feed.nextCursor) feed.loadMore();
                }}
                onRetryLoadMore={() => {
                  if (!feed.isLoadingMore && feed.nextCursor) feed.loadMore();
                }}
                onLoadMorePages={() => feed.loadMorePages()}
                processingErrors={processingErrors}
                onDismissProcessing={(videoId) => pending.dismissTrack(videoId)}
                onToggleLike={(item) => void interactions.toggleLike(item)}
                onShare={(item) => void interactions.shareVideo(item)}
                onOpenReport={(videoId) => {
                  setReportVideoId(videoId);
                  setReportOpen(true);
                }}
                onCommentCountDelta={(videoId, delta) => {
                  feed.updateItem(videoId, (item) => bumpLocalVideoCommentCount(item, delta));
                }}
                deepLinkVideoId={viewportTier === "medium" ? focusVideoId : null}
              />

              {isDesktopOverlay && focusVideoId ? (
                <VideosDesktopOverlayPlayer
                  videoId={focusVideoId}
                  items={displayItems}
                  isFeedLoading={feed.isLoading}
                  hasMore={Boolean(feed.nextCursor)}
                  isLoadingMore={feed.isLoadingMore}
                  directError={
                    activeDirectError?.kind === "unavailable" ||
                    activeDirectError?.kind === "load_error"
                      ? activeDirectError
                      : null
                  }
                  directRetryBusy={directRetryBusy}
                  onRetryDirect={retryDirectVideo}
                  onLoadPages={async (maxPages) => {
                    const result = await feed.loadMorePages(maxPages);
                    return {
                      pageIds: result.newIds ?? [],
                      hasMore: result.hasMore,
                      error: result.error,
                    };
                  }}
                  onToggleLike={(item) => void interactions.toggleLike(item)}
                  onShare={(item) => void interactions.shareVideo(item)}
                  onOpenReport={(videoId) => {
                    setReportVideoId(videoId);
                    setReportOpen(true);
                  }}
                  onCommentCountDelta={(videoId, delta) => {
                    feed.updateItem(videoId, (item) => bumpLocalVideoCommentCount(item, delta));
                  }}
                />
              ) : null}
            </>
          )}

          <LocalVideoShareFeedback
            onCopyFromFailed={() => void interactions.copyShareLinkFromFailed()}
          />

          <LocalVideoReportSheet
            open={reportOpen}
            onClose={() => {
              setReportOpen(false);
              setReportVideoId(null);
            }}
            alreadyReported={reportVideoId ? interactions.hasReported(reportVideoId) : false}
            errorMessage={interactions.reportError}
            onReport={async (reason) => {
              if (!reportVideoId) return;
              await interactions.reportVideo(reportVideoId, reason);
            }}
          />
        </div>
      </ActiveReportVideoContext.Provider>
    </VideosAppShell>
  );
}
