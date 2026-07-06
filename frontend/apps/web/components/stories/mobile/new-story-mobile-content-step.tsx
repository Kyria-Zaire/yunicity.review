"use client";

import { useStoryCamera, type StoryCameraMode } from "@/hooks/use-story-camera";
import type { useNewStoryDraft } from "@/hooks/use-new-story-draft";
import {
  STORIES_MOBILE_CAPTURE_HINT,
  STORIES_MOBILE_FLIP,
  STORIES_MOBILE_GALLERY,
  STORIES_MOBILE_IDEAS,
  STORIES_MOBILE_MODE_LIVE,
  STORIES_MOBILE_MODE_LIVE_SOON,
  STORIES_MOBILE_MODE_PHOTO,
  STORIES_MOBILE_MODE_STORY,
  STORIES_MOBILE_MODE_VIDEO,
  STORIES_MOBILE_NEW_NEXT,
  STORIES_MOBILE_RECORDING,
  STORIES_MOBILE_TAP_TO_STOP,
  STORIES_MOBILE_TEMPLATES,
  STORIES_MOBILE_TOOL_DRAW,
  STORIES_MOBILE_TOOL_FILTER,
  STORIES_MOBILE_TOOL_LINK,
  STORIES_MOBILE_TOOL_MUSIC,
  STORIES_MOBILE_TOOL_STICKER,
  STORIES_MOBILE_TOOL_TEXT,
  STORIES_NEW_ELEMENT_SOON,
  STORIES_NEW_UPLOAD_BUTTON,
} from "@yunicity/utils";
import {
  Brush,
  Filter,
  ImageIcon,
  Link2,
  Music,
  Pencil,
  Plus,
  RefreshCw,
  Smile,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

import { NewStoryMobileTextOverlay } from "./new-story-mobile-text-overlay";

type Draft = ReturnType<typeof useNewStoryDraft>;

type NewStoryMobileContentStepProps = {
  draft: Draft;
  onNext: () => void;
};

const MODES = [
  { id: "photo", label: STORIES_MOBILE_MODE_PHOTO },
  { id: "video", label: STORIES_MOBILE_MODE_VIDEO },
  { id: "story", label: STORIES_MOBILE_MODE_STORY },
  { id: "live", label: STORIES_MOBILE_MODE_LIVE, disabled: true },
] as const;

const TOOLS = [
  { id: "text", label: STORIES_MOBILE_TOOL_TEXT, icon: Type, action: "text" as const },
  { id: "draw", label: STORIES_MOBILE_TOOL_DRAW, icon: Brush, action: "soon" as const },
  { id: "sticker", label: STORIES_MOBILE_TOOL_STICKER, icon: Smile, action: "soon" as const },
  { id: "filter", label: STORIES_MOBILE_TOOL_FILTER, icon: Filter, action: "soon" as const },
  { id: "music", label: STORIES_MOBILE_TOOL_MUSIC, icon: Music, action: "soon" as const },
  { id: "link", label: STORIES_MOBILE_TOOL_LINK, icon: Link2, action: "soon" as const },
];

/** Étape 1 — caméra native + aperçu éditable (MOBILE-NEW-STORY-01). */
export function NewStoryMobileContentStep({ draft, onNext }: NewStoryMobileContentStepProps) {
  const [activeMode, setActiveMode] = useState<StoryCameraMode>("story");
  const [notice, setNotice] = useState<string | null>(null);
  const [textEditorOpen, setTextEditorOpen] = useState(false);

  const hasMedia = Boolean(draft.localPreviewUrl && draft.previewMediaType);

  const onCameraCapture = useCallback(
    (file: File) => {
      void draft.handleSelectedFile(file);
    },
    [draft],
  );

  const onCameraError = useCallback(
    (message: string) => {
      draft.setUploadError(message);
    },
    [draft],
  );

  const camera = useStoryCamera({
    enabled: !hasMedia,
    mode: activeMode,
    onCapture: onCameraCapture,
    onError: onCameraError,
  });

  const previewTextClass =
    draft.textOverlayStyle === "large"
      ? "text-2xl font-extrabold leading-tight"
      : "text-lg font-bold leading-snug";

  function handleTool(action: "text" | "soon") {
    if (action === "text") {
      setTextEditorOpen(true);
      return;
    }
    setNotice(STORIES_NEW_ELEMENT_SOON);
  }

  if (hasMedia) {
    return (
      <>
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <div className="relative aspect-[9/16] min-h-[min(calc(100dvh-12.5rem),40rem)] w-full max-h-[min(78dvh,44rem)]">
            {draft.previewMediaType === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.localPreviewUrl!} alt="" className="size-full object-cover" />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={draft.localPreviewUrl!}
                className="size-full object-cover"
                controls
                playsInline
              />
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 flex gap-1 p-3">
              {[0, 1, 2, 3].map((segment) => (
                <span
                  key={segment}
                  className={`h-0.5 flex-1 rounded-full ${segment === 0 ? "bg-white" : "bg-white/35"}`}
                />
              ))}
            </div>

            {draft.caption.trim() ? (
              <p
                className={`pointer-events-none absolute bottom-24 left-4 right-16 whitespace-pre-wrap text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] ${previewTextClass}`}
              >
                {draft.caption.trim()}
              </p>
            ) : null}

            {draft.locationLabel.trim() ? (
              <span className="pointer-events-none absolute bottom-16 left-4 inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {draft.locationLabel.trim()}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => {
                draft.resetFile();
                setTextEditorOpen(false);
              }}
              className="absolute left-3 top-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white"
              aria-label="Retirer le média"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <ul className="absolute bottom-20 right-2 flex flex-col items-center gap-3">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <li key={tool.id}>
                    <button
                      type="button"
                      onClick={() => handleTool(tool.action)}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm ${
                          tool.action === "text" ? "bg-yunicity-primary/90 text-white" : "bg-black/40 text-white"
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="text-[10px] font-medium text-white">{tool.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {notice ? (
            <p className="px-4 py-2 text-center text-xs text-neutral-500">{notice}</p>
          ) : null}

          <div className="border-t border-neutral-100 bg-white p-4">
            <button
              type="button"
              onClick={onNext}
              className="w-full rounded-full bg-yunicity-primary py-3 text-sm font-semibold text-white"
            >
              {STORIES_MOBILE_NEW_NEXT}
            </button>
          </div>
        </div>

        <NewStoryMobileTextOverlay
          open={textEditorOpen}
          value={draft.caption}
          previewUrl={draft.localPreviewUrl}
          previewMediaType={draft.previewMediaType}
          textStyle={draft.textOverlayStyle}
          onChange={draft.setCaption}
          onTextStyleChange={draft.setTextOverlayStyle}
          onClose={() => setTextEditorOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-neutral-900">
        <div className="relative flex min-h-[min(calc(100dvh-12.5rem),40rem)] flex-1 flex-col items-center justify-end">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={camera.videoRef}
            className={`absolute inset-0 size-full object-cover ${camera.ready ? "opacity-100" : "opacity-0"}`}
            playsInline
            muted
            autoPlay
          />

          {!camera.ready ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-neutral-700 to-neutral-900 p-4">
              <p className="max-w-xs text-center text-sm text-white/80">{STORIES_MOBILE_CAPTURE_HINT}</p>
            </div>
          ) : null}

          {camera.recording ? (
            <span className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white">
              {STORIES_MOBILE_RECORDING} · {STORIES_MOBILE_TAP_TO_STOP}
            </span>
          ) : null}

          <div className="relative z-10 w-full p-4 pb-6">
            <ul className="mb-5 flex justify-center gap-2 rounded-full bg-black/35 p-1 backdrop-blur-sm">
              {MODES.map((mode) => (
                <li key={mode.id}>
                  <button
                    type="button"
                    disabled={"disabled" in mode && mode.disabled}
                    onClick={() => {
                      if (mode.id === "live") {
                        setNotice(STORIES_MOBILE_MODE_LIVE_SOON);
                        return;
                      }
                      if (mode.id === "photo" || mode.id === "video" || mode.id === "story") {
                        setActiveMode(mode.id);
                      }
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      activeMode === mode.id
                        ? "bg-white text-neutral-900"
                        : "text-white/90 disabled:opacity-40"
                    }`}
                  >
                    {mode.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex w-full max-w-sm items-center justify-between px-2 mx-auto">
              <button
                type="button"
                onClick={draft.openFilePicker}
                className="relative flex w-16 flex-col items-center gap-1"
              >
                <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10">
                  {camera.galleryThumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={camera.galleryThumbUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-white" aria-hidden />
                  )}
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yunicity-primary text-white">
                    <Plus className="h-3 w-3" aria-hidden />
                  </span>
                </span>
                <span className="text-[10px] font-medium text-white">{STORIES_MOBILE_GALLERY}</span>
              </button>

              <button
                type="button"
                onClick={camera.handleCapturePress}
                disabled={!camera.ready}
                aria-label={STORIES_NEW_UPLOAD_BUTTON}
                className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 bg-white/10 ring-4 transition disabled:opacity-40 ${
                  camera.recording
                    ? "border-red-500 ring-red-500/40"
                    : "border-yunicity-primary ring-yunicity-primary/30"
                }`}
              />

              <button
                type="button"
                onClick={camera.flipCamera}
                disabled={!camera.ready}
                className="flex w-16 flex-col items-center gap-1 disabled:opacity-40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                  <RefreshCw className="h-5 w-5 text-white" aria-hidden />
                </span>
                <span className="text-[10px] font-medium text-white">{STORIES_MOBILE_FLIP}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-white/10 bg-neutral-900/95 p-2 text-white">
          <button
            type="button"
            onClick={() => setNotice(STORIES_NEW_ELEMENT_SOON)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {STORIES_MOBILE_TEMPLATES}
          </button>
          <span className="w-px bg-white/15" aria-hidden />
          <button
            type="button"
            onClick={() => setNotice(STORIES_NEW_ELEMENT_SOON)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {STORIES_MOBILE_IDEAS}
          </button>
        </div>
      </div>

      {notice || draft.uploadError ? (
        <p className="shrink-0 text-center text-sm text-red-600" role="alert">
          {draft.uploadError ?? notice}
        </p>
      ) : null}
    </div>
  );
}
