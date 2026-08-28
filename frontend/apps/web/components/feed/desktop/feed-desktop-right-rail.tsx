"use client";

import type { LocalEvent, PassportChallengeResponse, PassportTierCode, PartnerOfferPublic } from "@yunicity/types";
import {
  FEED_PORTAL_PASSPORT_CONTINUE,
  HOME_PRIVILEGE_TITLE,
  PASSPORT_TIER_LABELS,
} from "@yunicity/utils";
import { BookMarked, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

import { usePassportFeedRail } from "@/hooks/use-passport-feed-rail";
import { useVisibleActivation } from "@/hooks/use-visible-activation";
import { selectFeedRightRailEveningEvents } from "@/lib/feed/feed-right-rail-modules";

type FeedDesktopRightRailProps = {
  events: readonly LocalEvent[];
  city: string;
  highlightOffer: PartnerOfferPublic | null;
};

function formatEventTime(event: LocalEvent): string | null {
  const instant = new Date(event.starts_at);
  if (Number.isNaN(instant.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: event.timezone || undefined,
      hour: "2-digit",
      minute: "2-digit",
    }).format(instant);
  } catch {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(instant);
  }
}

function selectPrimaryChallenge(
  active: PassportChallengeResponse[] | undefined,
): PassportChallengeResponse | null {
  if (!active?.length) return null;
  const inProgress = active.find((challenge) => !challenge.completed && challenge.target > 0);
  return inProgress ?? active[0] ?? null;
}

function PassportProgressRing({ progress, target }: { progress: number; target: number }) {
  const safeTarget = Math.max(target, 1);
  const ratio = Math.min(Math.max(progress / safeTarget, 0), 1);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="relative h-[5.5rem] w-[5.5rem] shrink-0" aria-hidden="true">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-yunicity-primary transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <BookMarked className="h-7 w-7 text-yunicity-primary" strokeWidth={1.75} />
      </div>
    </div>
  );
}

function formatEventInterestLabel(count: number): string {
  return `${count} intéressé${count > 1 ? "s" : ""}`;
}

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
              <span className="truncate">{formatEventInterestLabel(event.interest_count)}</span>
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

function TonightModule({ events, city }: { events: readonly LocalEvent[]; city: string }) {
  const { events: displayEvents, mode } = selectFeedRightRailEveningEvents(events);

  const title =
    mode === "tonight"
      ? `Ce soir à ${city}`
      : mode === "upcoming-evening"
        ? `Prochaines soirées à ${city}`
        : `À venir à ${city}`;

  return (
    <section className="feed-desktop-surface overflow-hidden" data-feed-desktop-tonight-module="">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        <Link href="/sortir" className="text-xs font-medium text-yunicity-primary hover:underline">
          Tout voir
        </Link>
      </div>

      {displayEvents.length === 0 ? (
        <p className="px-4 pb-4 text-sm leading-relaxed text-neutral-500">
          Aucun événement prévu pour le moment.{" "}
          <Link href="/sortir" className="font-medium text-yunicity-primary hover:underline">
            Explorer Sortir
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
          {displayEvents.map((event) => (
            <EveningEventRow key={event.id} event={event} time={formatEventTime(event)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PassportModule() {
  const { ref, activated } = useVisibleActivation<HTMLDivElement>();
  const { overview, challenges, loading, error } = usePassportFeedRail();

  return (
    <div ref={ref} className="feed-desktop-passport-slot">
      <section className="feed-desktop-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">Votre Passport local</h3>
          <Link href="/passport" className="text-xs font-medium text-yunicity-primary hover:underline">
            Ouvrir
          </Link>
        </div>
        {!activated || loading ? (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-16 animate-pulse rounded-xl bg-neutral-100" />
          </div>
        ) : error || !overview ? (
          <p className="text-xs text-neutral-400">Passport indisponible</p>
        ) : (
          <PassportLoadedContent overview={overview} challenges={challenges?.active} />
        )}
      </section>
    </div>
  );
}

function PassportLoadedContent({
  overview,
  challenges,
}: {
  overview: NonNullable<ReturnType<typeof usePassportFeedRail>["overview"]>;
  challenges: PassportChallengeResponse[] | undefined;
}) {
  const { summary } = overview;
  const tierCode = summary.passport_tier;
  const tierLabel =
    tierCode && tierCode in PASSPORT_TIER_LABELS
      ? PASSPORT_TIER_LABELS[tierCode as PassportTierCode]
      : null;

  const primaryChallenge = selectPrimaryChallenge(challenges);
  const hasChallengeProgress =
    primaryChallenge != null && primaryChallenge.target > 0 && !primaryChallenge.completed;

  return (
    <div data-feed-passport-state="loaded" className="space-y-4">
      <div className="flex items-center gap-4">
        {hasChallengeProgress ? (
          <PassportProgressRing
            progress={primaryChallenge.progress}
            target={primaryChallenge.target}
          />
        ) : (
          <div className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft">
            <BookMarked className="h-7 w-7 text-yunicity-primary" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {tierLabel ? (
            <p className="text-sm font-semibold text-yunicity-primary">Niveau {tierLabel}</p>
          ) : null}
          {hasChallengeProgress ? (
            <>
              <p className="mt-0.5 text-base font-bold text-neutral-900">
                {primaryChallenge.progress} / {primaryChallenge.target} découvertes
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                {primaryChallenge.description || primaryChallenge.name}
              </p>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-base font-bold text-neutral-900">
                {summary.earned_badges} badge{summary.earned_badges !== 1 ? "s" : ""} obtenu
                {summary.earned_badges !== 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Continuez à explorer votre ville et ses pépites.
              </p>
            </>
          )}
        </div>
      </div>

      <Link
        href="/passport"
        className="inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        {FEED_PORTAL_PASSPORT_CONTINUE}
      </Link>
    </div>
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

export function FeedDesktopRightRail({
  events,
  city,
  highlightOffer,
}: FeedDesktopRightRailProps) {
  return (
    <aside className="feed-desktop-right-rail" aria-label="Contexte local">
      <div className="space-y-4">
        <TonightModule events={events} city={city} />
        <PassportModule />
        {highlightOffer ? <LocalPrivilegeModule offer={highlightOffer} /> : null}
        <RailFooter />
      </div>
    </aside>
  );
}
