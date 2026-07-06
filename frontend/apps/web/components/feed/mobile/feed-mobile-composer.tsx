"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import { homeComposerPlaceholder } from "@yunicity/utils";
import { Camera } from "lucide-react";
import { useEffect, useId, useState } from "react";

type FeedMobileComposerProps = {
  city: string;
  onSubmit: (body: string, mediaUrl?: string | null) => Promise<void>;
};

/** Composer mobile — maquette MOBILE-REFONDE-01. */
export function FeedMobileComposer({ city, onSubmit }: FeedMobileComposerProps) {
  const bodyId = useId();
  const { user } = useAuth();
  const api = useYunicityApi();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder = homeComposerPlaceholder(city);
  const authorLabel = displayName ?? user?.email?.split("@")[0] ?? "Vous";
  const canPublish = Boolean(body.trim()) && !isSubmitting;

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
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed, mediaUrl.trim() || null);
      setBody("");
      setMediaUrl("");
      setShowMedia(false);
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openPhotoField() {
    setExpanded(true);
    setShowMedia(true);
  }

  return (
    <section
      className="web-mobile-feed-only rounded-2xl border border-neutral-200/90 bg-white px-3 py-3"
      aria-label="Publier sur le fil local"
    >
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
            onClick={openPhotoField}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-yunicity-primary hover:text-yunicity-primary-hover"
          >
            <Camera className="h-[18px] w-[18px]" aria-hidden />
            Photo
          </button>
        ) : null}
      </div>

      {expanded && showMedia ? (
        <input
          type="url"
          value={mediaUrl}
          onChange={(event) => setMediaUrl(event.target.value)}
          placeholder="URL de l’image (https://…)"
          className="mt-3 w-full rounded-xl border border-neutral-200/90 bg-neutral-50/50 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-yunicity-primary focus:outline-none"
        />
      ) : null}

      {expanded ? (
        <div className="mt-3 flex items-center justify-between gap-2 pl-12">
          <button
            type="button"
            onClick={() => setShowMedia((value) => !value)}
            className="inline-flex items-center gap-1 text-sm font-medium text-yunicity-primary hover:text-yunicity-primary-hover"
          >
            <Camera className="h-4 w-4" aria-hidden />
            {showMedia ? "Masquer l’image" : "Photo"}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setShowMedia(false);
                setBody("");
                setMediaUrl("");
                setError(null);
              }}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!canPublish}
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

      {error ? (
        <p className="mt-2 pl-12 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
