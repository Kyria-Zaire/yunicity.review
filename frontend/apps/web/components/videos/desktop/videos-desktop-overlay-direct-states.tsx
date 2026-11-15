"use client";

import { ArrowRight, Loader2, VideoOff } from "lucide-react";

import {
  DESKTOP_OVERLAY_DIRECT_LABELS,
  type DesktopOverlayDirectErrorKind,
} from "@/lib/videos/desktop-overlay-direct-error";
import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

type DirectStateProps = {
  kind: Exclude<DesktopOverlayDirectErrorKind, "auth">;
  onSeeFeed: () => void;
  onRetry?: () => void;
  retryBusy?: boolean;
};

/**
 * Cartouches C4 (indisponible) et C7 (erreur chargement) — maquettes
 * `C4-Indisponible.dc.html` / `C7-Erreur-reseau.dc.html`.
 */
export function VideosDesktopOverlayDirectState({
  kind,
  onSeeFeed,
  onRetry,
  retryBusy = false,
}: DirectStateProps) {
  const unavailable = kind === "unavailable";

  return (
    <section
      role={unavailable ? "dialog" : "alertdialog"}
      aria-modal="true"
      aria-labelledby="desktop-overlay-direct-title"
      aria-describedby="desktop-overlay-direct-desc"
      data-videos-desktop-overlay-direct={kind}
      className="flex w-[min(520px,92vw)] flex-col items-center gap-3 rounded-[20px] bg-white px-12 py-10 text-center"
    >
      <span
        className={`flex h-[72px] w-[72px] items-center justify-center rounded-full ${
          unavailable ? "bg-[#EEF0FF] text-[#2A2FFF]" : "bg-[#FEF2F2] text-[#B91C1C]"
        }`}
        aria-hidden
      >
        {unavailable ? (
          <VideoOff className="h-8 w-8" strokeWidth={2} />
        ) : (
          <span className="text-2xl font-bold leading-none">!</span>
        )}
      </span>
      <h2
        id="desktop-overlay-direct-title"
        className={`m-0 font-bold text-neutral-900 ${unavailable ? "text-[22px] leading-7" : "text-xl leading-7"}`}
      >
        {unavailable
          ? DESKTOP_OVERLAY_DIRECT_LABELS.unavailableTitle
          : DESKTOP_OVERLAY_DIRECT_LABELS.loadErrorTitle}
      </h2>
      <p id="desktop-overlay-direct-desc" className="m-0 text-[15px] leading-[22px] text-neutral-700">
        {unavailable
          ? DESKTOP_OVERLAY_DIRECT_LABELS.unavailableBody
          : DESKTOP_OVERLAY_DIRECT_LABELS.loadErrorBody}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2.5">
        {!unavailable && onRetry ? (
          <button
            type="button"
            className={`inline-flex min-h-12 items-center rounded-full bg-[#2A2FFF] px-[22px] text-base font-semibold text-white disabled:opacity-60 ${VIDEO_IMMERSIVE_FOCUS}`}
            onClick={onRetry}
            disabled={retryBusy}
            aria-busy={retryBusy || undefined}
          >
            {retryBusy ? (
              <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              DESKTOP_OVERLAY_DIRECT_LABELS.retry
            )}
          </button>
        ) : null}
        <button
          type="button"
          className={`inline-flex min-h-12 items-center gap-2 rounded-full px-[22px] text-base font-semibold ${
            unavailable
              ? `bg-[#2A2FFF] text-white ${VIDEO_IMMERSIVE_FOCUS}`
              : `border border-neutral-200 bg-white text-neutral-900 ${VIDEO_IMMERSIVE_FOCUS}`
          }`}
          onClick={onSeeFeed}
        >
          {DESKTOP_OVERLAY_DIRECT_LABELS.seeOtherVideos}
          {unavailable ? <ArrowRight className="h-[18px] w-[18px]" aria-hidden /> : null}
        </button>
      </div>
    </section>
  );
}
