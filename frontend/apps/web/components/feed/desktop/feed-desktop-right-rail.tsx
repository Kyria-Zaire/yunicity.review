"use client";

import type { LocalEvent, PartnerOfferPublic } from "@yunicity/types";
import { HOME_PRIVILEGE_TITLE } from "@yunicity/utils";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

import type { FeedPassportRailData } from "@/components/feed/feed-passport-module";
import { FeedPassportModule } from "@/components/feed/feed-passport-module";
import {
  formatFeedEventInterestLabel,
  formatFeedEventTime,
  resolveFeedEveningEventsTitle,
} from "@/lib/feed/feed-evening-events";
import { selectFeedRightRailEveningEvents } from "@/lib/feed/feed-right-rail-modules";

type FeedDesktopRightRailProps = {
  events: readonly LocalEvent[];
  city: string;
  highlightOffer: PartnerOfferPublic | null;
  passport: FeedPassportRailData;
  eventsLoading: boolean;
  eventsError: boolean;
  onRetryEvents: () => void;
};

function EveningEventRow({ event, time }: { event: LocalEvent; time: string | null }) {
  return (
    <li data-feed-desktop-evening-event="">
      <Link
        href={`/events/${event.id}`}
        className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
      >
        <div className="flex w-11 shrink-0 items-center justify-center self-stretch border-r border-neutral-200 pr-3">
          {time ? (
            <span className="text-sm font-bold leading-none tabular-nums text-orange-500">{time}</span>
          ) : (
            <span className="text-xs font-semibold text-neutral-400">—</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
            {event.title}
          </p>
          {event.location_name ? (
            <p className="mt-0.5 truncate text-xs text-neutral-500">{event.location_name}</p>
          ) : null}
          {typeof event.interest_count === "number" ? (
            <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-neutral-400">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{formatFeedEventInterestLabel(event.interest_count)}</span>
            </p>
          ) : null}
        </div>

        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic event cover
          <img
            src={event.cover_image_url}
            alt=""
            className="h-14 w-[4.5rem] shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-14 w-[4.5rem] shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-400"
            aria-hidden
          >
            {event.title.slice(0, 1).toUpperCase()}
          </div>
        )}
      </Link>
    </li>
  );
}

function TonightModule({
  events,
  city,
  loading,
  error,
  onRetry,
}: {
  events: readonly LocalEvent[];
  city: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const { events: displayEvents, mode } = selectFeedRightRailEveningEvents(events);

  const title = resolveFeedEveningEventsTitle(city, mode);

  // Quatre etats distincts (FEED-MAIN-LAYOUT-UIUX-01 §4). Sans cela le module
  // affirmait « Aucun evenement prevu » avant meme la fin de la requete, et une
  // panne reseau se lisait comme une soiree vide.
  const etat =
    loading && displayEvents.length === 0
      ? "loading"
      : error && displayEvents.length === 0
        ? "error"
        : displayEvents.length === 0
          ? "empty"
          : "loaded";

  return (
    <section className="feed-desktop-surface overflow-hidden" data-feed-desktop-tonight-module="">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        <Link href="/sortir" className="text-xs font-medium text-yunicity-primary hover:underline">
          Tout voir
        </Link>
      </div>

      {etat === "loading" ? (
        <div className="px-4 pb-4" aria-hidden="true">
          <div className="h-14 animate-pulse rounded-lg bg-neutral-100" />
        </div>
      ) : etat === "error" ? (
        <p className="px-4 pb-4 text-sm leading-relaxed text-neutral-500">
          Agenda momentanément indisponible.{" "}
          <button
            type="button"
            onClick={onRetry}
            className="font-medium text-yunicity-primary hover:underline"
          >
            Réessayer
          </button>
        </p>
      ) : etat === "empty" ? (
        <p className="px-4 pb-4 text-sm leading-relaxed text-neutral-500">
          Aucun événement prévu pour le moment.{" "}
          <Link href="/sortir" className="font-medium text-yunicity-primary hover:underline">
            Explorer Sortir
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
          {displayEvents.map((event) => (
            <EveningEventRow key={event.id} event={event} time={formatFeedEventTime(event)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LocalPrivilegeModule({ offer }: { offer: PartnerOfferPublic }) {
  return (
    <section className="feed-desktop-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900">{HOME_PRIVILEGE_TITLE}</h3>
        <Link href="/passport" className="text-xs font-medium text-yunicity-primary hover:underline">
          Voir l&apos;avantage
        </Link>
      </div>
      <Link
        href="/passport"
        className="group flex gap-3 rounded-lg p-1 transition-colors hover:bg-neutral-50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yunicity-primary-soft text-xs font-bold text-yunicity-primary">
          {offer.partner.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-yunicity-primary">{offer.partner.name}</p>
          <p className="truncate text-sm font-medium text-neutral-900 group-hover:text-yunicity-primary">
            {offer.title}
          </p>
          {offer.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{offer.description}</p>
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
      </Link>
    </section>
  );
}

function RailFooter() {
  return (
    <footer className="space-y-1 px-1 text-[11px] text-neutral-400">
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <Link href="/legal/conditions-generales" className="hover:text-neutral-600">
          Conditions générales
        </Link>
        <Link href="/legal/confidentialite" className="hover:text-neutral-600">
          Confidentialité
        </Link>
      </div>
      <p>© {new Date().getFullYear()} Yunicity</p>
    </footer>
  );
}

/**
 * Volet droit Desktop — FEED-MAIN-LAYOUT-UIUX-01.
 *
 * Ordre imposé par l'addendum : Passeport, puis Événements IMMÉDIATEMENT sous
 * le Passeport. Le privilège partenaire et le pied de rail suivent, sans jamais
 * s'intercaler entre les deux.
 *
 * Ce volet est la position principale de l'agenda Événements : la colonne
 * centrale ne le rend plus au-delà de 1024px (`.feed-editorial-evening-featured`
 * dans `globals.css`), sans quoi les mêmes `portalEvents` seraient présentés
 * deux fois, au même instant, sur le même écran.
 */
export function FeedDesktopRightRail({
  events,
  city,
  highlightOffer,
  passport,
  eventsLoading,
  eventsError,
  onRetryEvents,
}: FeedDesktopRightRailProps) {
  return (
    <aside className="feed-desktop-right-rail" aria-label="Contexte local">
      <div className="space-y-4">
        <div className="feed-desktop-passport-slot">
          <FeedPassportModule
            overview={passport.overview}
            challenges={passport.challenges}
            loading={passport.loading}
            error={passport.error}
          />
        </div>
        <TonightModule
          events={events}
          city={city}
          loading={eventsLoading}
          error={eventsError}
          onRetry={onRetryEvents}
        />
        {highlightOffer ? <LocalPrivilegeModule offer={highlightOffer} /> : null}
        <RailFooter />
      </div>
    </aside>
  );
}
