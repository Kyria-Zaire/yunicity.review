"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import { WebAppShell } from "@/components/layout";
import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { TribeActions } from "@/components/tribes/tribe-actions";
import { TribeMembersSection } from "@/components/tribes/tribe-members-section";
import { TribeModerationPanel } from "@/components/tribes/tribe-moderation-panel";
import { TribeWallSection } from "@/components/tribes/tribe-wall-section";
import { LocalWeatherRailPanel } from "@/components/weather/local-weather-rail-panel";
import { useTribeDetail } from "@/hooks/use-tribe-detail";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  TRIBE_ARCHIVED_BODY,
  TRIBE_ARCHIVED_TITLE,
  TRIBE_DETAIL_AGENDA_TITLE,
  TRIBE_DETAIL_CALM_EMPTY,
  TRIBE_DETAIL_FEED_TITLE,
  TRIBE_DETAIL_HABITS_TITLE,
  TRIBE_DETAIL_HERO_MOMENTS,
  TRIBE_DETAIL_HERO_SHARE,
  TRIBE_DETAIL_LIFESTYLE_TITLE,
  TRIBE_DETAIL_LIGHT_SPOTS_TITLE,
  TRIBE_DETAIL_MAP_CTA,
  TRIBE_DETAIL_MAP_TITLE,
  TRIBE_DETAIL_PORTRAITS_TITLE,
  TRIBE_DETAIL_RIGHT_RAIL_NEARBY_TRIBES,
  TRIBE_DETAIL_RIGHT_RAIL_NEIGHBORHOOD,
  TRIBE_DETAIL_RIGHT_RAIL_UPCOMING,
  TRIBE_DETAIL_STORY_TITLE,
  TRIBE_DETAIL_LOADING,
  TRIBE_NOT_FOUND,
  TRIBE_PRIVATE_BODY,
  TRIBE_PRIVATE_TITLE,
  TRIBES_PORTAL_RAIL_PASSPORT_TITLE,
  TRIBES_PORTAL_RAIL_TRANSIT_TITLE,
  TRIBES_RETRY,
  buildRelatedNeighborhoodLinks,
  buildTribeAgenda,
  buildTribeBadgeLabel,
  buildTribeDetailTagline,
  buildTribeHabits,
  buildTribeLightSpots,
  buildTribeLifestyleSlices,
  buildTribeMapHref,
  buildTribeMomentsHref,
  buildTribeNarrative,
  buildTribePortraits,
  buildTribeShareText,
  buildPassportProgressionCopy,
  resolveTribeHeroImage,
  tribeCategoryLabel,
  tribeDetailHasNoFakeMetrics,
  tribeVisibilityLabel,
} from "@yunicity/utils";
import Link from "next/link";
import { useState } from "react";

export function TribeDetailScreen({ slug, city }: { slug: string; city: string }) {
  const { isAuthenticated } = useAuth();
  const [shareCopied, setShareCopied] = useState(false);
  const {
    tribe,
    loading,
    error,
    events,
    neighborhoods,
    places,
    offers,
    passport,
    members,
    relatedTribes,
    actionError,
    joining,
    leaving,
    reload,
    join,
    leave,
  } = useTribeDetail(slug, city);

  if (loading) {
    return (
      <WebAppShell contentWidth="wide">
        <p className="text-neutral-500">{TRIBE_DETAIL_LOADING}</p>
      </WebAppShell>
    );
  }

  if (error || !tribe) {
    return (
      <WebAppShell contentWidth="readable">
        <p className="text-neutral-700">{error ?? TRIBE_NOT_FOUND}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
        >
          {TRIBES_RETRY}
        </button>
      </WebAppShell>
    );
  }

  const showPrivateGate =
    tribe.visibility === "private_invite" && !tribe.viewer_is_member && !tribe.is_archived;
  const currentTribe = tribe;
  const heroImage = resolveTribeHeroImage(currentTribe);
  const tagline = buildTribeDetailTagline(currentTribe, neighborhoods);
  const narrative = buildTribeNarrative({ tribe: currentTribe, events, places, neighborhoods });
  const habits = buildTribeHabits({ city, tribe: currentTribe, places, neighborhoods, events });
  const lightSpots = buildTribeLightSpots({ places, events });
  const agenda = buildTribeAgenda({ tribe: currentTribe, events, city });
  const portraits = buildTribePortraits({ tribe: currentTribe, members, neighborhoods, places });
  const lifestyle = buildTribeLifestyleSlices({ city, tribe: currentTribe, events, places, offers });
  const mapHref = buildTribeMapHref(currentTribe.slug, city);
  const momentsHref = buildTribeMomentsHref(currentTribe.slug, city);
  const relatedNeighborhoods = buildRelatedNeighborhoodLinks(currentTribe, neighborhoods);
  const editorialSafe = tribeDetailHasNoFakeMetrics([
    tagline,
    narrative,
    ...portraits.map((item) => item.story),
  ]);
  const topRightRailEvents = agenda.slice(0, 3);

  async function shareTribe() {
    const text = buildTribeShareText(currentTribe);
    const url = `${window.location.origin}/tribes/${encodeURIComponent(currentTribe.slug)}?city=${encodeURIComponent(city)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentTribe.name, text, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1500);
  }

  return (
    <WebAppShell
      contentWidth="wide"
      context={
        <aside className="space-y-4">
          <LocalWeatherRailPanel city={city} />
          <MapTransitNearby point={{ lat: 49.2583, lon: 4.0317, city }} title={TRIBES_PORTAL_RAIL_TRANSIT_TITLE} />
          <WebContextPanel title={TRIBE_DETAIL_RIGHT_RAIL_UPCOMING}>
            {topRightRailEvents.length === 0 ? (
              <p className="text-sm text-neutral-500">{TRIBE_DETAIL_CALM_EMPTY}</p>
            ) : (
              <ul className="space-y-2">
                {topRightRailEvents.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 hover:bg-white">
                      <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{item.dateLabel}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </WebContextPanel>
          <WebContextPanel title={TRIBE_DETAIL_RIGHT_RAIL_NEARBY_TRIBES}>
            {relatedTribes.length === 0 ? (
              <p className="text-sm text-neutral-500">Les cercles voisins apparaissent progressivement.</p>
            ) : (
              <ul className="space-y-2">
                {relatedTribes.map((item) => (
                  <li key={item.id}>
                    <Link href={`/tribes/${encodeURIComponent(item.slug)}?city=${encodeURIComponent(city)}`} className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 hover:bg-white">
                      <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{tribeCategoryLabel(item.category)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </WebContextPanel>
          <WebContextPanel title={TRIBES_PORTAL_RAIL_PASSPORT_TITLE}>
            <p className="text-sm text-neutral-700">
              {buildPassportProgressionCopy(passport)}
            </p>
            <Link href="/passport" className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline">
              Ouvrir mon Passport
            </Link>
          </WebContextPanel>
          <WebContextPanel title={TRIBE_DETAIL_RIGHT_RAIL_NEIGHBORHOOD}>
            {relatedNeighborhoods.length === 0 ? (
              <p className="text-sm text-neutral-500">Ancrage de quartier en cours de définition.</p>
            ) : (
              <ul className="space-y-2">
                {relatedNeighborhoods.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm font-medium text-yunicity-primary hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </WebContextPanel>
        </aside>
      }
    >
      <header className="mb-8 overflow-hidden rounded-3xl border border-neutral-200 bg-[#0f172a] text-white">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
              {buildTribeBadgeLabel(tribe)}
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{currentTribe.name}</h1>
            <p className="mt-2 text-sm text-white/75">
              {currentTribe.city} · {tribeCategoryLabel(currentTribe.category)} · {tribeVisibilityLabel(currentTribe.visibility)}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90">{tagline}</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">{currentTribe.description}</p>
            <div className="mt-4 flex -space-x-2">
              {portraits.slice(0, 3).map((portrait) => (
                <span
                  key={portrait.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/15 text-xs font-semibold"
                >
                  {portrait.name.slice(0, 1)}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#actions-tribu"
                className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
              >
                {TRIBE_DETAIL_HERO_MOMENTS}
              </a>
              <Link
                href={momentsHref}
                className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                Voir les moments
              </Link>
              <button
                type="button"
                onClick={() => void shareTribe()}
                className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                {shareCopied ? "Lien copié" : TRIBE_DETAIL_HERO_SHARE}
              </button>
            </div>
            <div id="actions-tribu" className="mt-5">
              {!currentTribe.is_archived && !showPrivateGate ? (
                <TribeActions
                  tribe={currentTribe}
                  joining={joining}
                  leaving={leaving}
                  actionError={actionError}
                  onJoin={async (accepted) => {
                    await join(accepted);
                  }}
                  onLeave={leave}
                  isAuthenticated={isAuthenticated}
                />
              ) : null}
            </div>
          </div>
          <div className="h-60 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/60">
            <CulturalImage
              src={heroImage}
              alt={currentTribe.name}
              placeName={currentTribe.name}
              className="h-full w-full"
              sizes="(max-width: 1024px) 100vw, 500px"
              showFallbackCaption={false}
            />
          </div>
        </div>
      </header>

      {!editorialSafe ? (
        <p className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600">
          Mode éditorial prudent activé.
        </p>
      ) : null}

      {tribe.is_archived ? (
        <div className="mb-8 rounded-xl border border-dashed border-yunicity-border bg-yunicity-surface px-6 py-8">
          <h2 className="font-semibold text-neutral-900">{TRIBE_ARCHIVED_TITLE}</h2>
          <p className="mt-2 text-sm text-neutral-600">{TRIBE_ARCHIVED_BODY}</p>
        </div>
      ) : null}

      {showPrivateGate ? (
        <div className="mb-8 rounded-xl border border-dashed border-yunicity-border bg-yunicity-surface px-6 py-8">
          <h2 className="font-semibold text-neutral-900">{TRIBE_PRIVATE_TITLE}</h2>
          <p className="mt-2 text-sm text-neutral-600">{TRIBE_PRIVATE_BODY}</p>
        </div>
      ) : null}

      {!showPrivateGate ? (
        <>
          <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold text-neutral-900">{TRIBE_DETAIL_STORY_TITLE}</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{narrative}</p>
          </section>

          <section className="mb-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-neutral-900">{TRIBE_DETAIL_HABITS_TITLE}</h2>
              {habits.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-500">{TRIBE_DETAIL_CALM_EMPTY}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {habits.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 hover:bg-white">
                        <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{item.title}</p>
                        <p className="line-clamp-1 text-xs text-neutral-500">{item.subtitle}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white">
              <h2 className="text-lg font-semibold text-white">{TRIBE_DETAIL_LIGHT_SPOTS_TITLE}</h2>
              {lightSpots.length === 0 ? (
                <p className="mt-3 text-sm text-slate-300">{TRIBE_DETAIL_CALM_EMPTY}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {lightSpots.map((item) => (
                    <li key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-300">{item.timeLabel} · {item.mood}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <section id="agenda-tribu" className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold text-neutral-900">{TRIBE_DETAIL_AGENDA_TITLE}</h2>
            {agenda.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">{TRIBE_DETAIL_CALM_EMPTY}</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {agenda.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 hover:bg-white">
                      <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{item.title}</p>
                      <p className="text-xs text-neutral-500">{item.dateLabel}</p>
                      <p className="text-xs text-neutral-500">{item.place}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold text-neutral-900">{TRIBE_DETAIL_FEED_TITLE}</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Un flux de proximité pour partager des moments simples, sans pression sociale.
            </p>
            <div className="mt-5">
              <TribeWallSection tribe={tribe} city={city} />
            </div>
          </section>

          <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold text-neutral-900">{TRIBE_DETAIL_PORTRAITS_TITLE}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {portraits.map((portrait) => (
                <article key={portrait.id} className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4">
                  <p className="text-sm font-semibold text-neutral-900">{portrait.name}</p>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-600">{portrait.story}</p>
                  <button type="button" className="mt-3 text-xs font-semibold text-yunicity-primary hover:underline">
                    {portrait.cta}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold text-neutral-900">{TRIBE_DETAIL_LIFESTYLE_TITLE}</h2>
            {lifestyle.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">{TRIBE_DETAIL_CALM_EMPTY}</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {lifestyle.map((slice) => (
                  <Link key={slice.id} href={slice.href} className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50/80 hover:bg-white">
                    <div className="h-28">
                      <CulturalImage
                        src={slice.imageUrl}
                        alt={slice.title}
                        placeName={slice.title}
                        className="h-full w-full"
                        sizes="(max-width: 768px) 100vw, 460px"
                        showFallbackCaption={false}
                      />
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{slice.title}</p>
                      <p className="line-clamp-1 text-xs text-neutral-500">{slice.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold text-neutral-900">{TRIBE_DETAIL_MAP_TITLE}</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Ce cercle vit entre quartiers, cafés et lieux culturels de {city}.
            </p>
            <div className="mt-4">
              <Link href={mapHref} className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover">
                {TRIBE_DETAIL_MAP_CTA}
              </Link>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {relatedNeighborhoods.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <TribeModerationPanel tribe={tribe} city={city} />
          <TribeMembersSection tribe={tribe} city={city} />
        </>
      ) : null}
    </WebAppShell>
  );
}
