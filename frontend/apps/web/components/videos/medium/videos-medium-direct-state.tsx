"use client";

import { VIDEO_DETAIL_LOADING } from "@yunicity/utils";
import { Loader2, VideoOff } from "lucide-react";

import { yunicityBtnPrimary } from "@/lib/brand-classes";
import { DESKTOP_OVERLAY_DIRECT_LABELS } from "@/lib/videos/desktop-overlay-direct-error";
import { VIDEO_CANVAS_FOCUS, VIDEO_TOUCH_TARGET } from "@/lib/videos/video-playback-a11y";

/**
 * VIDEO-MEDIUM-DIRECT-STATES-01 — état bloquant de l'ouverture directe `?video=` au palier
 * medium : le fil vertical (et sa lecture automatique) n'est pas monté.
 */
export type VideosMediumDirectState =
  | { kind: "loading" }
  | { kind: "unavailable"; onSeeOtherVideos: () => void }
  | {
      kind: "load_error";
      onRetry: () => void;
      /** Relance en cours : bouton désactivé, aucun appel répété. */
      retryBusy: boolean;
      onSeeOtherVideos: () => void;
    };

const SECONDARY_BUTTON =
  "rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50";

/**
 * Zone neutre à la place du lecteur (même cadre que le fil) — rail et hero-header restent
 * dans le shell. Chargement, F4 (404) ou équivalent C7 (réseau / 5xx).
 */
export function VideosMediumDirectStatePanel({ state }: { state: VideosMediumDirectState }) {
  return (
    <div className="videos-medium-vertical-feed" data-videos-medium-direct-state={state.kind}>
      <div className="videos-medium-vertical-stage flex flex-col items-center justify-center gap-3 border border-neutral-200 px-6 text-center">
        {state.kind === "loading" ? (
          <p role="status" className="inline-flex items-center gap-2 text-sm text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
            {VIDEO_DETAIL_LOADING}
          </p>
        ) : null}

        {state.kind === "unavailable" ? (
          <>
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full bg-yunicity-primary-soft text-yunicity-primary"
              aria-hidden
            >
              <VideoOff className="h-7 w-7" strokeWidth={2} />
            </span>
            <h2 className="text-lg font-bold text-neutral-900">
              {DESKTOP_OVERLAY_DIRECT_LABELS.unavailableTitle}
            </h2>
            <p className="max-w-sm text-sm text-neutral-600">
              {DESKTOP_OVERLAY_DIRECT_LABELS.unavailableBody}
            </p>
            <button
              type="button"
              onClick={state.onSeeOtherVideos}
              className={`mt-2 ${VIDEO_TOUCH_TARGET} ${yunicityBtnPrimary} ${VIDEO_CANVAS_FOCUS}`}
            >
              {DESKTOP_OVERLAY_DIRECT_LABELS.seeOtherVideos}
            </button>
          </>
        ) : null}

        {state.kind === "load_error" ? (
          <>
            <div role="alert" className="flex flex-col items-center gap-1">
              <h2 className="text-lg font-bold text-neutral-900">
                {DESKTOP_OVERLAY_DIRECT_LABELS.loadErrorTitle}
              </h2>
              <p className="max-w-sm text-sm text-neutral-600">
                {DESKTOP_OVERLAY_DIRECT_LABELS.loadErrorBody}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={state.onRetry}
                disabled={state.retryBusy}
                aria-busy={state.retryBusy}
                className={`${VIDEO_TOUCH_TARGET} ${yunicityBtnPrimary} ${VIDEO_CANVAS_FOCUS}`}
              >
                {DESKTOP_OVERLAY_DIRECT_LABELS.retry}
              </button>
              <button
                type="button"
                onClick={state.onSeeOtherVideos}
                className={`${VIDEO_TOUCH_TARGET} ${SECONDARY_BUTTON} ${VIDEO_CANVAS_FOCUS}`}
              >
                {DESKTOP_OVERLAY_DIRECT_LABELS.seeOtherVideos}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
