"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { useComposerMedia } from "@/hooks/use-composer-media";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  COMPOSER_MEDIA_ACCEPT_ATTR,
  COMPOSER_MEDIA_REMOVE_LABEL,
  COMPOSER_MEDIA_UPLOADING_LABEL,
  TERRITORY_MOBILE_COMPOSER_ACTION_PHOTO,
  TERRITORY_MOBILE_COMPOSER_ACTION_PLACE,
  TERRITORY_MOBILE_COMPOSER_ACTION_POLL,
  TERRITORY_MOBILE_COMPOSER_ACTION_VIDEO,
  TERRITORY_MOBILE_COMPOSER_ARIA,
  TERRITORY_MOBILE_COMPOSER_CANCEL,
  TERRITORY_MOBILE_COMPOSER_ERROR,
  TERRITORY_MOBILE_COMPOSER_PLACE_SOON,
  TERRITORY_MOBILE_COMPOSER_PLACEHOLDER,
  TERRITORY_MOBILE_COMPOSER_POLL_SOON,
  TERRITORY_MOBILE_COMPOSER_PUBLISH,
  TERRITORY_MOBILE_COMPOSER_VIDEO_SOON,
} from "@yunicity/utils";
import { BarChart3, ImageIcon, MapPin, PlaySquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

type TerritoryMobilePostComposerProps = {
  onSubmit: (body: string, mediaUrl?: string | null) => Promise<void>;
};

/** Composer mobile territorial — maquette MOBILE-TERRITORY-COMPOSER-01. */
export function TerritoryMobilePostComposer({ onSubmit }: TerritoryMobilePostComposerProps) {
  const bodyId = useId();
  const router = useRouter();
  const { user } = useAuth();
  const api = useYunicityApi();
  const { fileInputRef, mediaUrl, uploading, mediaError, openPicker, onFileChange, clearMedia } =
    useComposerMedia();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorLabel = displayName ?? user?.email?.split("@")[0] ?? "Vous";
  const canPublish = Boolean(body.trim()) && !isSubmitting && !uploading;

  useEffect(() => {
    if (!user) return;
    void api
      .getProfileMe()
      .then((profile) => {
        setDisplayName(profile.display_name ?? profile.username ?? null);
      })
      .catch(() => {
        /* ProtectedRoute gère la session */
      });
  }, [api, user]);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed, mediaUrl);
      setBody("");
      clearMedia();
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : TERRITORY_MOBILE_COMPOSER_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  function requireAuth(action: () => void) {
    if (!user) {
      router.push("/login");
      return;
    }
    action();
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      aria-label={TERRITORY_MOBILE_COMPOSER_ARIA}
    >
      <div className="px-3 py-3">
        <div className="flex items-center gap-3">
          <ProfileAvatar name={authorLabel} size="md" />
          {expanded ? (
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor={bodyId}>
                {TERRITORY_MOBILE_COMPOSER_PLACEHOLDER}
              </label>
              <textarea
                id={bodyId}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={TERRITORY_MOBILE_COMPOSER_PLACEHOLDER}
                rows={3}
                maxLength={4000}
                autoFocus
                className="min-h-[4.5rem] w-full resize-none rounded-xl border border-neutral-200/90 bg-neutral-50/50 px-3 py-2.5 text-[15px] leading-snug text-neutral-900 placeholder:text-neutral-500 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary/30"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => requireAuth(() => setExpanded(true))}
              className="min-w-0 flex-1 truncate rounded-xl bg-neutral-50 px-3 py-2.5 text-left text-[15px] text-neutral-500 ring-1 ring-neutral-200/80 transition hover:bg-neutral-100/80"
            >
              {TERRITORY_MOBILE_COMPOSER_PLACEHOLDER}
            </button>
          )}
          <button
            type="button"
            disabled={!canPublish}
            onClick={() => requireAuth(() => void handleSubmit())}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              canPublish
                ? "bg-yunicity-primary text-white hover:bg-yunicity-primary-hover"
                : "cursor-not-allowed bg-yunicity-primary/40 text-white/90"
            }`}
          >
            {isSubmitting ? "…" : TERRITORY_MOBILE_COMPOSER_PUBLISH}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={COMPOSER_MEDIA_ACCEPT_ATTR}
          className="hidden"
          onChange={(event) => void onFileChange(event.target.files?.[0] ?? null)}
        />
        {expanded && uploading ? (
          <p className="mt-3 text-sm text-neutral-500">{COMPOSER_MEDIA_UPLOADING_LABEL}</p>
        ) : expanded && mediaUrl ? (
          <div className="relative mt-3 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu média R2, hors next/image */}
            <img
              src={mediaUrl}
              alt=""
              className="max-h-48 rounded-xl border border-neutral-200/90 object-cover"
            />
            <button
              type="button"
              onClick={clearMedia}
              className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white"
            >
              {COMPOSER_MEDIA_REMOVE_LABEL}
            </button>
          </div>
        ) : null}

        {expanded ? (
          <div className="mt-3 flex items-center justify-end gap-2 pl-12">
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setBody("");
                clearMedia();
                setError(null);
              }}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              {TERRITORY_MOBILE_COMPOSER_CANCEL}
            </button>
          </div>
        ) : null}

        {error || mediaError ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error ?? mediaError}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-4 divide-x divide-neutral-200/90 border-t border-neutral-200/90">
        <button
          type="button"
          onClick={() =>
            requireAuth(() => {
              setExpanded(true);
              openPicker();
            })
          }
          className="flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold text-neutral-600 transition hover:bg-neutral-50 hover:text-yunicity-primary"
        >
          <ImageIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {TERRITORY_MOBILE_COMPOSER_ACTION_PHOTO}
        </button>
        <button
          type="button"
          disabled
          title={TERRITORY_MOBILE_COMPOSER_VIDEO_SOON}
          className="flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold text-neutral-400"
        >
          <PlaySquare className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {TERRITORY_MOBILE_COMPOSER_ACTION_VIDEO}
        </button>
        <button
          type="button"
          disabled
          title={TERRITORY_MOBILE_COMPOSER_POLL_SOON}
          className="flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold text-neutral-400"
        >
          <BarChart3 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {TERRITORY_MOBILE_COMPOSER_ACTION_POLL}
        </button>
        <button
          type="button"
          disabled
          title={TERRITORY_MOBILE_COMPOSER_PLACE_SOON}
          className="flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold text-neutral-400"
        >
          <MapPin className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {TERRITORY_MOBILE_COMPOSER_ACTION_PLACE}
        </button>
      </div>
    </section>
  );
}
