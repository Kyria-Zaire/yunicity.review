"use client";

import { VIDEOS_MOBILE_FULLSCREEN } from "@yunicity/utils";
import { Maximize } from "lucide-react";
import type { FocusEvent, ReactNode, RefObject } from "react";

import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

/** Éléments d'une diapositive, assemblés par `LocalVideoSlide` et disposés ici. */
export type LocalVideoSlideParts = {
  video: ReactNode;
  overlays: ReactNode;
  meta: ReactNode;
  /** Barre de lecture (écran B) ; `null` quand elle est repliée. */
  bar: ReactNode;
  /** Fil de progression de 2 px (écran A) ; `null` quand la barre est affichée. */
  thread: ReactNode;
  actions: ReactNode;
  bandRef: RefObject<HTMLDivElement>;
  actionsRef: RefObject<HTMLDivElement>;
  onChromeFocus: (event: FocusEvent<HTMLElement>) => void;
  onChromeBlur: (event: FocusEvent<HTMLElement>) => void;
};

/**
 * Portrait (écrans A, B, C) : vidéo plein cadre ; bande de voile 60 % en bas (compte,
 * légende, quartier, puis barre de lecture quand elle est affichée) ; colonne d'actions
 * juste au-dessus de la bande ; fil de 2 px au bas de la bande quand la barre est repliée.
 */
export function LocalVideoPortraitFrame(parts: LocalVideoSlideParts) {
  return (
    <>
      {parts.video}
      {parts.overlays}
      <div
        ref={parts.bandRef}
        onFocus={parts.onChromeFocus}
        onBlur={parts.onChromeBlur}
        className="videos-slide-bottom-chrome pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-[rgba(17,24,39,0.6)] px-4 pb-2 pt-1.5"
      >
        <div
          ref={parts.actionsRef}
          onFocus={parts.onChromeFocus}
          onBlur={parts.onChromeBlur}
          className="videos-slide-action-rail absolute bottom-[calc(100%+12px)] right-2"
        >
          {parts.actions}
        </div>
        {parts.meta}
        {parts.bar}
        {parts.thread ? <div className="absolute inset-x-0 bottom-0">{parts.thread}</div> : null}
      </div>
    </>
  );
}

type LocalVideoLandscapeStageProps = LocalVideoSlideParts & {
  aspectRatio: string;
  onFullscreen: () => void;
};

/**
 * Paysage (écran D) : vidéo droite et entière (`contain`, aucune rotation), groupe image +
 * légende + actions centré verticalement ; légende sur fond neutre, sans voile, juste sous
 * l'image ; actions à droite dès le bas de l'image ; « Plein écran » conservé.
 */
export function LocalVideoLandscapeStage({ aspectRatio, onFullscreen, ...parts }: LocalVideoLandscapeStageProps) {
  return (
    <div className="flex h-full flex-col justify-center pt-14">
      <div className="relative max-h-[60%] w-full bg-black" style={{ aspectRatio }}>
        {parts.video}
        {parts.overlays}
        <button
          type="button"
          onClick={onFullscreen}
          aria-label={VIDEOS_MOBILE_FULLSCREEN}
          className={`absolute bottom-1 right-1 z-20 flex h-11 w-11 items-center justify-center text-white ${VIDEO_IMMERSIVE_FOCUS}`}
        >
          <Maximize className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      </div>
      {parts.thread}
      <div className="flex items-start gap-2 pl-4 pr-2 pt-2">
        <div
          ref={parts.bandRef}
          onFocus={parts.onChromeFocus}
          onBlur={parts.onChromeBlur}
          className="videos-slide-bottom-chrome min-w-0 flex-1 pt-1"
        >
          {parts.meta}
          {parts.bar}
        </div>
        <div
          ref={parts.actionsRef}
          onFocus={parts.onChromeFocus}
          onBlur={parts.onChromeBlur}
          className="videos-slide-action-rail z-20 shrink-0"
        >
          {parts.actions}
        </div>
      </div>
    </div>
  );
}
