"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { useComposerMedia } from "@/hooks/use-composer-media";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  COMPOSER_MEDIA_ACCEPT_ATTR,
  COMPOSER_MEDIA_ADD_LABEL,
  COMPOSER_MEDIA_REMOVE_LABEL,
  COMPOSER_MEDIA_UPLOADING_LABEL,
  COMPOSER_TEXT_REQUIRED_HINT,
  homeComposerPlaceholder,
} from "@yunicity/utils";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

function ComposerIconButton({
  label,
  mediumLabel,
  action,
  onClick,
  children,
  href,
}: {
  label: string;
  /**
   * Libellé VISIBLE dans la seule bande medium (C3-FEED-M6). Il décrit le
   * contrat RÉEL du contrôle, jamais l'intention d'une maquette : « Quartiers »
   * et « Sortir » NAVIGUENT vers une page, ils n'attachent rien à la
   * publication. Les nommer « Lieu » et « Événement » aurait menti.
   */
  mediumLabel: string;
  action: string;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "feed-composer-action flex h-9 w-9 items-center justify-center rounded-full text-yunicity-primary transition-colors hover:bg-yunicity-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40";

  const contenu = (
    <>
      {children}
      <span className="feed-medium-composer-label">{mediumLabel}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        title={label}
        data-feed-composer-action={action}
        className={className}
      >
        {contenu}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-feed-composer-action={action}
      className={className}
    >
      {contenu}
    </button>
  );
}

function IconImage({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L7 17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMapPin({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

function IconCalendar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
    </svg>
  );
}

/** WEB-HOME-01D — Composer feed type X : avatar + zone libre + barre d’actions. */
export function FeedComposer({
  onSubmit,
  city,
  placeholder,
  submitLabel = "Publier",
}: {
  onSubmit: (body: string, mediaUrl?: string | null) => Promise<void>;
  city?: string | null;
  placeholder?: string;
  submitLabel?: string;
}) {
  const { user } = useAuth();
  const api = useYunicityApi();
  const { fileInputRef, mediaUrl, uploading, mediaError, openPicker, onFileChange, clearMedia } =
    useComposerMedia();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedPlaceholder =
    placeholder ?? (city ? homeComposerPlaceholder(city) : "Partagez un moment local…");

  const authorLabel = displayName ?? user?.email?.split("@")[0] ?? "Vous";
  const canPublish = Boolean(body.trim()) && !isSubmitting && !uploading;
  /**
   * Le backend impose `PostCreateRequest.body` avec `min_length=1` : une photo
   * seule part en 422. Le bouton était déjà désactivé, mais SANS explication —
   * l'utilisateur voyait un bouton mort sans savoir pourquoi.
   */
  const photoSansTexte = Boolean(mediaUrl) && !body.trim();

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
    if (!trimmed || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed, mediaUrl);
      setBody("");
      clearMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      data-feed-composer=""
      className="feed-composer scroll-mt-24 border-y border-neutral-200/70 py-4 sm:py-5"
      aria-label="Publier sur le fil local"
    >
      <div className="feed-composer-row flex gap-3 sm:gap-4">
        <div data-feed-composer-avatar="" className="shrink-0 pt-0.5">
          <ProfileAvatar name={authorLabel} size="md" />
        </div>

        <div className="feed-composer-field min-w-0 flex-1">
          <label className="sr-only" htmlFor="feed-composer-body">
            {resolvedPlaceholder}
          </label>
          <textarea
            id="feed-composer-body"
            data-feed-composer-input=""
            aria-describedby="feed-composer-rule"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={resolvedPlaceholder}
            rows={2}
            maxLength={4000}
            className="min-h-[3.25rem] w-full resize-none border-0 bg-transparent p-0 text-xl leading-snug text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-0 sm:min-h-[3.5rem] sm:text-[1.35rem]"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept={COMPOSER_MEDIA_ACCEPT_ATTR}
            className="hidden"
            onChange={(event) => void onFileChange(event.target.files?.[0] ?? null)}
          />
          {uploading ? (
            <p className="mt-3 text-sm text-neutral-500">{COMPOSER_MEDIA_UPLOADING_LABEL}</p>
          ) : mediaUrl ? (
            <div data-feed-composer-preview="" className="relative mt-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu média R2, hors next/image */}
              <img
                src={mediaUrl}
                alt=""
                className="max-h-56 rounded-xl border border-neutral-200/90 object-cover"
              />
              <button
                type="button"
                onClick={clearMedia}
                data-feed-composer-media-remove=""
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-black/75"
              >
                {COMPOSER_MEDIA_REMOVE_LABEL}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="feed-composer-bar mt-3 flex items-center justify-between gap-3 pl-11 sm:mt-4 sm:pl-[3.75rem]">
        <div
          data-feed-composer-actions=""
          className="flex min-w-0 flex-wrap items-center gap-0.5 sm:gap-1"
        >
          <ComposerIconButton
            label={COMPOSER_MEDIA_ADD_LABEL}
            mediumLabel="Photo"
            action="photo"
            onClick={openPicker}
          >
            <IconImage />
          </ComposerIconButton>
          <ComposerIconButton
            label="Explorer les quartiers"
            mediumLabel="Quartiers"
            action="neighborhoods"
            href="/neighborhoods"
          >
            <IconMapPin />
          </ComposerIconButton>
          <ComposerIconButton
            label="Voir les moments locaux"
            mediumLabel="Sortir"
            action="sortir"
            href="/sortir"
          >
            <IconCalendar />
          </ComposerIconButton>
        </div>

        <button
          type="button"
          disabled={!canPublish}
          onClick={() => void handleSubmit()}
          data-feed-composer-submit=""
          aria-describedby="feed-composer-rule"
          className={`feed-composer-submit shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 sm:px-5 sm:py-2 ${
            canPublish
              ? "bg-yunicity-primary text-white hover:bg-yunicity-primary-hover"
              : "cursor-not-allowed bg-yunicity-primary/40 text-white/90"
          }`}
        >
          {isSubmitting ? "…" : submitLabel}
        </button>
      </div>

      {/* Énoncé de la règle backend `body min_length=1`. Toujours dans le DOM
          pour les technologies d'assistance (`aria-describedby`), rendu VISIBLE
          dans la bande medium quand une photo attend son texte. */}
      <p
        id="feed-composer-rule"
        data-feed-composer-hint=""
        data-hint-active={photoSansTexte ? "true" : "false"}
        className="feed-composer-rule sr-only"
      >
        {COMPOSER_TEXT_REQUIRED_HINT}
      </p>

      {error || mediaError ? (
        <p
          data-feed-composer-error=""
          className="feed-composer-error mt-3 pl-11 text-sm text-red-600 sm:pl-[3.75rem]"
          role="alert"
        >
          {error ?? mediaError}
        </p>
      ) : null}
    </section>
  );
}
