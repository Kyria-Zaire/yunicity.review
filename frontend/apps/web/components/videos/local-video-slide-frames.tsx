"use client";

import {
  LOCAL_VIDEO_FALLBACK_LANDSCAPE,
  LOCAL_VIDEO_FALLBACK_PORTRAIT,
  MEDIUM_SIDE_COLUMN_GAP_PX,
  MEDIUM_SIDE_COLUMN_WIDTH_PX,
  VIDEOS_MOBILE_FULLSCREEN,
  fitMediaFrameInBox,
} from "@yunicity/utils";
import { ChevronDown, ChevronUp, Maximize } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
  type RefObject,
} from "react";

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
  /** Medium v1.2 : son dans le cadre vidéo (coin haut droit), pas dans une toolbar isolée. */
  muteControl?: ReactNode;
  bandRef: RefObject<HTMLDivElement>;
  actionsRef: RefObject<HTMLDivElement>;
  onChromeFocus: (event: FocusEvent<HTMLElement>) => void;
  onChromeBlur: (event: FocusEvent<HTMLElement>) => void;
};

/**
 * Empreinte verticale de `LocalVideoPlaybackBar` (`mt-1.5` + `h-12`) — réservée
 * uniquement pour l'ancrage de la colonne, pas peinte dans la bande.
 */
export const LOCAL_VIDEO_PLAYBACK_BAR_SLOT_PX = 54;

/**
 * Portrait (écrans A, B, C) : vidéo plein cadre ; bande de voile 60 % en bas (compte,
 * légende, quartier, puis barre de lecture quand elle est affichée) ; colonne d'actions
 * ancrée au cadre de la diapositive (pas à la hauteur variable de la bande) ; fil de 2 px
 * au bas de la bande quand la barre est repliée.
 *
 * Objectifs conjoints : bande compacte au repli (plus de spacer sombre) ET colonne stable
 * (on compense numériquement l'empreinte de la barre absente).
 */
export function LocalVideoPortraitFrame(parts: LocalVideoSlideParts) {
  const [railBottom, setRailBottom] = useState<number | null>(null);

  useLayoutEffect(() => {
    const band = parts.bandRef.current;
    if (!band) return;

    const sync = () => {
      const height = band.getBoundingClientRect().height;
      const absentBarReserve = parts.bar ? 0 : LOCAL_VIDEO_PLAYBACK_BAR_SLOT_PX;
      setRailBottom(Math.round(height + 12 + absentBarReserve));
    };

    sync();
    const Observer = globalThis.ResizeObserver;
    if (typeof Observer !== "function") return;
    const observer = new Observer(sync);
    observer.observe(band);
    return () => observer.disconnect();
  }, [parts.bandRef, parts.bar]);

  return (
    <>
      {parts.video}
      {parts.overlays}
      <div
        ref={parts.actionsRef}
        onFocus={parts.onChromeFocus}
        onBlur={parts.onChromeBlur}
        className="videos-slide-action-rail absolute right-2 z-20"
        style={railBottom != null ? { bottom: railBottom } : undefined}
        data-videos-action-rail-bottom={railBottom ?? undefined}
      >
        {parts.actions}
      </div>
      <div
        ref={parts.bandRef}
        onFocus={parts.onChromeFocus}
        onBlur={parts.onChromeBlur}
        className="videos-slide-bottom-chrome pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-[rgba(17,24,39,0.6)] px-4 pb-2 pt-1.5"
      >
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
type MediumNav = {
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
};

type LocalVideoMediumPortraitStageProps = LocalVideoSlideParts & {
  /** Flèches medium v1.2 — même colonne que les actions, hors vidéo (≠ R-PAN). */
  nav?: MediumNav | null;
  /** Dimensions intrinsèques / API du média (pas du viewport). */
  mediaWidth?: number | null;
  mediaHeight?: number | null;
  /** Badge « Vidéo partagée » dans le cadre (Lecteur-medium.dc.html). */
  sharedBadge?: ReactNode;
};

type LocalVideoMediumLandscapeStageProps = LocalVideoSlideParts & {
  nav?: MediumNav | null;
  mediaWidth?: number | null;
  mediaHeight?: number | null;
  sharedBadge?: ReactNode;
  onFullscreen: () => void;
};

function MediumSideColumn({
  nav,
  actions,
  actionsRef,
  onChromeFocus,
  onChromeBlur,
  columnHeight,
}: {
  nav: MediumNav | null;
  actions: ReactNode;
  actionsRef: RefObject<HTMLDivElement>;
  onChromeFocus: (event: FocusEvent<HTMLElement>) => void;
  onChromeBlur: (event: FocusEvent<HTMLElement>) => void;
  columnHeight: number;
}) {
  return (
    <div
      ref={actionsRef}
      onFocus={onChromeFocus}
      onBlur={onChromeBlur}
      className="videos-slide-action-rail videos-medium-side-column z-20 flex shrink-0 flex-col items-center py-1"
      data-videos-medium-side-column=""
      style={{ width: MEDIUM_SIDE_COLUMN_WIDTH_PX, height: columnHeight }}
    >
      {nav ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            aria-label="Vidéo précédente"
            disabled={!nav.canPrevious}
            onClick={nav.onPrevious}
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 disabled:opacity-40 ${VIDEO_IMMERSIVE_FOCUS}`}
          >
            <ChevronUp className="h-[22px] w-[22px]" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Vidéo suivante"
            disabled={!nav.canNext}
            onClick={nav.onNext}
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 disabled:opacity-40 ${VIDEO_IMMERSIVE_FOCUS}`}
          >
            <ChevronDown className="h-[22px] w-[22px]" aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="mt-auto flex flex-col items-center">{actions}</div>
    </div>
  );
}

function useFittedMediaFrame(
  mediaWidth: number | null | undefined,
  mediaHeight: number | null | undefined,
  fallback: { width: number; height: number },
  /** Réserve verticale sous la vidéo (légende paysage). */
  bottomReservePx = 0,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      const style = getComputedStyle(root);
      const padX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
      const padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const availW = Math.max(
        0,
        root.clientWidth - padX - MEDIUM_SIDE_COLUMN_WIDTH_PX - MEDIUM_SIDE_COLUMN_GAP_PX,
      );
      const availH = Math.max(0, root.clientHeight - padY - bottomReservePx);
      const mw = mediaWidth && mediaWidth > 0 ? mediaWidth : fallback.width;
      const mh = mediaHeight && mediaHeight > 0 ? mediaHeight : fallback.height;
      setFrame(fitMediaFrameInBox(availW, availH, mw, mh));
    };

    sync();
    const Observer = globalThis.ResizeObserver;
    if (typeof Observer !== "function") return;
    const observer = new Observer(sync);
    observer.observe(root);
    return () => observer.disconnect();
  }, [mediaWidth, mediaHeight, fallback.width, fallback.height, bottomReservePx]);

  return { rootRef, frame };
}

/**
 * Medium v1.2 portrait : cadre **haut et étroit** au ratio média, voile + légende,
 * colonne d'actions hors cadre (`ax = vx + vw + 12`). Pas de flex-1 qui aplatit le cadre.
 */
export function LocalVideoMediumPortraitStage({
  nav = null,
  mediaWidth = null,
  mediaHeight = null,
  sharedBadge = null,
  ...parts
}: LocalVideoMediumPortraitStageProps) {
  const { rootRef, frame } = useFittedMediaFrame(
    mediaWidth,
    mediaHeight,
    LOCAL_VIDEO_FALLBACK_PORTRAIT,
  );

  return (
    <div
      ref={rootRef}
      className="videos-medium-portrait-stage flex h-full w-full items-center justify-center bg-white px-1.5 py-1.5"
      data-videos-medium-portrait-stage=""
    >
      {frame.width > 0 ? (
        <div
          className="flex items-stretch"
          style={{ gap: MEDIUM_SIDE_COLUMN_GAP_PX, height: frame.height }}
        >
          <div
            className="relative overflow-hidden rounded-2xl bg-black"
            data-videos-medium-video-frame=""
            data-videos-medium-frame-orientation="portrait"
            style={{ width: frame.width, height: frame.height }}
          >
            {parts.video}
            {parts.overlays}
            {parts.muteControl}
            {sharedBadge}
            <div
              ref={parts.bandRef}
              onFocus={parts.onChromeFocus}
              onBlur={parts.onChromeBlur}
              className="videos-slide-bottom-chrome pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-[rgba(17,24,39,0.6)] px-4 pb-2 pt-1.5"
            >
              {parts.meta}
              {parts.bar}
              {parts.thread ? <div className="absolute inset-x-0 bottom-0">{parts.thread}</div> : null}
            </div>
          </div>
          <MediumSideColumn
            nav={nav}
            actions={parts.actions}
            actionsRef={parts.actionsRef}
            onChromeFocus={parts.onChromeFocus}
            onChromeBlur={parts.onChromeBlur}
            columnHeight={frame.height}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Réserve pour légende + puce sous le lecteur paysage (M4 / M8). */
const MEDIUM_LANDSCAPE_META_RESERVE_PX = 128;

/**
 * Medium v1.2 paysage : cadre horizontal au ratio média (`object-fit: contain` côté vidéo),
 * informations **sous** le lecteur sur fond blanc, actions latérales (≠ R-PAN).
 */
export function LocalVideoMediumLandscapeStage({
  nav = null,
  mediaWidth = null,
  mediaHeight = null,
  sharedBadge = null,
  onFullscreen,
  ...parts
}: LocalVideoMediumLandscapeStageProps) {
  const { rootRef, frame } = useFittedMediaFrame(
    mediaWidth,
    mediaHeight,
    LOCAL_VIDEO_FALLBACK_LANDSCAPE,
    MEDIUM_LANDSCAPE_META_RESERVE_PX,
  );

  return (
    <div
      ref={rootRef}
      className="videos-medium-landscape-stage flex h-full w-full items-center justify-center bg-white px-1.5 py-1.5"
      data-videos-medium-landscape-stage=""
    >
      {frame.width > 0 ? (
        <div className="flex flex-col" style={{ width: frame.width + MEDIUM_SIDE_COLUMN_GAP_PX + MEDIUM_SIDE_COLUMN_WIDTH_PX }}>
          <div className="flex items-stretch" style={{ gap: MEDIUM_SIDE_COLUMN_GAP_PX }}>
            <div
              className="relative overflow-hidden rounded-2xl bg-black"
              data-videos-medium-video-frame=""
              data-videos-medium-frame-orientation="landscape"
              style={{ width: frame.width, height: frame.height }}
            >
              {parts.video}
              {parts.overlays}
              {parts.muteControl}
              {sharedBadge}
              <button
                type="button"
                onClick={onFullscreen}
                aria-label={VIDEOS_MOBILE_FULLSCREEN}
                className={`absolute bottom-1 right-1 z-20 flex h-11 w-11 items-center justify-center text-white ${VIDEO_IMMERSIVE_FOCUS}`}
              >
                <Maximize className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
              {parts.thread ? <div className="absolute inset-x-0 bottom-0 z-10">{parts.thread}</div> : null}
            </div>
            <MediumSideColumn
              nav={nav}
              actions={parts.actions}
              actionsRef={parts.actionsRef}
              onChromeFocus={parts.onChromeFocus}
              onChromeBlur={parts.onChromeBlur}
              columnHeight={frame.height}
            />
          </div>
          <div
            ref={parts.bandRef}
            onFocus={parts.onChromeFocus}
            onBlur={parts.onChromeBlur}
            className="videos-slide-bottom-chrome mt-2 min-w-0 bg-white pt-1"
            style={{ width: frame.width }}
            data-videos-medium-landscape-meta=""
          >
            {parts.meta}
            {parts.bar}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function LocalVideoLandscapeStage({ aspectRatio, onFullscreen, ...parts }: LocalVideoLandscapeStageProps) {
  return (
    <div className="flex h-full flex-col justify-center pt-14">
      <div className="relative max-h-[60%] w-full bg-black" style={{ aspectRatio }}>
        {parts.video}
        {parts.overlays}
        {parts.muteControl}
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
