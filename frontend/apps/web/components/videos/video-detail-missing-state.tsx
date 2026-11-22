"use client";

import { VIDEO_DETAIL_BACK, VIDEO_DETAIL_NOT_FOUND } from "@yunicity/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { yunicityBtnPrimary } from "@/lib/brand-classes";
import { DESKTOP_OVERLAY_DIRECT_LABELS } from "@/lib/videos/desktop-overlay-direct-error";
import { VIDEO_CANVAS_FOCUS, VIDEO_TOUCH_TARGET } from "@/lib/videos/video-playback-a11y";

/** Échec réseau / 5xx de l'ouverture directe `?video=` (équivalent C7). */
export type VideoDetailDirectLoadError = {
  onRetry: () => void;
  /** Relance en cours : bouton désactivé, aucun appel répété. */
  busy: boolean;
};

type VideoDetailMissingStateProps = {
  tone: "dark" | "light";
  directLoadError: VideoDetailDirectLoadError | null;
};

/**
 * Vidéo demandée absente : « introuvable » (404 ou aucune correspondance), ou
 * VIDEO-MOBILE-DIRECT-ERROR-01 — message C7 + Réessayer quand le chargement a échoué.
 */
export function VideoDetailMissingState({ tone, directLoadError }: VideoDetailMissingStateProps) {
  const mutedText = tone === "dark" ? "text-white/80" : "text-neutral-600";

  return (
    <>
      {directLoadError ? (
        <div role="alert" className="flex flex-col items-center">
          <p className={`text-sm font-semibold ${tone === "dark" ? "text-white" : "text-neutral-900"}`}>
            {DESKTOP_OVERLAY_DIRECT_LABELS.loadErrorTitle}
          </p>
          <p className={`mt-1 text-sm ${mutedText}`}>{DESKTOP_OVERLAY_DIRECT_LABELS.loadErrorBody}</p>
          <button
            type="button"
            onClick={directLoadError.onRetry}
            disabled={directLoadError.busy}
            aria-busy={directLoadError.busy}
            className={`mt-4 ${VIDEO_TOUCH_TARGET} ${yunicityBtnPrimary} ${VIDEO_CANVAS_FOCUS}`}
          >
            {DESKTOP_OVERLAY_DIRECT_LABELS.retry}
          </button>
        </div>
      ) : (
        <p className={`text-sm ${mutedText}`}>{VIDEO_DETAIL_NOT_FOUND}</p>
      )}
      <Link
        href="/videos"
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {VIDEO_DETAIL_BACK}
      </Link>
    </>
  );
}
