"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_DEFAULT_MUTED,
  LOCAL_VIDEO_PLAYBACK_FALLBACK,
  formatLocalVideoDuration,
  resolveLocalVideoLayout,
} from "@yunicity/utils";
import { ChevronDown, ChevronUp, Loader2, Maximize2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoDescriptionSheet } from "@/components/videos/local-video-description-sheet";
import { LocalVideoMobileMetaOverlay } from "@/components/videos/local-video-mobile-meta-overlay";
import { LocalVideoMoreMenu } from "@/components/videos/local-video-more-menu";
import { VideosDesktopOverlayDirectState } from "@/components/videos/desktop/videos-desktop-overlay-direct-states";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import { useGridRestore } from "@/hooks/use-grid-restore";
import { useOrderedVideoNavigation } from "@/hooks/use-ordered-video-navigation";
import { usePauseWhileOpen } from "@/hooks/use-pause-while-open";
import { useVideoOverlayHistory } from "@/hooks/use-video-overlay-history";
import { useActiveReportVideoId } from "@/lib/videos/active-report-video-context";
import type { DesktopOverlayDirectError } from "@/lib/videos/desktop-overlay-direct-error";
import {
  DESKTOP_OVERLAY_LABELS,
  consumeOverlayOpenOrigin,
  shouldIgnoreOverlayArrowKeys,
} from "@/lib/videos/desktop-overlay-navigation";
import { Z_INDEX } from "@/lib/layout/z-index";
import {
  VIDEO_IMMERSIVE_FOCUS,
  formatVideoClock,
  formatVideoProgressValueText,
  handleVideoProgressKeyDown,
} from "@/lib/videos/video-playback-a11y";

/** Géométrie mesurée sur C2 / C3 (canvas 1440×900). */
const C2_VIDEO_MAX_HEIGHT_RATIO = 836 / 900;
const C3_FRAME_W = 800;
const C3_FRAME_H = 600;
const VEIL_BG = "rgba(17, 24, 39, 0.85)";

export type VideosDesktopOverlayPlayerProps = {
  videoId: string;
  items: readonly LocalVideoFeedItem[];
  isFeedLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  /** C4 / C7 — ouverture directe hors grille en échec (Lot 9). */
  directError?: DesktopOverlayDirectError | null;
  directRetryBusy?: boolean;
  onRetryDirect?: () => void;
  onLoadPages: (maxPages: number) => Promise<{
    pageIds: readonly string[];
    hasMore: boolean;
    error: boolean;
  }>;
  onToggleLike: (item: LocalVideoFeedItem) => void;
  onShare: (item: LocalVideoFeedItem) => void;
  onOpenReport: (videoId: string) => void;
  onCommentCountDelta: (videoId: string, delta: number) => void;
};

type OverlayPlayerSurfaceProps = {
  item: LocalVideoFeedItem;
  isMuted: boolean;
  onToggleMute: () => void;
  suspended: boolean;
  onOpenComments: (trigger: HTMLElement) => void;
  onOpenDescription: (trigger: HTMLElement) => void;
  onOpenMore: (trigger: HTMLElement) => void;
  onToggleLike: () => void;
  onShare: () => void;
  nav: {
    canPrevious: boolean;
    canNext: boolean;
    nextBusy: boolean;
    showSeeFeedHint: boolean;
    onPrevious: () => void;
    onNext: () => void;
  };
  rVideMessage: ReactNode;
};

function DesktopOverlayVideo({
  item,
  isMuted,
  onToggleMute,
  suspended,
  landscape,
  caption = null,
}: {
  item: LocalVideoFeedItem;
  isMuted: boolean;
  onToggleMute: () => void;
  suspended: boolean;
  landscape: boolean;
  /** C2 : méta auteur/titre/quartier sur le stage (pas sous le média). */
  caption?: ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const duration = item.duration_seconds ?? 0;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, []);

  usePauseWhileOpen(suspended, isPlaying, (paused) => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
      setIsPlaying(false);
    } else {
      void tryPlay();
    }
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setMediaError(false);
    setCurrentTime(0);
    video.muted = isMuted;
    void tryPlay();
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    // reset lecteur à chaque média (une seule <video> active — §8 perf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.media_url, tryPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || mediaError) return;
    if (video.paused) {
      await tryPlay();
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [mediaError, tryPlay]);

  const seekToRatio = useCallback(
    (ratio: number) => {
      const video = videoRef.current;
      if (!video || duration <= 0) return;
      video.currentTime = ratio * duration;
      setCurrentTime(video.currentTime);
    },
    [duration],
  );

  const handleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (video.requestFullscreen) await video.requestFullscreen();
    } catch {
      /* indisponible */
    }
  }, []);

  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl bg-black"
      data-videos-desktop-overlay-stage={landscape ? "landscape" : "portrait"}
      style={
        landscape
          ? {
              /* C3 : cadre 800×600 borné à l’espace restant (méta + chrome hors stage). */
              width: "min(800px, calc(100vw - 8rem))",
              maxHeight: "min(600px, calc(100dvh - 14rem))",
              aspectRatio: `${C3_FRAME_W} / ${C3_FRAME_H}`,
            }
          : {
              height: `min(${C2_VIDEO_MAX_HEIGHT_RATIO * 100}dvh, 836px)`,
              aspectRatio: "9 / 16",
              maxWidth: "min(470px, 42vw)",
            }
      }
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        key={item.id}
        src={item.media_url || undefined}
        poster={item.thumbnail_url || undefined}
        playsInline
        muted={isMuted}
        /* Bandes = ratio média (object-contain) — pas de letterbox artificiel lecteur. */
        className="absolute inset-0 h-full w-full object-contain"
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          // D5 : aucun basculement automatique (relatedVideos interdit).
          setIsPlaying(false);
        }}
        onError={() => {
          setMediaError(true);
          setIsPlaying(false);
        }}
      />

      {mediaError ? (
        <p className="absolute inset-0 z-30 flex items-center justify-center bg-neutral-950/80 px-4 text-center text-sm text-white">
          {LOCAL_VIDEO_PLAYBACK_FALLBACK}
        </p>
      ) : null}

      <button
        type="button"
        className={`absolute inset-0 z-20 flex items-center justify-center ${VIDEO_IMMERSIVE_FOCUS}`}
        aria-label={isPlaying ? "Mettre en pause" : "Lire la vidéo"}
        onClick={() => void togglePlay()}
      >
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white transition ${
            isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
          }`}
        >
          {isPlaying ? <Pause className="h-7 w-7" aria-hidden /> : <Play className="h-7 w-7" aria-hidden />}
        </span>
      </button>

      {(() => {
        const transport = (
          <>
            <button
              type="button"
              className={`pointer-events-auto h-11 w-11 text-white ${VIDEO_IMMERSIVE_FOCUS}`}
              aria-label={isPlaying ? "Mettre en pause" : "Lire la vidéo"}
              onClick={(e) => {
                e.stopPropagation();
                void togglePlay();
              }}
            >
              {isPlaying ? <Pause className="mx-auto h-5 w-5" /> : <Play className="mx-auto h-5 w-5" />}
            </button>
            <div
              role="slider"
              tabIndex={0}
              aria-label="Progression de la lecture"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(currentTime)}
              aria-valuetext={formatVideoProgressValueText(currentTime, duration)}
              className={`pointer-events-auto relative h-11 flex-1 cursor-pointer ${VIDEO_IMMERSIVE_FOCUS}`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seekToRatio(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
              }}
              onKeyDown={(e) => handleVideoProgressKeyDown(e, currentTime, duration, seekToRatio)}
            >
              <span className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/35">
                <span
                  className="absolute left-0 top-0 h-1 rounded-full bg-white"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </div>
            <span className="pointer-events-none px-1 text-xs tabular-nums text-white">
              {formatVideoClock(currentTime)} / {formatLocalVideoDuration(duration)}
            </span>
            <button
              type="button"
              className={`pointer-events-auto h-11 w-11 text-white ${VIDEO_IMMERSIVE_FOCUS}`}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
            >
              {isMuted ? <VolumeX className="mx-auto h-4 w-4" /> : <Volume2 className="mx-auto h-4 w-4" />}
            </button>
            <button
              type="button"
              className={`pointer-events-auto h-11 w-11 text-white ${VIDEO_IMMERSIVE_FOCUS}`}
              aria-label="Plein écran"
              onClick={(e) => {
                e.stopPropagation();
                void handleFullscreen();
              }}
            >
              <Maximize2 className="mx-auto h-4 w-4" />
            </button>
          </>
        );

        /* C2 : méta + barre dans le voile bas (réf. Lecteur-desktop). C3 : barre seule. */
        if (!landscape && caption) {
          return (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col gap-1 bg-[rgba(17,24,39,0.6)] px-3.5 pb-3 pt-1.5"
              data-videos-desktop-overlay-meta-band=""
            >
              {caption}
              <div className="flex items-center gap-1" data-videos-desktop-overlay-bar="">
                {transport}
              </div>
            </div>
          );
        }

        return (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center gap-1 bg-[rgba(17,24,39,0.6)] px-1"
            data-videos-desktop-overlay-bar=""
          >
            {transport}
          </div>
        );
      })()}
    </div>
  );
}

function NavColumn({
  nav,
  actions,
}: {
  nav: OverlayPlayerSurfaceProps["nav"];
  actions: React.ReactNode;
}) {
  return (
    <div className="flex w-14 flex-col items-center self-stretch py-1" data-videos-desktop-overlay-nav="">
      <button
        type="button"
        aria-label={DESKTOP_OVERLAY_LABELS.previous}
        disabled={!nav.canPrevious}
        onClick={nav.onPrevious}
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/40 text-white disabled:cursor-not-allowed disabled:opacity-35 ${VIDEO_IMMERSIVE_FOCUS}`}
      >
        <ChevronUp className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label={DESKTOP_OVERLAY_LABELS.next}
        disabled={!nav.canNext && !nav.nextBusy}
        aria-busy={nav.nextBusy || undefined}
        onClick={nav.onNext}
        className={`mt-2 flex h-12 w-12 items-center justify-center rounded-full border border-white/40 text-white disabled:cursor-not-allowed disabled:opacity-35 ${VIDEO_IMMERSIVE_FOCUS}`}
      >
        {nav.nextBusy ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5" aria-hidden />
        )}
      </button>
      {nav.showSeeFeedHint ? (
        <p className="mt-2 max-w-[4.5rem] text-center text-[11px] font-semibold leading-tight text-white/90">
          {DESKTOP_OVERLAY_LABELS.seeFeedVideos}
        </p>
      ) : null}
      <div className="mt-auto flex flex-col items-center gap-3 pb-2">{actions}</div>
    </div>
  );
}

/**
 * Lecteur desktop superposé (Lot 8) — C2/C3/C5/C6, D1/D3/D4/D5, R-ORD/R-VIDE/R-FOCUS.
 * Ne remplace pas la grille : superposition + voile.
 */
export function VideosDesktopOverlayPlayer({
  videoId,
  items,
  isFeedLoading,
  hasMore,
  directError = null,
  directRetryBusy = false,
  onRetryDirect,
  onLoadPages,
  onToggleLike,
  onShare,
  onOpenReport,
  onCommentCountDelta,
}: VideosDesktopOverlayPlayerProps) {
  const gridIds = useMemo(() => items.map((item) => item.id), [items]);
  const originBoot = useRef(consumeOverlayOpenOrigin(videoId));

  const history = useVideoOverlayHistory();
  const restore = useGridRestore();
  const openedRef = useRef(false);
  const gridIdsRef = useRef(gridIds);
  gridIdsRef.current = gridIds;

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    // Remount Avance : sticky origin/scroll (mark/consume) — pas un nouvel open grille.
    history.setOrigin(originBoot.current);
    restore.captureOpen(videoId, originBoot.current);
  }, [history, restore, videoId]);

  // Retour navigateur / ✕ : restaurer APRÈS démontage (overflow body rétabli), R-FOCUS.
  // Ignore le faux démontage React Strict Mode tant que `?video=` est encore là.
  useEffect(() => {
    return () => {
      const stillOpen = new URLSearchParams(window.location.search).get("video");
      if (stillOpen) return;
      const ids = gridIdsRef.current;
      requestAnimationFrame(() => {
        restore.restore(ids);
      });
    };
  }, [restore]);

  const loadPages = useCallback(
    async (maxPages: number) => onLoadPages(maxPages),
    [onLoadPages],
  );

  const navState = useOrderedVideoNavigation({
    focusVideoId: videoId,
    gridIds,
    directOutsideGrid: originBoot.current === "direct" && !items.some((i) => i.id === videoId),
    loadPages,
  });

  useEffect(() => {
    restore.noteViewed(navState.currentId);
  }, [navState.currentId, restore]);

  const currentItem = useMemo(
    () => items.find((item) => item.id === navState.currentId) ?? null,
    [items, navState.currentId],
  );

  const waitingDirect =
    !directError &&
    !currentItem &&
    (isFeedLoading || (originBoot.current === "direct" && !items.some((i) => i.id === videoId)));
  const showDirectError =
    Boolean(directError) &&
    (directError?.kind === "unavailable" || directError?.kind === "load_error") &&
    !currentItem;

  const [isMuted, setIsMuted] = useState(LOCAL_VIDEO_DEFAULT_MUTED);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const panelTriggerRef = useRef<HTMLElement | null>(null);
  const activeReportVideoId = useActiveReportVideoId();
  const veilPointerRef = useRef<{ downOnVeil: boolean }>({ downOnVeil: false });

  const panelOpen = commentsOpen || descriptionOpen || moreOpen || activeReportVideoId === navState.currentId;

  const closeAndRestore = useCallback(() => {
    // D1 : back (grille) ou replace (direct). R-FOCUS via cleanup unmount.
    history.closeOverlay();
  }, [history]);

  const goPrev = useCallback(() => {
    const id = navState.goPrevious();
    if (id) history.replaceVideo(id);
  }, [history, navState]);

  const goNext = useCallback(() => {
    void navState.goNext().then((id) => {
      if (id) history.replaceVideo(id);
    });
  }, [history, navState]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (moreOpen) {
          setMoreOpen(false);
          return;
        }
        if (descriptionOpen) {
          setDescriptionOpen(false);
          return;
        }
        if (commentsOpen) {
          setCommentsOpen(false);
          return;
        }
        event.preventDefault();
        closeAndRestore();
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        if (shouldIgnoreOverlayArrowKeys(event.target)) return;
        if (panelOpen) return;
        event.preventDefault();
        if (event.key === "ArrowUp") goPrev();
        else goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAndRestore, commentsOpen, descriptionOpen, goNext, goPrev, moreOpen, panelOpen]);

  // Inerte : bloquer le scroll de fond + désactiver la restauration auto du navigateur
  // (CADRAGE Desktop C / PRD : aucun scroll automatique du routeur).
  // scrollbar-gutter stable pendant l'overlay. Au unlock : garder scrollRestoration=manual
  // un tick pour que R-FOCUS re-pin avant que le navigateur / Next ne réagissent.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevGutter = document.documentElement.style.scrollbarGutter;
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      /* ignore */
    }
    document.documentElement.style.scrollbarGutter = "stable";
    const lockedY = window.scrollY;
    document.body.style.overflow = "hidden";
    // Empêche le recentrage focus/overflow pendant l'overlay (même Δ~11).
    window.scrollTo({ top: lockedY, left: 0, behavior: "auto" });
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.scrollbarGutter = prevGutter;
      window.setTimeout(() => {
        try {
          // Remise différée : laisse les re-pins R-FOCUS gagner sur le scroll auto.
          if (!new URLSearchParams(window.location.search).get("video")) {
            window.history.scrollRestoration = "auto";
          }
        } catch {
          /* ignore */
        }
      }, 60);
    };
  }, []);

  const handleVeilMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    veilPointerRef.current.downOnVeil = event.target === event.currentTarget;
  };
  const handleVeilClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    // D4 : fermeture seulement si down + up sur le voile.
    if (event.target === event.currentTarget && veilPointerRef.current.downOnVeil) {
      closeAndRestore();
    }
    veilPointerRef.current.downOnVeil = false;
  };

  const landscape = currentItem ? resolveLocalVideoLayout(currentItem) === "landscape" : false;

  const rVideMessage = (() => {
    if (navState.rVide.kind === "loading") {
      return (
        <p className="mt-3 text-center text-sm text-white/80" role="status" aria-live="polite">
          {DESKTOP_OVERLAY_LABELS.loadingNext}
        </p>
      );
    }
    if (navState.rVide.kind === "error") {
      return (
        <div className="mt-3 text-center" role="alert">
          <p className="text-sm text-amber-100">{DESKTOP_OVERLAY_LABELS.loadMoreFailed}</p>
          <button
            type="button"
            className={`mt-1 text-sm font-semibold text-white underline ${VIDEO_IMMERSIVE_FOCUS}`}
            onClick={() => void navState.retryLoad().then((id) => id && history.replaceVideo(id))}
          >
            {DESKTOP_OVERLAY_LABELS.retry}
          </button>
        </div>
      );
    }
    if (navState.rVide.kind === "continue") {
      return (
        <div className="mt-3 text-center" role="status">
          <p className="text-sm text-white/90">{DESKTOP_OVERLAY_LABELS.noMoreForNow}</p>
          <button
            type="button"
            className={`mt-1 text-sm font-semibold text-white underline ${VIDEO_IMMERSIVE_FOCUS}`}
            onClick={() =>
              void navState.continueSearch().then((id) => id && history.replaceVideo(id))
            }
          >
            {DESKTOP_OVERLAY_LABELS.continueSearch}
          </button>
        </div>
      );
    }
    if (navState.rVide.kind === "exhausted") {
      return (
        <p className="mt-3 text-center text-sm text-white/80" role="status">
          {DESKTOP_OVERLAY_LABELS.endOfList}
        </p>
      );
    }
    return null;
  })();

  const canNext =
    !navState.atEndOfSequence ||
    hasMore ||
    navState.rVide.kind === "continue" ||
    navState.rVide.kind === "error";

  return (
    <div
      className="fixed inset-0 flex items-stretch justify-center"
      style={{ zIndex: Z_INDEX.VIDEO_HEADER + 5, background: VEIL_BG }}
      data-videos-desktop-overlay=""
      data-videos-desktop-overlay-origin={originBoot.current}
      onMouseDown={handleVeilMouseDown}
      onClick={handleVeilClick}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={DESKTOP_OVERLAY_LABELS.dialogLabel}
        aria-busy={waitingDirect || undefined}
        className="relative flex h-full w-full max-w-[1440px] items-start justify-center gap-4 px-6 pb-8 pt-8"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={DESKTOP_OVERLAY_LABELS.closePlayer}
          onClick={closeAndRestore}
          className={`absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-neutral-900 ${VIDEO_IMMERSIVE_FOCUS}`}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        {showDirectError &&
        directError &&
        (directError.kind === "unavailable" || directError.kind === "load_error") ? (
          <VideosDesktopOverlayDirectState
            kind={directError.kind}
            onSeeFeed={closeAndRestore}
            onRetry={directError.kind === "load_error" ? onRetryDirect : undefined}
            retryBusy={directRetryBusy}
          />
        ) : waitingDirect || (!currentItem && isFeedLoading) ? (
          <section
            className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-neutral-800 text-white"
            style={{
              width: "min(470px, 42vw)",
              height: `min(${C2_VIDEO_MAX_HEIGHT_RATIO * 100}dvh, 836px)`,
            }}
            aria-busy="true"
            data-videos-desktop-overlay-loading=""
          >
            <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
            <p role="status" className="text-sm font-semibold">
              {DESKTOP_OVERLAY_LABELS.loadingVideo}
            </p>
          </section>
        ) : currentItem ? (
          (() => {
            const navColumn = (
              <NavColumn
                nav={{
                  canPrevious: navState.canPrevious,
                  canNext: Boolean(canNext) && navState.rVide.kind !== "exhausted",
                  nextBusy: navState.rVide.kind === "loading",
                  showSeeFeedHint: navState.showSeeFeedHint,
                  onPrevious: goPrev,
                  onNext: goNext,
                }}
                actions={
                  <LocalVideoActionRail
                    likeCount={currentItem.like_count}
                    commentCount={currentItem.comment_count}
                    likedByMe={currentItem.liked_by_me}
                    commentsPressed={commentsOpen}
                    surface="overlay"
                    moreStyle="desktop-c2"
                    onLikeClick={() => onToggleLike(currentItem)}
                    onCommentsClick={() => {
                      panelTriggerRef.current = document.activeElement as HTMLElement;
                      setCommentsOpen(true);
                    }}
                    onShareClick={() => onShare(currentItem)}
                    onMoreClick={(trigger) => {
                      panelTriggerRef.current = trigger;
                      setMoreOpen(true);
                    }}
                  />
                }
              />
            );

            const videoStage = (
              <DesktopOverlayVideo
                item={currentItem}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted((v) => !v)}
                suspended={panelOpen}
                landscape={landscape}
                caption={
                  landscape ? null : (
                    <LocalVideoMobileMetaOverlay
                      item={currentItem}
                      surface="overlay"
                      onExpandDescription={(trigger) => {
                        panelTriggerRef.current = trigger;
                        setDescriptionOpen(true);
                      }}
                    />
                  )
                }
              />
            );

            if (landscape) {
              return (
                <div
                  className="flex max-h-full min-h-0 flex-col items-start"
                  data-videos-desktop-overlay-layout="landscape"
                >
                  {/* Rangée C3 : vidéo | actions (hauteur = cadre). Méta hors rangée. */}
                  <div className="flex min-h-0 items-stretch gap-3">
                    {videoStage}
                    {navColumn}
                  </div>
                  <div
                    className="mt-3 w-full max-w-[800px] shrink-0 text-white"
                    data-videos-desktop-overlay-caption=""
                  >
                    {/*
                      C3 : une seule ligne lieu — badge quartier + contexte via
                      LocalVideoMobileMetaOverlay (comme C2). Pas de second
                      paragraphe « quartier · À découvrir… » (doublon CTO).
                      « plus » conserve l’accès description complète.
                    */}
                    <LocalVideoMobileMetaOverlay
                      item={currentItem}
                      surface="overlay"
                      onExpandDescription={(trigger) => {
                        panelTriggerRef.current = trigger;
                        setDescriptionOpen(true);
                      }}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div
                className={`flex max-h-full min-h-0 flex-row gap-3 ${
                  commentsOpen ? "items-start" : "items-end"
                }`}
                data-videos-desktop-overlay-layout="portrait"
              >
                {videoStage}
                {navColumn}
                {commentsOpen ? (
                  <aside
                    className="flex h-[836px] max-h-[calc(100dvh-4rem)] w-[380px] max-w-[min(380px,28vw)] shrink-0 flex-col self-start overflow-hidden rounded-2xl bg-white"
                    aria-labelledby="desktop-overlay-comments-title"
                    data-videos-desktop-overlay-comments-panel=""
                    data-overlay-arrow-nav="ignore"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-200 py-2 pl-5 pr-2">
                      <h2
                        id="desktop-overlay-comments-title"
                        className="text-[17px] font-bold text-neutral-900"
                      >
                        Commentaires{" "}
                        <span className="font-semibold text-[#6B7280]">{currentItem.comment_count}</span>
                      </h2>
                      <button
                        type="button"
                        aria-label="Fermer les commentaires"
                        className={`flex h-11 w-11 items-center justify-center text-neutral-700 ${VIDEO_IMMERSIVE_FOCUS}`}
                        onClick={() => setCommentsOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <VideoCommentsSheet
                      open={commentsOpen}
                      video={currentItem}
                      onClose={() => setCommentsOpen(false)}
                      onCommentCountDelta={onCommentCountDelta}
                      returnFocusRef={panelTriggerRef as RefObject<HTMLElement | null>}
                      presentation="panel"
                    />
                  </aside>
                ) : null}
              </div>
            );
          })()
        ) : (
          <p className="text-sm text-white/80" role="status">
            {DESKTOP_OVERLAY_LABELS.loadingVideo}
          </p>
        )}

        <div className="absolute bottom-4 left-1/2 w-full max-w-md -translate-x-1/2 px-4">{rVideMessage}</div>
      </div>

      <LocalVideoDescriptionSheet
        video={descriptionOpen ? currentItem : null}
        returnFocusRef={panelTriggerRef as RefObject<HTMLElement | null>}
        onClose={() => setDescriptionOpen(false)}
      />

      <LocalVideoMoreMenu
        open={moreOpen}
        returnFocusRef={panelTriggerRef as RefObject<HTMLElement | null>}
        onClose={() => setMoreOpen(false)}
        onReport={() => {
          const id = navState.currentId;
          setMoreOpen(false);
          if (id) onOpenReport(id);
        }}
      />

      {/* Paysage C3 : feuille Lot 4 (pas de panneau latéral dans la maquette C3). */}
      {landscape ? (
        <VideoCommentsSheet
          open={commentsOpen}
          video={commentsOpen ? currentItem : null}
          onClose={() => setCommentsOpen(false)}
          onCommentCountDelta={onCommentCountDelta}
          returnFocusRef={panelTriggerRef as RefObject<HTMLElement | null>}
        />
      ) : null}
    </div>
  );
}
