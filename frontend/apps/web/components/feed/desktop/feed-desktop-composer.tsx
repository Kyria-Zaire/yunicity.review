"use client";

import { useComposerMedia } from "@/hooks/use-composer-media";
import { ComposerMediaResolution } from "@/components/feed/composer-media-resolution";
import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { AvatarImage } from "@/components/avatar-image";
import {
  COMPOSER_MEDIA_ACCEPT_ATTR,
  COMPOSER_MEDIA_UPLOADING_LABEL,
} from "@yunicity/utils";

type FeedDesktopComposerProps = {
  city: string;
  avatarInitial: string;
  avatarUrl: string | null;
  onSubmit: (body: string, mediaUrl?: string | null) => Promise<void>;
};

function ComposerIconImage({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L7 17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ComposerIconCalendar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
    </svg>
  );
}

function ComposerIconStar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 3.5z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ComposerActionButton({
  label,
  action,
  onClick,
  href,
  children,
  disabled,
}: {
  label: string;
  action: string;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  const className =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        data-feed-desktop-composer-action={action}
        className={className}
      >
        {children}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      data-feed-desktop-composer-action={action}
      className={className}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

export function FeedDesktopComposer({
  city,
  avatarInitial,
  avatarUrl,
  onSubmit,
}: FeedDesktopComposerProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    fileInputRef,
    mediaUrl,
    displayUrl,
    uploading,
    mediaError,
    mediaReadyForPublish,
    mediaRejected,
    continueWithoutMedia,
    openPicker,
    onFileChange,
    clearMedia,
    beginPublishing,
    finishPublishing,
  } = useComposerMedia();

  const canSubmit = text.trim().length > 0 && !submitting && mediaReadyForPublish;

  async function handleSubmit() {
    if (!canSubmit || !beginPublishing()) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim(), mediaUrl);
      finishPublishing(true);
      setText("");
      clearMedia();
    } catch (erreur) {
      finishPublishing(false, erreur);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      data-feed-desktop-composer=""
      className="feed-desktop-surface feed-desktop-composer overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-yunicity-primary/20"
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-yunicity-primary-soft ring-1 ring-neutral-200/80">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-yunicity-primary" aria-hidden>
                {avatarInitial}
              </span>
            )}
          </div>
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="feed-desktop-composer-body">
            {`Quoi de neuf à ${city} ?`}
          </label>
          <textarea
            id="feed-desktop-composer-body"
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Quoi de neuf à ${city} ?`}
            rows={1}
            maxLength={4000}
            className="min-h-[2.5rem] w-full resize-none border-0 bg-transparent py-1.5 text-[15px] leading-snug text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
          />

          {uploading ? (
            <p className="mt-1 text-xs text-neutral-500" aria-live="polite">
              {COMPOSER_MEDIA_UPLOADING_LABEL}
            </p>
          ) : null}
          {displayUrl ? (
            <div className="relative mt-2 w-full max-w-[12rem] overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- dynamic R2 upload URL */}
              <img
                src={displayUrl}
                alt="Photo jointe"
                className="mx-auto block h-20 w-full object-contain"
              />
              {/* La pastille reste visuellement discrète (20 px) ; c'est la zone
                  cliquable qui atteint 44 px, sans alourdir un aperçu de 12 rem. */}
              <button
                type="button"
                onClick={clearMedia}
                className="absolute -right-1 -top-1 flex min-h-11 min-w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
                aria-label="Retirer la photo"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-white shadow">
                  <X className="h-3 w-3" />
                </span>
              </button>
            </div>
          ) : null}
          {mediaError ? (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {mediaError}
            </p>
          ) : null}
      {mediaRejected ? (
        <ComposerMediaResolution
          onChooseAnother={openPicker}
          onContinueWithout={continueWithoutMedia}
          className="px-0"
        />
      ) : null}
        </div>

        {canSubmit ? (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            data-feed-desktop-composer-submit=""
            className="mt-0.5 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-yunicity-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary-hover active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Publication…" : "Publier"}
          </button>
        ) : null}
      </div>

      <div className="border-t border-neutral-200/90">
        <div className="flex items-stretch px-2 py-1">
          <ComposerActionButton
            label="Photo"
            action="photo"
            onClick={openPicker}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2
                className="h-5 w-5 animate-spin text-emerald-600 motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <ComposerIconImage className="h-5 w-5 text-emerald-600" />
            )}
          </ComposerActionButton>

          <ComposerActionButton label="Événement" action="event" href="/sortir">
            <ComposerIconCalendar className="h-5 w-5 text-rose-500" />
          </ComposerActionButton>

          <ComposerActionButton
            label="Recommandation"
            action="recommendation"
            href="/organizations/request"
          >
            <ComposerIconStar className="h-5 w-5 text-orange-500" />
          </ComposerActionButton>

          <input
            ref={fileInputRef}
            type="file"
            accept={COMPOSER_MEDIA_ACCEPT_ATTR}
            className="hidden"
            onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
    </div>
  );
}
