"use client";

import { YunicityLogo } from "@/components/brand";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { NewPostDraft } from "@/hooks/use-new-post-draft";
import {
  POST_COMPOSER_BODY_MAX,
  POST_CROSS_POST_PLATFORMS,
  POST_NEW_ADD_TO_POST,
  POST_NEW_CLOSE,
  POST_NEW_CROSS_POST_TITLE,
  POST_NEW_GALLERY,
  POST_NEW_NEXT,
  POST_NEW_PLACEHOLDER,
  POST_NEW_PUBLISH,
  POST_NEW_SELECT_MEDIA,
  POST_NEW_TAG_PEOPLE,
  POST_NEW_TITLE,
} from "@yunicity/utils";
import { ChevronDown, ChevronRight, Globe2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewPostFormatTabs } from "../new-post-options-panel";

type NewPostMobileViewProps = {
  draft: NewPostDraft;
  authorLabel: string;
  submitting: boolean;
  error: string | null;
  step: "compose" | "media" | "options";
  onStepChange: (step: "compose" | "media" | "options") => void;
  onPublish: () => void;
};

export function NewPostMobileView({
  draft,
  authorLabel,
  submitting,
  error,
  step,
  onStepChange,
  onPublish,
}: NewPostMobileViewProps) {
  const router = useRouter();
  const canPublish = draft.canPublish && !submitting;

  return (
    <div className="web-mobile-feed-new-only flex min-h-dvh min-w-0 flex-col bg-white">
      {step === "compose" ? (
        <header className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
            aria-label={POST_NEW_CLOSE}
          >
            <X className="h-5 w-5" />
          </button>
          <YunicityLogo size="sm" showWordmark href="/feed" />
          <h1 className="flex-1 text-center text-base font-bold text-neutral-900">{POST_NEW_TITLE}</h1>
          <button
            type="button"
            disabled={!canPublish}
            onClick={onPublish}
            className="rounded-lg bg-yunicity-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {POST_NEW_PUBLISH}
          </button>
        </header>
      ) : (
        <header className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2.5">
          <button
            type="button"
            onClick={() => onStepChange(step === "options" ? "media" : "compose")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
            aria-label="Retour"
          >
            <ChevronDown className="h-5 w-5 rotate-90" />
          </button>
          <h1 className="flex-1 text-center text-base font-bold text-neutral-900">
            {step === "media" ? POST_NEW_SELECT_MEDIA : POST_NEW_TITLE}
          </h1>
          <button
            type="button"
            onClick={() => onStepChange(step === "media" ? "options" : "media")}
            className="rounded-lg bg-yunicity-primary px-3 py-1.5 text-sm font-semibold text-white"
          >
            {POST_NEW_NEXT}
          </button>
        </header>
      )}

      {error ? (
        <p className="mx-3 mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {step === "compose" ? (
        <div className="flex flex-1 flex-col px-4 py-3">
          <div className="mb-3 flex items-center gap-3">
            <ProfileAvatar name={authorLabel} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">{authorLabel}</p>
              <button
                type="button"
                className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700"
              >
                <Globe2 className="h-3 w-3" />
                Public
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>

          <textarea
            value={draft.body}
            onChange={(event) => draft.setBody(event.target.value)}
            placeholder={POST_NEW_PLACEHOLDER(draft.city)}
            maxLength={POST_COMPOSER_BODY_MAX}
            className="min-h-[140px] flex-1 resize-none border-0 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
          />

          <p className="mb-2 text-right text-xs text-neutral-400">
            {draft.charCount}/{POST_COMPOSER_BODY_MAX}
          </p>

          <NewPostFormatTabs active={draft.format} onChange={draft.setFormat} />

          <section className="mt-4 border-t border-neutral-200 pt-3">
            <p className="mb-1 text-sm font-semibold text-neutral-900">{POST_NEW_ADD_TO_POST}</p>
            <button
              type="button"
              onClick={() => onStepChange("media")}
              className="flex w-full items-center justify-between py-2 text-sm text-neutral-800"
            >
              {POST_NEW_TAG_PEOPLE}
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </button>
          </section>
        </div>
      ) : null}

      {step === "media" ? (
        <div className="flex flex-1 flex-col px-4 py-3">
          <div className="mb-3 rounded-xl border border-neutral-200 p-3">
            <textarea
              value={draft.body}
              onChange={(event) => draft.setBody(event.target.value)}
              placeholder={POST_NEW_PLACEHOLDER(draft.city)}
              maxLength={POST_COMPOSER_BODY_MAX}
              rows={3}
              className="w-full resize-none border-0 bg-transparent text-sm focus:outline-none"
            />
            <p className="text-right text-xs text-neutral-400">
              {draft.charCount}/{POST_COMPOSER_BODY_MAX}
            </p>
          </div>

          <NewPostFormatTabs active={draft.format} onChange={draft.setFormat} />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">{POST_NEW_SELECT_MEDIA}</p>
            <button
              type="button"
              onClick={() => draft.fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-sm font-medium text-yunicity-primary"
            >
              {POST_NEW_GALLERY}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {draft.selectedMedia.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => draft.removeMedia(item.id)}
                className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yunicity-primary text-[10px] font-bold text-white">
                  {index + 1}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => draft.fileInputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-neutral-300 text-neutral-400"
            >
              +
            </button>
          </div>

          {draft.format === "poll" ? (
            <div className="mt-4 space-y-2">
              {draft.pollOptions.map((option, index) => (
                <input
                  key={`poll-${index}`}
                  value={option}
                  onChange={(event) => draft.updatePollOption(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                />
              ))}
              {draft.pollOptions.length < 4 ? (
                <button
                  type="button"
                  onClick={draft.addPollOption}
                  className="text-sm font-medium text-yunicity-primary"
                >
                  Ajouter une option
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {step === "options" ? (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-3 pb-24">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold">{POST_NEW_CROSS_POST_TITLE}</h3>
            {POST_CROSS_POST_PLATFORMS.map((platform) => (
              <label
                key={platform.id}
                className="flex items-center justify-between gap-3 border-b border-neutral-100 py-2 last:border-0"
              >
                <span>
                  <span className="block text-sm font-medium text-neutral-900">{platform.label}</span>
                  <span className="block text-xs text-neutral-500">{platform.handle}</span>
                </span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-yunicity-primary"
                  checked={draft.crossPost[platform.id]}
                  onChange={() => draft.toggleCrossPost(platform.id)}
                />
              </label>
            ))}
          </section>

          <button
            type="button"
            disabled={!canPublish}
            onClick={onPublish}
            className="w-full rounded-xl bg-yunicity-primary py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {POST_NEW_PUBLISH}
          </button>
        </div>
      ) : null}

      {step === "compose" ? (
        <div className="border-t border-neutral-200 p-3">
          <button
            type="button"
            onClick={() => onStepChange("media")}
            className="w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-800"
          >
            {POST_NEW_NEXT} — {POST_NEW_SELECT_MEDIA}
          </button>
        </div>
      ) : null}
    </div>
  );
}
