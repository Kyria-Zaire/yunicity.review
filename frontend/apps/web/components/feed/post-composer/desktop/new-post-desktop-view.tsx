"use client";

import { YunicityLogo } from "@/components/brand";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { NewPostDraft } from "@/hooks/use-new-post-draft";
import {
  POST_COMPOSER_BODY_MAX,
  POST_CROSS_POST_PLATFORMS,
  POST_NEW_CLOSE,
  POST_NEW_CROSS_POST_TITLE,
  POST_NEW_GALLERY,
  POST_NEW_PLACEHOLDER,
  POST_NEW_PUBLISH,
  POST_NEW_SELECT_MEDIA,
  POST_NEW_TITLE,
} from "@yunicity/utils";
import { ChevronRight, Globe2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewPostFormatTabs, NewPostOptionsPanel } from "../new-post-options-panel";

type NewPostDesktopViewProps = {
  draft: NewPostDraft;
  authorLabel: string;
  submitting: boolean;
  error: string | null;
  onPublish: () => void;
};

export function NewPostDesktopView({
  draft,
  authorLabel,
  submitting,
  error,
  onPublish,
}: NewPostDesktopViewProps) {
  const router = useRouter();
  const canPublish = draft.canPublish && !submitting;

  return (
    <div className="web-desktop-feed-new-only mx-auto w-full max-w-6xl px-4 py-4">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-white"
          aria-label={POST_NEW_CLOSE}
        >
          <X className="h-5 w-5" />
        </button>
        <YunicityLogo size="md" showWordmark href="/feed" />
        <h1 className="text-xl font-bold text-neutral-900">{POST_NEW_TITLE}</h1>
        <div className="flex-1" />
        <button
          type="button"
          disabled={!canPublish}
          onClick={onPublish}
          className="rounded-xl bg-yunicity-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {POST_NEW_PUBLISH}
        </button>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-neutral-200/90 bg-white p-4">
            <div className="mb-3 flex items-center gap-3">
              <ProfileAvatar name={authorLabel} size="md" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{authorLabel}</p>
                <button
                  type="button"
                  className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700"
                >
                  <Globe2 className="h-3 w-3" />
                  Public
                </button>
              </div>
            </div>
            <textarea
              value={draft.body}
              onChange={(event) => draft.setBody(event.target.value)}
              placeholder={POST_NEW_PLACEHOLDER(draft.city)}
              maxLength={POST_COMPOSER_BODY_MAX}
              className="min-h-[160px] w-full resize-none border-0 bg-transparent text-base focus:outline-none"
            />
            <p className="text-right text-xs text-neutral-400">
              {draft.charCount}/{POST_COMPOSER_BODY_MAX}
            </p>
            <NewPostFormatTabs active={draft.format} onChange={draft.setFormat} />
          </section>

          <NewPostOptionsPanel
            draft={draft}
            authorLabel={authorLabel}
            onOpenMedia={() => draft.fileInputRef.current?.click()}
          />
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-neutral-200/90 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">{POST_NEW_SELECT_MEDIA}</h2>
              <button
                type="button"
                onClick={() => draft.fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-sm font-medium text-yunicity-primary"
              >
                {POST_NEW_GALLERY}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {draft.selectedMedia.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => draft.removeMedia(item.id)}
                  className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-yunicity-primary text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => draft.fileInputRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-neutral-300 text-2xl text-neutral-400"
              >
                +
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200/90 bg-white p-4">
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
      </div>
    </div>
  );
}
