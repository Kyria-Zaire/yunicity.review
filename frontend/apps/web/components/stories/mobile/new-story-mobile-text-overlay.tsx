"use client";

import {
  STORIES_CAPTION_MAX,
  STORIES_MOBILE_TEXT_APPLY,
  STORIES_MOBILE_TEXT_PLACEHOLDER,
  STORIES_MOBILE_TEXT_STYLE_CLASSIC,
  STORIES_MOBILE_TEXT_STYLE_LARGE,
  STORIES_MOBILE_TOOL_TEXT,
} from "@yunicity/utils";
import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";

export type StoryTextOverlayStyle = "classic" | "large";

type NewStoryMobileTextOverlayProps = {
  open: boolean;
  value: string;
  previewUrl: string | null;
  previewMediaType: "image" | "video" | null;
  textStyle: StoryTextOverlayStyle;
  onChange: (value: string) => void;
  onTextStyleChange: (style: StoryTextOverlayStyle) => void;
  onClose: () => void;
};

/** Éditeur texte sur l'aperçu story (MOBILE-NEW-STORY-01). */
export function NewStoryMobileTextOverlay({
  open,
  value,
  previewUrl,
  previewMediaType,
  textStyle,
  onChange,
  onTextStyleChange,
  onClose,
}: NewStoryMobileTextOverlayProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const previewTextClass =
    textStyle === "large"
      ? "text-2xl font-extrabold leading-tight"
      : "text-lg font-bold leading-snug";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        {previewUrl && previewMediaType === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="size-full object-cover opacity-90" />
        ) : previewUrl && previewMediaType === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={previewUrl} className="size-full object-cover opacity-90" muted playsInline autoPlay loop />
        ) : (
          <div className="size-full bg-neutral-900" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-black/25" aria-hidden />

        <p
          className={`pointer-events-none absolute bottom-28 left-4 right-16 whitespace-pre-wrap text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] ${previewTextClass}`}
        >
          {value.trim() || STORIES_MOBILE_TEXT_PLACEHOLDER}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white"
          aria-label="Fermer l'éditeur texte"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] inline-flex items-center gap-1.5 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white"
        >
          <Check className="h-4 w-4" aria-hidden />
          {STORIES_MOBILE_TEXT_APPLY}
        </button>
      </div>

      <div className="border-t border-white/10 bg-neutral-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
          {STORIES_MOBILE_TOOL_TEXT}
        </p>

        <div className="mb-3 flex gap-2">
          <StyleChip
            label={STORIES_MOBILE_TEXT_STYLE_CLASSIC}
            active={textStyle === "classic"}
            onClick={() => onTextStyleChange("classic")}
          />
          <StyleChip
            label={STORIES_MOBILE_TEXT_STYLE_LARGE}
            active={textStyle === "large"}
            onClick={() => onTextStyleChange("large")}
          />
        </div>

        <div className="relative">
          <textarea
            ref={inputRef}
            value={value}
            maxLength={STORIES_CAPTION_MAX}
            onChange={(event) => onChange(event.target.value)}
            placeholder={STORIES_MOBILE_TEXT_PLACEHOLDER}
            rows={3}
            className="w-full resize-none rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/30"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-white/50">
            {value.length}/{STORIES_CAPTION_MAX}
          </span>
        </div>
      </div>
    </div>
  );
}

function StyleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-white text-neutral-900" : "bg-white/10 text-white"
      }`}
    >
      {label}
    </button>
  );
}
