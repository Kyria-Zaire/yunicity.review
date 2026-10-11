"use client";

import type { FeedPost, FeedReportReason } from "@yunicity/types";
import { FEED_ACTION_SAVED, FEED_EVENT_INTEREST_CTA, formatEventLocation } from "@yunicity/utils";
import { MapPin } from "lucide-react";
import { useState } from "react";

import { FeedAuthorHeader } from "@/components/feed/feed-author-header";
import { FeedPublicationContextualCta } from "@/components/feed/feed-publication-actions";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import { formatFeedPostEventScheduleBadge } from "@/lib/feed/feed-event-badge";

export function EventFeedCard({
  post,
  currentUserId,
  onReport,
  onToggleEventInterest,
}: {
  post: FeedPost;
  currentUserId: string | null;
  onReport?: (reason: FeedReportReason) => Promise<void>;
  onToggleEventInterest?: () => Promise<void>;
}) {
  const meta = post.event;
  const [interestLoading, setInterestLoading] = useState(false);

  if (!meta) {
    return null;
  }

  const scheduleBadge = formatFeedPostEventScheduleBadge(meta.starts_at);
  // Le lieu de l'evenement, uniquement s'il est connu : `formatEventLocation`
  // concatenerait sinon une chaine vide avec la ville, et afficherait un lieu
  // qui n'existe pas.
  const lieu = meta.location_name?.trim() ? formatEventLocation(meta, post.city) : null;
  const eventInterested = meta.interested_by_me;

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
    <div data-feed-publication-event="" className="feed-publication-event-editorial -mx-5 -mt-5 sm:-mx-6 sm:-mt-6">
      {post.media_url ? (
        <div className="feed-publication-event-media">
          <FeedPublicationMedia mediaUrl={post.media_url} label={post.title ?? undefined} />
        </div>
      ) : null}

      <div className="feed-publication-event-body space-y-3 px-5 py-4 sm:px-6">
        {/*
          Qui publie — l'en-tete PARTAGE, pas une copie.
          Place sous le media pour conserver le visuel pleine largeur, et au-dessus
          du contenu : le lecteur sait de qui vient la publication avant de la lire.
          Il porte aussi le menu « Plus d'actions », qui etait auparavant superpose
          a l'image. Deux instances auraient fait deux menus sur une meme carte, et
          une carte sans media n'en avait aucun — donc rien a signaler.
        */}
        <FeedAuthorHeader post={post} currentUserId={currentUserId} onReport={onReport} />

        {scheduleBadge ? (
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
            {scheduleBadge}
          </span>
        ) : null}

        {post.title ? (
          <h3 className="text-lg font-bold leading-snug text-neutral-900">{post.title}</h3>
        ) : null}

        {/*
          LIEU DE L'EVENEMENT, pas contexte de publication.
          L'en-tete porte desormais « Quartier, Ville • il y a … » : reprendre ici
          `formatTerritorialLine` aurait affiche le meme quartier deux fois, a trois
          lignes d'intervalle. Cette ligne dit donc ou l'evenement a lieu — une
          information que l'en-tete ne porte pas. Absente si le lieu est inconnu :
          on n'invente pas une adresse.
        */}
        {lieu ? (
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{lieu}</span>
          </p>
        ) : null}

        {post.body ? (
          <p className="text-sm leading-relaxed text-neutral-700">{post.body}</p>
        ) : null}

        <div className="feed-publication-event-cta flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={interestLoading}
            onClick={() => void handleEventInterest()}
            aria-pressed={eventInterested}
            data-feed-publication-action="event-interest-primary"
            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              eventInterested
                ? "border-yunicity-primary bg-yunicity-primary-soft text-yunicity-primary"
                : "border-yunicity-primary text-yunicity-primary hover:bg-yunicity-primary-soft"
            }`}
          >
            {eventInterested ? FEED_ACTION_SAVED : FEED_EVENT_INTEREST_CTA}
          </button>
        </div>

        {/*
          Destinations — la zone PARTAGEE, conditionnee a une donnee reelle :
          « Voir l'evenement », le quartier, la carte. Chacune disparait si sa
          donnee manque, donc aucune destination fictive.

          Elle remplace un lien `event-bookmark` qui portait
          `aria-label="Enregistrer l'evenement"` et une icone marque-page, mais
          NAVIGUAIT vers `/events/…` : un libelle qui promettait une action que le
          controle n'executait pas, vers la meme page que « Voir l'evenement ».
          L'intention « enregistrer » est deja portee par le bouton d'interet, qui
          l'execute vraiment et expose `aria-pressed`.
        */}
        <FeedPublicationContextualCta post={post} />
      </div>
    </div>
  );
}
