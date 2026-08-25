"use client";

import type { FeedPost } from "@yunicity/types";
import {
  FEED_ACTION_COMMENT,
  FEED_ACTION_EVENT_INTEREST,
  FEED_ACTION_EVENT_VIEW,
  FEED_ACTION_MAP,
  FEED_ACTION_NEIGHBORHOOD,
  FEED_ACTION_REACT,
  FEED_ACTION_SAVED,
  FEED_ACTION_SHARE,
  FEED_SHARE_COPIED,
} from "@yunicity/utils";
import { MapPinHouse } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

/** URL publique d'une publication — meme construction que la barre historique. */
function feedShareUrl(postId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/feed?post=${encodeURIComponent(postId)}`;
}

/**
 * Actions d'une publication — arbre UNIQUE (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A).
 *
 * ── Ce que ce module remplace ────────────────────────────────────────────────
 * Deux barres divergentes : `FeedSocialActionBar` (desktop — dix contrôles, dont
 * un `Signaler` en double du menu `…` de l'en-tête) et
 * `FeedMobileSocialActionBar` (mobile — quatre contrôles en icônes, sans aucun
 * CTA contextuel). Même publication, deux contrats fonctionnels : impossible de
 * n'avoir qu'une instance DOM tant que les deux existaient.
 *
 * ── Deux responsabilités, deux zones ─────────────────────────────────────────
 * `FeedPublicationContextualCta` : destinations conditionnées à une donnée
 * autoritaire (événement, quartier, carte). Les offres n'empruntent jamais
 * cette zone : leur unique lien Passport vit dans `OfferFeedCard`. Rendue
 * dans le CORPS, jamais mêlée aux actions sociales — ce sont des liens de
 * navigation, pas des interactions sur la publication.
 *
 * `FeedPublicationSocialActions` : les actions sociales, identiques partout.
 * Réagir · Commenter · Partager · Enregistrer (si événement).
 *
 * `Signaler` ne figure dans aucune des deux : il vit dans le menu `…` de
 * l'en-tête, seul et global, sur tous les écrans.
 *
 * ── Ce qui varie par bande ───────────────────────────────────────────────────
 * Le CSS peut masquer le LIBELLÉ visible (`.feed-action-label`) et resserrer les
 * espacements. Le nom accessible, lui, est porté par `aria-label` et ne dépend
 * jamais de la largeur.
 */

function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M12 20.3l-1.1-1C6.1 15 3 12.2 3 8.8 3 6.1 5.1 4 7.8 4c1.5 0 3 .7 4.2 2 1.2-1.3 2.7-2 4.2-2C18.9 4 21 6.1 21 8.8c0 3.4-3.1 6.2-7.9 10.5l-1.1 1z" />
    </svg>
  );
}

function IconComment() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M12 16V4m0 0L8 8m4-4l4 4M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function IconBookmark({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

const CONTROL_CLASS =
  "feed-action inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/50 disabled:cursor-not-allowed disabled:opacity-40";

function ActionControl({
  label,
  count,
  active = false,
  disabled = false,
  href,
  onClick,
  action,
  iconContract,
  children,
}: {
  label: string;
  count?: number;
  active?: boolean;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  action: string;
  iconContract?: string;
  children: ReactNode;
}) {
  // Le compteur entre dans le NOM ACCESSIBLE : un lecteur d'écran annonce
  // « Réagir, 3 » sans dépendre du libellé visible, qui peut être masqué.
  const accessibleName = count && count > 0 ? `${label}, ${count}` : label;
  const contenu = (
    <>
      {children}
      <span className="feed-action-label">{label}</span>
      {count && count > 0 ? <span className="tabular-nums">{count}</span> : null}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        aria-label={accessibleName}
        data-feed-publication-action={action}
        data-feed-publication-icon={iconContract}
        className={CONTROL_CLASS}
      >
        {contenu}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={accessibleName}
      aria-pressed={active || undefined}
      data-feed-publication-action={action}
      data-feed-publication-icon={iconContract}
      className={`${CONTROL_CLASS} ${active ? "text-yunicity-primary" : ""}`}
    >
      {contenu}
    </button>
  );
}

/** Destinations conditionnées à une donnée réelle. Jamais rendues à vide. */
export function FeedPublicationContextualCta({ post }: { post: FeedPost }) {
  // Fail-closed : une offre n'emprunte jamais cette zone. Son unique
  // destination Passport est portée par `OfferFeedCard`.
  if (post.type === "offer") {
    return null;
  }

  const isEvent = post.type === "event" && post.event != null;
  const hasLocation = post.location != null;
  const neighborhoodHref = post.neighborhood_summary
    ? `/neighborhoods/${post.neighborhood_summary.slug}${post.city ? `?city=${encodeURIComponent(post.city)}` : ""}`
    : null;
  const eventHref =
    isEvent && post.event ? `/events/${post.event.local_event_id}` : null;

  if (!eventHref && !neighborhoodHref && !(isEvent || hasLocation)) {
    return null;
  }

  return (
    <div
      data-feed-publication-contextual-cta=""
      className="feed-publication-cta mt-3 flex flex-wrap items-center gap-1"
    >
      {eventHref ? (
        <ActionControl label={FEED_ACTION_EVENT_VIEW} href={eventHref} action="event-view">
          <IconCalendar />
        </ActionControl>
      ) : null}
      {neighborhoodHref ? (
        <ActionControl
          label={FEED_ACTION_NEIGHBORHOOD}
          href={neighborhoodHref}
          action="neighborhood"
          iconContract="neighborhood-house-pin"
        >
          <MapPinHouse className="h-[18px] w-[18px]" aria-hidden />
        </ActionControl>
      ) : null}
      {isEvent || hasLocation ? (
        <ActionControl label={FEED_ACTION_MAP} href="/map" action="map" iconContract="map-pin">
          <IconMap />
        </ActionControl>
      ) : null}
    </div>
  );
}

/** Actions sociales — identiques sur mobile, medium et desktop. */
export function FeedPublicationSocialActions({
  post,
  commentsOpen,
  onToggleLike,
  onToggleComments,
  onToggleEventInterest,
}: {
  post: FeedPost;
  commentsOpen: boolean;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onToggleEventInterest?: () => Promise<void>;
}) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [interestLoading, setInterestLoading] = useState(false);
  const eventInterested = post.event?.interested_by_me ?? false;

  async function handleShare() {
    const url = feedShareUrl(post.id);
    const title = post.title ?? "Yunicity";
    const text = post.body?.slice(0, 120) ?? undefined;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(FEED_SHARE_COPIED);
      setTimeout(() => setShareHint(null), 2500);
    } catch {
      /* annulation partage */
    }
  }

  async function handleEventInterest() {
    if (!onToggleEventInterest || interestLoading) return;
    setInterestLoading(true);
    try {
      await onToggleEventInterest();
    } finally {
      setInterestLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        data-feed-publication-social=""
        className="-mx-1 flex flex-wrap items-center gap-0.5 sm:gap-1"
        role="toolbar"
        aria-label="Actions sur la publication"
      >
        <ActionControl
          label={FEED_ACTION_REACT}
          count={post.like_count}
          active={post.liked_by_me}
          onClick={onToggleLike}
          action="react"
        >
          <IconHeart filled={post.liked_by_me} />
        </ActionControl>

        <ActionControl
          label={FEED_ACTION_COMMENT}
          count={post.comment_count}
          active={commentsOpen}
          onClick={onToggleComments}
          action="comment"
        >
          <IconComment />
        </ActionControl>

        <ActionControl
          label={FEED_ACTION_SHARE}
          onClick={() => void handleShare()}
          action="share"
        >
          <IconShare />
        </ActionControl>

        {onToggleEventInterest ? (
          <ActionControl
            label={eventInterested ? FEED_ACTION_SAVED : FEED_ACTION_EVENT_INTEREST}
            active={eventInterested}
            disabled={interestLoading}
            onClick={() => void handleEventInterest()}
            action="event-interest"
          >
            <IconBookmark filled={eventInterested} />
          </ActionControl>
        ) : null}
      </div>

      {shareHint ? <p className="text-xs text-neutral-500">{shareHint}</p> : null}
    </div>
  );
}
