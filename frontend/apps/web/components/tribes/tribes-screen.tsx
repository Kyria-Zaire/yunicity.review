"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { TribeInvitationsSection } from "@/components/tribes/tribe-invitations-section";
import { LocalWeatherRailPanel } from "@/components/weather/local-weather-rail-panel";
import { WebAppShell } from "@/components/layout";
import { useTribesPortalContext } from "@/hooks/use-tribes-portal-context";
import {
  TRIBES_PORTAL_CARDS_SUBTITLE,
  TRIBES_PORTAL_CARDS_TITLE,
  TRIBES_PORTAL_FEATURED_BADGE,
  TRIBES_PORTAL_HERO_CTA_EXPLORE,
  TRIBES_PORTAL_HERO_CTA_MOMENTS,
  TRIBES_PORTAL_LIFE_EMPTY,
  TRIBES_PORTAL_LIFE_TITLE,
  TRIBES_PORTAL_MOMENTS_EMPTY,
  TRIBES_PORTAL_MOMENTS_TITLE,
  TRIBES_PORTAL_RAIL_NEARBY_EMPTY,
  TRIBES_PORTAL_RAIL_NEARBY_TITLE,
  TRIBES_PORTAL_RAIL_PASSPORT_TITLE,
  TRIBES_PORTAL_RAIL_TRANSIT_TITLE,
  TRIBES_PORTAL_SEARCH_PLACEHOLDER,
  TRIBES_PORTAL_STORY_SUBTITLE,
  TRIBES_PORTAL_STORY_TITLE,
  TRIBES_PORTAL_SUBTITLE,
  TRIBES_PORTAL_THEMES_TITLE,
  TRIBES_PORTAL_THEME_EMPTY,
  TRIBES_PORTAL_THEME_LABELS,
  TRIBES_PORTAL_TITLE,
  TRIBE_PORTAL_THEMES,
  TRIBES_EMPTY,
  TRIBES_ERROR,
  TRIBES_LOADING,
  TRIBES_RETRY,
  buildFeaturedTribe,
  buildPassportProgressionCopy,
  buildTribeEditorialStory,
  buildTribeLifeSlices,
  buildTribeMomentsTimeline,
  buildTribePortalCards,
  buildNearbyActiveTribes,
  filterTribePortalCardsByTheme,
  resolveTribeEditorialImage,
  tribePortalHasNoFakeMetrics,
  type TribePortalTheme,
} from "@yunicity/utils";
import { Bell, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

function passportLevelLabel(passportName: string | null | undefined): string {
  if (!passportName) return "NIVEAU CITOYEN";
  const match = passportName.match(/niveau\s*\d+/i);
  if (match?.[0]) return match[0].toUpperCase();
  return "NIVEAU CITOYEN";
}

function passportTitleLabel(passportName: string | null | undefined): string {
  if (!passportName) return "Habitant local";
  const cleaned = passportName.replace(/niveau\s*\d+/i, "").replace(/[-–—]/g, " ").trim();
  return cleaned || passportName.trim();
}

export function TribesScreen() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const themeParam = searchParams.get("theme")?.trim() ?? "";
  const context = useTribesPortalContext(cityParam);
  const selectedTheme = (TRIBE_PORTAL_THEMES.includes(themeParam as TribePortalTheme)
    ? (themeParam as TribePortalTheme)
    : "") as TribePortalTheme | "";

  const featuredTribe = useMemo(() => buildFeaturedTribe(context.tribes), [context.tribes]);
  const cards = useMemo(
    () =>
      buildTribePortalCards({
        city: context.city,
        tribes: context.tribes,
        neighborhoods: context.neighborhoods,
      }),
    [context.city, context.neighborhoods, context.tribes],
  );
  const filteredCards = useMemo(
    () => filterTribePortalCardsByTheme(cards, selectedTheme),
    [cards, selectedTheme],
  );
  const moments = useMemo(
    () =>
      buildTribeMomentsTimeline({
        city: context.city,
        tribes: context.tribes,
        events: context.events,
        maxItems: 4,
      }),
    [context.city, context.events, context.tribes],
  );
  const nearby = useMemo(
    () =>
      buildNearbyActiveTribes({
        city: context.city,
        tribes: context.tribes,
        neighborhoods: context.neighborhoods,
        maxItems: 3,
      }),
    [context.city, context.neighborhoods, context.tribes],
  );
  const story = useMemo(
    () =>
      buildTribeEditorialStory({
        city: context.city,
        featuredTribe,
        events: context.events,
        neighborhoods: context.neighborhoods,
        culturalPlaces: context.culturalPlaces,
      }),
    [context.city, context.culturalPlaces, context.events, context.neighborhoods, featuredTribe],
  );
  const lifeSlices = useMemo(
    () =>
      buildTribeLifeSlices({
        city: context.city,
        tribes: context.tribes,
        events: context.events,
        neighborhoods: context.neighborhoods,
        offers: context.offers,
        culturalPlaces: context.culturalPlaces,
        maxItems: 4,
      }),
    [context.city, context.culturalPlaces, context.events, context.neighborhoods, context.offers, context.tribes],
  );

  const editorialSafe = tribePortalHasNoFakeMetrics([
    ...cards.map((card) => card.description),
    story.body,
    buildPassportProgressionCopy(context.passport),
  ]);
  const passportScoreRaw =
    context.passport?.progression?.reputation_score ?? context.passport?.reputation_score ?? 0;
  const passportScore = Math.max(0, Math.min(100, Math.round(passportScoreRaw)));
  const passportLevel = passportLevelLabel(context.passport?.tier.name);
  const passportTitle = passportTitleLabel(context.passport?.tier.name);
  const passportProgress = buildPassportProgressionCopy(context.passport);

  function updateTheme(next: TribePortalTheme | "") {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("theme", next);
    else params.delete("theme");
    if (!params.get("city")) params.set("city", context.city);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <WebAppShell
      contentWidth="wide"
      context={
        <aside className="space-y-4">
          <LocalWeatherRailPanel city={context.city} lat={49.2583} lon={4.0317} />

          <WebContextPanel title={TRIBES_PORTAL_RAIL_PASSPORT_TITLE}>
            <div className="rounded-2xl bg-[#13161b] p-4 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold text-white">Passport Citoyen</p>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-white/80">
                  <Settings className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className="relative grid h-14 w-14 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#2A2FFF ${passportScore * 3.6}deg, rgba(255,255,255,0.16) 0deg)`,
                  }}
                  aria-label={`Score passport ${passportScore}`}
                >
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#13161b] text-base font-bold text-white">
                    {passportScore}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {passportLevel}
                  </p>
                  <p className="line-clamp-1 text-[2rem] font-bold leading-none text-white sm:text-[2.05rem]">
                    {passportTitle}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/80">{passportProgress}</p>
            </div>
          </WebContextPanel>

          <MapTransitNearby
            point={{ lat: 49.2583, lon: 4.0317, city: context.city }}
            title={TRIBES_PORTAL_RAIL_TRANSIT_TITLE}
          />

          <WebContextPanel title={TRIBES_PORTAL_RAIL_NEARBY_TITLE}>
            {nearby.length === 0 ? (
              <p className="text-sm text-neutral-500">{TRIBES_PORTAL_RAIL_NEARBY_EMPTY}</p>
            ) : (
              <ul className="space-y-2.5">
                {nearby.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 transition hover:bg-white"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                        <CulturalImage
                          src={item.imageUrl}
                          alt={item.name}
                          placeName={item.name}
                          className="h-full w-full"
                          sizes="40px"
                          showFallbackCaption={false}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{item.name}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{item.subtitle}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/tribes?city=${encodeURIComponent(context.city)}`}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
            >
              Voir toutes les tribus
            </Link>
          </WebContextPanel>
        </aside>
      }
    >
      <section className="mb-6 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
        <input
          type="search"
          placeholder={TRIBES_PORTAL_SEARCH_PLACEHOLDER}
          className="h-10 flex-1 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-yunicity-primary/40"
        />
        <Link
          href="/notifications"
          aria-label="Voir les notifications"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40"
        >
          <Bell className="h-4 w-4" />
        </Link>
        <Link
          href="/profile"
          aria-label="Paramètres"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <Link
          href="/profile"
          aria-label="Voir mon profil"
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-yunicity-primary/15 text-sm font-semibold text-yunicity-primary ring-1 ring-yunicity-primary/20 transition hover:bg-yunicity-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40"
        >
          U
        </Link>
      </section>

      <header className="mb-8 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{TRIBES_PORTAL_TITLE}</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:text-base">
              {TRIBES_PORTAL_SUBTITLE}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="#tribes-cards"
                className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
              >
                {TRIBES_PORTAL_HERO_CTA_EXPLORE}
              </a>
              <a
                href="#tribes-moments"
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-yunicity-primary/30 hover:text-yunicity-primary"
              >
                {TRIBES_PORTAL_HERO_CTA_MOMENTS}
              </a>
            </div>
          </div>

          <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900 text-white">
            <div className="relative h-52">
              <CulturalImage
                src={
                  featuredTribe
                    ? featuredTribe.cover_image_url || resolveTribeEditorialImage(featuredTribe)
                    : null
                }
                alt={featuredTribe?.name ?? "Tribu mise en avant"}
                placeName={featuredTribe?.name ?? "Tribu"}
                className="h-full w-full"
                sizes="(max-width: 1024px) 100vw, 420px"
                showFallbackCaption={false}
              />
              <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                {TRIBES_PORTAL_FEATURED_BADGE}
              </div>
            </div>
            {featuredTribe ? (
              <div className="p-4">
                <p className="text-sm font-semibold">{featuredTribe.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-white/80">{featuredTribe.description}</p>
              </div>
            ) : null}
          </article>
        </div>
        {!editorialSafe ? (
          <p className="border-t border-neutral-100 px-5 py-2 text-xs text-neutral-500">
            Mode éditorial prudent activé.
          </p>
        ) : null}
      </header>

      <TribeInvitationsSection />

      {context.loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-64 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50"
              aria-hidden
            />
          ))}
          <p className="sr-only">{TRIBES_LOADING}</p>
        </div>
      ) : null}

      {context.error ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">{TRIBES_ERROR}</p>
          <button
            type="button"
            onClick={() => void context.reload()}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {TRIBES_RETRY}
          </button>
        </div>
      ) : null}

      {!context.loading && !context.error && context.tribes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-yunicity-border bg-yunicity-surface px-6 py-8 text-neutral-600">
          {TRIBES_EMPTY}
        </p>
      ) : null}

      {!context.loading && !context.error && context.tribes.length > 0 ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-900">{TRIBES_PORTAL_THEMES_TITLE}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateTheme("")}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  selectedTheme === ""
                    ? "border-yunicity-primary bg-yunicity-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                Toutes
              </button>
              {TRIBE_PORTAL_THEMES.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => updateTheme(theme)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                    selectedTheme === theme
                      ? "border-yunicity-primary bg-yunicity-primary text-white"
                      : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  {TRIBES_PORTAL_THEME_LABELS[theme]}
                </button>
              ))}
            </div>
          </section>

          <section id="tribes-cards" className="space-y-4">
            <header>
              <h2 className="text-xl font-bold text-neutral-900">{TRIBES_PORTAL_CARDS_TITLE}</h2>
              <p className="mt-1 text-sm text-neutral-600">{TRIBES_PORTAL_CARDS_SUBTITLE}</p>
            </header>

            {filteredCards.length === 0 ? (
              <p className="text-sm text-neutral-500">{TRIBES_PORTAL_THEME_EMPTY}</p>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2">
                {filteredCards.map((card) => (
                  <li key={card.id}>
                    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md">
                      <div className="h-36">
                        <CulturalImage
                          src={card.imageUrl}
                          alt={card.name}
                          placeName={card.name}
                          className="h-full w-full"
                          sizes="(max-width: 768px) 100vw, 420px"
                          showFallbackCaption={false}
                        />
                      </div>
                      <div className="space-y-2 p-4">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">{card.neighborhoodLabel}</p>
                        <h3 className="text-lg font-bold text-neutral-900">{card.name}</h3>
                        <p className="line-clamp-2 text-sm text-neutral-600">{card.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {card.themeTags.map((tag) => (
                            <span
                              key={`${card.id}-${tag}`}
                              className="rounded-full border border-yunicity-primary/15 bg-yunicity-primary-soft/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yunicity-primary"
                            >
                              {TRIBES_PORTAL_THEME_LABELS[tag]}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={card.href}
                          className="inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
                        >
                          {card.cta}
                        </Link>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="tribes-moments" className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900">{TRIBES_PORTAL_MOMENTS_TITLE}</h2>
            {moments.length === 0 ? (
              <p className="text-sm text-neutral-500">{TRIBES_PORTAL_MOMENTS_EMPTY}</p>
            ) : (
              <ol className="space-y-3">
                {moments.map((moment) => (
                  <li key={moment.id} className="grid grid-cols-[4.5rem_1fr] gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="text-xs text-neutral-500">
                      <p className="font-semibold text-neutral-700">{moment.dateLabel}</p>
                      <p>{moment.hourLabel}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{moment.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {moment.place} · {moment.tribeName}
                      </p>
                      <Link href={moment.href} className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline">
                        Voir sur la carte
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{TRIBES_PORTAL_STORY_SUBTITLE}</p>
            <h2 className="text-xl font-bold text-neutral-900">{TRIBES_PORTAL_STORY_TITLE}</h2>
            <article className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">{story.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{story.body}</p>
                <p className="mt-2 text-xs text-neutral-500">Ancrage local : {story.anchorLabel}</p>
              </div>
              <div className="h-40 overflow-hidden rounded-2xl border border-neutral-200">
                <CulturalImage
                  src={story.imageUrl}
                  alt={story.title}
                  placeName={story.title}
                  className="h-full w-full"
                  sizes="(max-width: 1024px) 100vw, 360px"
                  showFallbackCaption={false}
                />
              </div>
            </article>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-900">{TRIBES_PORTAL_LIFE_TITLE}</h2>
            {lifeSlices.length === 0 ? (
              <p className="text-sm text-neutral-500">{TRIBES_PORTAL_LIFE_EMPTY}</p>
            ) : (
              <ul className="grid gap-3">
                {lifeSlices.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-300"
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{item.title}</p>
                      <p className="line-clamp-1 text-xs text-neutral-500">{item.subtitle}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </WebAppShell>
  );
}
