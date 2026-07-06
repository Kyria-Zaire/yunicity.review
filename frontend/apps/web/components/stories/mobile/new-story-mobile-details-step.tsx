"use client";

import type { useNewStoryDraft } from "@/hooks/use-new-story-draft";
import {
  STORIES_CAPTION_MAX,
  STORIES_MOBILE_ADD_MEDIA,
  STORIES_MOBILE_DESCRIPTION_LABEL,
  STORIES_MOBILE_LOCATION_ADD_ANOTHER,
  STORIES_MOBILE_LOCATION_LABEL,
  STORIES_MOBILE_NEW_NEXT,
  STORIES_NEW_LOCATION_PLACEHOLDER,
} from "@yunicity/utils";
import { MapPin, Plus, X } from "lucide-react";

type Draft = ReturnType<typeof useNewStoryDraft>;

type NewStoryMobileDetailsStepProps = {
  draft: Draft;
  onNext: () => void;
};

/** Étape 2 — description et lieu (MOBILE-NEW-STORY-01). */
export function NewStoryMobileDetailsStep({ draft, onNext }: NewStoryMobileDetailsStepProps) {
  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        {draft.localPreviewUrl ? (
          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
            {draft.previewMediaType === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.localPreviewUrl} alt="" className="size-full object-cover" />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={draft.localPreviewUrl} className="size-full object-cover" muted />
            )}
          </div>
        ) : null}
        <button
          type="button"
          onClick={draft.openFilePicker}
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-yunicity-primary/40 bg-[#EEF0FF]/50 text-yunicity-primary"
        >
          <Plus className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-semibold">{STORIES_MOBILE_ADD_MEDIA}</span>
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-neutral-900">{STORIES_MOBILE_DESCRIPTION_LABEL}</span>
        <div className="relative mt-2">
          <textarea
            value={draft.caption}
            maxLength={STORIES_CAPTION_MAX}
            onChange={(event) => draft.setCaption(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 text-xs text-neutral-400">
            {draft.caption.length}/{STORIES_CAPTION_MAX}
          </span>
        </div>
      </label>

      <div className="space-y-2">
        <span className="text-sm font-semibold text-neutral-900">{STORIES_MOBILE_LOCATION_LABEL}</span>
        {draft.locationLabel.trim() ? (
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">
              {draft.locationLabel}
            </span>
            <button
              type="button"
              onClick={draft.clearLocation}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
              aria-label="Retirer le lieu"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={draft.locationLabel}
            onChange={(event) => draft.setLocationLabel(event.target.value)}
            placeholder={STORIES_NEW_LOCATION_PLACEHOLDER}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
          />
        )}
        {draft.locationLabel.trim() ? (
          <button
            type="button"
            onClick={() => draft.setLocationLabel("")}
            className="text-sm font-semibold text-yunicity-primary"
          >
            {STORIES_MOBILE_LOCATION_ADD_ANOTHER}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!draft.canPublish}
        className="w-full rounded-full bg-yunicity-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {STORIES_MOBILE_NEW_NEXT}
      </button>
    </div>
  );
}
