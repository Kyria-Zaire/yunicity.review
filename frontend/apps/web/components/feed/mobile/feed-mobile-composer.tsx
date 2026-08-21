"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { useComposerMedia } from "@/hooks/use-composer-media";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  COMPOSER_MEDIA_ACCEPT_ATTR,
  COMPOSER_MEDIA_REMOVE_PHOTO_LABEL,
  COMPOSER_MEDIA_REPLACE_PHOTO_LABEL,
  COMPOSER_MEDIA_UPLOADING_LABEL,
  homeComposerPlaceholder,
} from "@yunicity/utils";
import { Camera } from "lucide-react";
import { useEffect, useId, useState } from "react";

type FeedMobileComposerProps = {
  city: string;
  onSubmit: (body: string, mediaUrl?: string | null) => Promise<void>;
};

/** Composer mobile — maquette MOBILE-REFONDE-01 + contrat Photo C3.1-R1D. */
export function FeedMobileComposer({ city, onSubmit }: FeedMobileComposerProps) {
  const bodyId = useId();
  const publishHintId = useId();
  const { user } = useAuth();
  const api = useYunicityApi();
  const { fileInputRef, mediaUrl, uploading, mediaError, openPicker, onFileChange, clearMedia } =
    useComposerMedia();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder = homeComposerPlaceholder(city);
  const authorLabel = displayName ?? user?.email?.split("@")[0] ?? "Vous";
  const canPublish = Boolean(body.trim()) && !isSubmitting && !uploading;
  // C3.1-R1L : `PostCreateRequest.body` est `min_length=1` cote API — le texte
  // est reellement obligatoire, on ne contourne donc pas le contrat. Mais le
  // bouton restait desactive sans un mot d'explication apres l'ajout d'une
  // photo : l'utilisateur ne pouvait pas savoir ce qui manquait.
  const missingBodyForMedia = Boolean(mediaUrl) && !body.trim() && !uploading;

  useEffect(() => {
    void api
      .getProfileMe()
      .then((profile) => {
        setDisplayName(profile.display_name ?? profile.username ?? null);
      })
      .catch(() => {
        /* session expirée : ProtectedRoute redirige vers login */
      });
  }, [api]);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || isSubmitting || uploading) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed, mediaUrl);
      setBody("");
      clearMedia();
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetComposer() {
    setExpanded(false);
    setBody("");
    clearMedia();
    setError(null);
  }

  function openPhotoPicker() {
    setExpanded(true);
    openPicker();
  }

  return (
    <section
      className="web-mobile-feed-only rounded-2xl border border-neutral-200/90 bg-white px-3 py-3"
      aria-label="Publier sur le fil local"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={COMPOSER_MEDIA_ACCEPT_ATTR}
        className="sr-only"
        onChange={(event) => void onFileChange(event.target.files?.[0] ?? null)}
      />
      <div className="flex items-center gap-3">
        <ProfileAvatar name={authorLabel} size="md" />
        {expanded ? (
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor={bodyId}>
              {placeholder}
            </label>
            <textarea
              id={bodyId}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={placeholder}
              rows={3}
              maxLength={4000}
              autoFocus
              className="min-h-[4.5rem] w-full resize-none rounded-xl border border-neutral-200/90 bg-neutral-50/50 px-3 py-2.5 text-[15px] leading-snug text-neutral-900 placeholder:text-neutral-500 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary/30"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-w-0 flex-1 truncate rounded-xl bg-neutral-50 px-3 py-2.5 text-left text-[15px] text-neutral-500 ring-1 ring-neutral-200/80 transition hover:bg-neutral-100/80"
          >
            {placeholder}
          </button>
        )}
        {!expanded ? (
          <button
            type="button"
            onClick={openPhotoPicker}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-yunicity-primary hover:text-yunicity-primary-hover"
          >
            <Camera className="h-[18px] w-[18px]" aria-hidden />
            Photo
          </button>
        ) : null}
      </div>

      {expanded && uploading ? (
        <p className="mt-3 text-sm text-neutral-500">{COMPOSER_MEDIA_UPLOADING_LABEL}</p>
      ) : null}
      {expanded && mediaUrl ? (
        <div className="mt-3 w-full overflow-hidden rounded-xl border border-neutral-200/90 bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu média filesystem/R2, hors next/image */}
          <img
            src={mediaUrl}
            alt=""
            className="mx-auto block max-h-72 w-full object-contain"
          />
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200/90 px-3 py-2">
            <button
              type="button"
              onClick={openPicker}
              className="min-h-[44px] rounded-full px-3 py-1.5 text-sm font-medium text-yunicity-primary hover:bg-yunicity-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40"
            >
              {COMPOSER_MEDIA_REPLACE_PHOTO_LABEL}
            </button>
            <button
              type="button"
              onClick={clearMedia}
              className="min-h-[44px] rounded-full px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
            >
              {COMPOSER_MEDIA_REMOVE_PHOTO_LABEL}
            </button>
          </div>
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-3 flex items-center justify-between gap-2 pl-12">
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-1 text-sm font-medium text-yunicity-primary hover:text-yunicity-primary-hover"
          >
            <Camera className="h-4 w-4" aria-hidden />
            Photo
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetComposer}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!canPublish}
              aria-describedby={missingBodyForMedia ? publishHintId : undefined}
              onClick={() => void handleSubmit()}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                canPublish
                  ? "bg-yunicity-primary text-white hover:bg-yunicity-primary-hover"
                  : "cursor-not-allowed bg-yunicity-primary/40 text-white/90"
              }`}
            >
              {isSubmitting ? "…" : "Publier"}
            </button>
          </div>
        </div>
      ) : null}

      {missingBodyForMedia ? (
        <p id={publishHintId} className="mt-2 pl-12 text-sm text-neutral-600">
          Ajoutez un texte pour publier votre photo.
        </p>
      ) : null}

      {error || mediaError ? (
        <p className="mt-2 pl-12 text-sm text-red-600" role="alert">
          {error ?? mediaError}
        </p>
      ) : null}
    </section>
  );
}
