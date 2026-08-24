"use client";

import type { FeedReportReason } from "@yunicity/types";
import type { FeedPortalView } from "@yunicity/utils";
import {
  FEED_LOAD_MORE_LABEL,
  FEED_MEDIUM_STORIES_TITLE,
  FEED_PORTAL_FOR_YOU_HINT,
  FEED_PORTAL_POPULAR_HINT,
  PROFILE_INTERESTS,
  buildFeedHighlightEvents,
  buildFeedStoryShortcuts,
  buildFeedTrendItems,
  buildFeedTribeActivityItems,
  filterFeedPostsByView,
  filterFeedPostsContributions,
  filterFeedPostsDiscussions,
} from "@yunicity/utils";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { FeedCard } from "@/components/feed/feed-card";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedEmptyState } from "@/components/feed/feed-empty-state";
import { FeedErrorState } from "@/components/feed/feed-error-state";
import { FeedLoadingState } from "@/components/feed/feed-loading-state";
import { FeedAppShell } from "@/components/feed/portal/feed-app-shell";
import { FeedLeftRail } from "@/components/feed/portal/feed-left-rail";
import { FeedRightRail } from "@/components/feed/portal/feed-right-rail";
import { FeedSavedEventsPanel } from "@/components/feed/portal/feed-saved-events-panel";
import { FeedStoriesRail } from "@/components/feed/portal/feed-stories-rail";
import { FeedVideoStreamItem } from "@/components/feed/portal/feed-video-stream-item";
import { FeedMediumHeader } from "@/components/feed/portal/feed-medium-header";
import { FeedMediumFilterSheet } from "@/components/feed/portal/feed-medium-filter-sheet";
import { FeedViewTabs } from "@/components/feed/portal/feed-view-tabs";
import {
  FeedMobileComposer,
  FeedMobileHeader,
  FeedMobileStoriesRail,
} from "@/components/feed/mobile";
import { LocalVideoTeaserRail } from "@/components/videos/local-video-teaser-rail";
import { useLocalVideoTeasers } from "@/hooks/use-local-video-teasers";
import { buildFeedStream, type FeedStreamItem } from "@/lib/feed/feed-stream";
import { LOCAL_VIDEO_TEASER_SECTION_FEED } from "@yunicity/utils";
import { FEED_MOBILE_CONTENT_PADDING_CLASS } from "@/lib/layout/feed-mobile-full-bleed";
import {
  isFeedMediumInterestFilterActive,
  resetFeedMediumFilterActivation,
} from "@/lib/layout/feed-medium-filter-contract";
import { useFeed } from "@/hooks/use-feed";
import { useFeedPortalContext } from "@/hooks/use-feed-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

type FeedLeftNav =
  | FeedPortalView
  | "home"
  | "discussions"
  | "stories"
  | "contributions"
  | "saved"
  | "subscriptions"
  | "nearby"
  | null;

export function FeedPortalScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const portal = useFeedPortalContext();
  const feed = useFeed();
  const composerRef = useRef<HTMLDivElement>(null);

  const [activeView, setActiveView] = useState<FeedPortalView>("for_you");
  const [leftNav, setLeftNav] = useState<FeedLeftNav>(null);
  /** Activation du filtre centres d'intérêt (application immédiate historique). */
  const [interestFilterActive, setInterestFilterActive] = useState(false);
  /** Surface Sheet medium uniquement (640–1279). */
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);

  const {
    loadInitial,
    refresh,
    loadMore,
    items,
    isLoading,
    error,
    nextCursor,
    isLoadingMore,
    createPost,
    toggleLike,
  } = feed;

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const city = portal.city || user?.city || "Reims";
  const interests = useMemo(() => {
    const fromProfile = portal.profile?.interests ?? [];
    return fromProfile.filter((i): i is (typeof PROFILE_INTERESTS)[number] =>
      (PROFILE_INTERESTS as readonly string[]).includes(i),
    );
  }, [portal.profile?.interests]);

  // C3-FEED-M7-R2 : UN SEUL appel a `listLocalVideos`. La donnee alimente a la
  // fois la publication video du flux medium et la section historique desktop.
  const videoTeasers = useLocalVideoTeasers({ city, filter: { kind: "city" } });
  const streamVideo = videoTeasers.items[0] ?? null;

  const stories = useMemo(
    () =>
      buildFeedStoryShortcuts({
        city,
        profile: portal.profile,
        tribes: portal.tribes,
        events: portal.events,
        culturalPlaces: portal.culturalPlaces,
        storyRings: portal.storyRings,
      }),
    [city, portal.culturalPlaces, portal.events, portal.profile, portal.storyRings, portal.tribes],
  );

  const tribeActivity = useMemo(
    () =>
      buildFeedTribeActivityItems({
        city,
        tribes: portal.tribes,
        events: portal.events,
      }),
    [city, portal.events, portal.tribes],
  );

  const highlights = useMemo(
    () =>
      buildFeedHighlightEvents({
        city,
        events: portal.events,
        culturalPlaces: portal.culturalPlaces,
      }),
    [city, portal.culturalPlaces, portal.events],
  );

  const trends = useMemo(
    () =>
      buildFeedTrendItems({
        city,
        events: portal.events,
        culturalPlaces: portal.culturalPlaces,
        neighborhoods: portal.neighborhoods,
        tribes: portal.tribes,
      }),
    [city, portal.culturalPlaces, portal.events, portal.neighborhoods, portal.tribes],
  );

  const displayedPosts = useMemo(() => {
    if (leftNav === "discussions") return filterFeedPostsDiscussions(items);
    if (leftNav === "contributions") {
      return filterFeedPostsContributions(items, user?.id ?? null);
    }
    if (leftNav === "saved") return [];
    const interestFilter =
      activeView === "for_you" &&
      isFeedMediumInterestFilterActive({
        activated: interestFilterActive,
        interests,
      })
        ? interests
        : [];
    return filterFeedPostsByView(items, activeView, {
      interests: interestFilter,
      userId: user?.id ?? null,
    });
  }, [activeView, interestFilterActive, interests, items, leftNav, user?.id]);

  /* C3-FEED-M7-R2 : la video locale rejoint la MEME liste que les publications.
     Fonction pure sur la liste complete -> une seule insertion, jamais une par
     page apres « charger plus ». */
  const mediumStream = useMemo(
    () => buildFeedStream(displayedPosts, streamVideo, activeView),
    [displayedPosts, streamVideo, activeView],
  );

  const viewHint =
    activeView === "for_you" &&
    !leftNav &&
    isFeedMediumInterestFilterActive({ activated: interestFilterActive, interests })
      ? FEED_PORTAL_FOR_YOU_HINT
      : activeView === "popular" && !leftNav
        ? FEED_PORTAL_POPULAR_HINT
        : null;

  const filterHint =
    isFeedMediumInterestFilterActive({ activated: interestFilterActive, interests }) ? (
      <>
        Filtre actif selon vos centres d&apos;intérêt : {interests.slice(0, 4).join(", ")}
        {interests.length > 4 ? "…" : ""}
      </>
    ) : interestFilterActive && interests.length === 0 ? (
      <>
        Ajoutez vos centres d&apos;intérêt dans les{" "}
        <Link href="/settings" className="font-semibold text-yunicity-primary hover:underline">
          paramètres
        </Link>{" "}
        pour activer le filtrage.
      </>
    ) : null;

  function openMediumFilter(trigger: HTMLButtonElement) {
    filterTriggerRef.current = trigger;
    if (filterPanelOpen) {
      setFilterPanelOpen(false);
      return;
    }
    setInterestFilterActive(true);
    setFilterPanelOpen(true);
  }

  function resetInterestFilter() {
    setInterestFilterActive(resetFeedMediumFilterActivation());
    setFilterPanelOpen(false);
  }

  const rightRail = (
    <FeedRightRail
      city={city}
      tribes={tribeActivity}
      highlights={highlights}
      trends={trends}
      highlightOffer={portal.highlightOffer}
      loading={portal.loading}
    />
  );

  async function handleCreate(body: string, mediaUrl?: string | null) {
    await createPost(body, mediaUrl);
  }

  async function handleReport(postId: string, reason: FeedReportReason) {
    await api.reportFeedPost(postId, { reason });
    setReportMessage("Merci — votre signalement a été transmis à l'équipe.");
    setTimeout(() => setReportMessage(null), 4000);
  }

  function handleLeftNavSelect(nav: FeedLeftNav) {
    if (nav === "for_you" || nav === "recent" || nav === "popular") {
      setActiveView(nav);
      setLeftNav(null);
      return;
    }
    setLeftNav(nav);
  }

  const feedStates = (
    <>
      {viewHint ? (
        <p className={`text-xs leading-relaxed text-neutral-500 ${FEED_MOBILE_CONTENT_PADDING_CLASS}`}>
          {viewHint}
        </p>
      ) : null}

      {reportMessage ? (
        <div className={FEED_MOBILE_CONTENT_PADDING_CLASS}>
          <p className="rounded-xl bg-yunicity-primary-soft px-4 py-3 text-sm text-yunicity-primary">
            {reportMessage}
          </p>
        </div>
      ) : null}

      {isLoading ? (
        <div className={FEED_MOBILE_CONTENT_PADDING_CLASS}>
          <FeedLoadingState />
        </div>
      ) : null}
      {!isLoading && error ? (
        <div className={FEED_MOBILE_CONTENT_PADDING_CLASS}>
          <FeedErrorState onRetry={() => void refresh()} />
        </div>
      ) : null}

      {!isLoading && !error && leftNav === "saved" ? (
        <div className={FEED_MOBILE_CONTENT_PADDING_CLASS}>
          <FeedSavedEventsPanel events={portal.savedEvents} city={city} />
        </div>
      ) : null}

      {!isLoading && !error && leftNav !== "saved" && displayedPosts.length === 0 ? (
        interestFilterActive && items.length > 0 ? (
          <div
            data-feed-medium-surface="primary"
            className={`rounded-2xl border border-dashed border-yunicity-border bg-white p-8 text-center shadow-sm ${FEED_MOBILE_CONTENT_PADDING_CLASS}`}
          >
            <p className="text-base font-semibold text-neutral-900">
              Aucune publication ne correspond à vos centres d&apos;intérêt
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
              Désactivez le filtre ou ajustez vos préférences pour voir plus de contenu local.
            </p>
            <button
              type="button"
              onClick={() => setInterestFilterActive(false)}
              className="mt-4 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Désactiver le filtre
            </button>
          </div>
        ) : (
          <div className={FEED_MOBILE_CONTENT_PADDING_CLASS}>
            <FeedEmptyState city={city} highlights={highlights} />
          </div>
        )
      ) : null}

      {/* C3.1-R1D : liste bord à bord — aucun retrait latéral, séparation par
          l'espacement discret sur le fond gris du shell. */}
      {!isLoading && !error && leftNav !== "saved" && displayedPosts.length > 0 ? (
        <ul className="space-y-2" aria-label="Publications du fil local">
          {displayedPosts.map((post) => (
            <li key={post.id}>
              <FeedCard
                post={post}
                layout="mobile"
                onToggleLike={toggleLike}
                onReport={handleReport}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {nextCursor && !isLoading && !error && leftNav !== "saved" ? (
        <div className={`flex justify-center pb-2 ${FEED_MOBILE_CONTENT_PADDING_CLASS}`}>
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={() => void loadMore()}
            className="rounded-full border border-yunicity-border bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            {isLoadingMore ? "Chargement…" : FEED_LOAD_MORE_LABEL}
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <FeedAppShell rightRail={rightRail}>
      <div className="web-mobile-feed-only min-w-0 flex-1 space-y-4 pt-1">
        <FeedMobileHeader />
        <div className={`space-y-4 ${FEED_MOBILE_CONTENT_PADDING_CLASS}`}>
          <FeedMobileComposer city={city} onSubmit={handleCreate} />
          <FeedMobileStoriesRail
            profile={portal.profile}
            storyRings={portal.storyRings}
            storyShortcuts={stories}
          />
          {/* C3.1-R1L : la rangee de pills « Pour vous / Abonnements / Pres de moi »
              etait un heritage de l'ecran actuel, absente de la maquette mobile
              canonique. « Abonnements » et « Pres de moi » etaient de surcroit des
              LIENS vers /subscriptions et /map, sans aucun contrat de fil derriere
              (GET /feed n'accepte que cursor+limit). Rangee retiree du mobile ;
              elle n'est PAS remplacee par les onglets medium/desktop. La navigation
              contextuelle mobile viendra avec la reconstruction visuelle. */}
          {interestFilterActive ? (
            <p className="rounded-xl bg-white px-3 py-2.5 text-xs text-neutral-500 ring-1 ring-neutral-200/90">
              {filterHint}
            </p>
          ) : null}
        </div>
        {feedStates}
      </div>

      <div className="web-feed-desktop-contents">
      <FeedLeftRail
        activeView={activeView}
        leftNav={leftNav}
        onNavSelect={handleLeftNavSelect}
        interests={interests}
      />

      {/* `feed-medium-column` : identite stable de la colonne de contenu Feed.
          C3-FEED-M3.3 s'y appuie pour aplatir les GRANDES surfaces sans jamais
          pouvoir atteindre les cartes internes, plus profondes. */}
      <div className="feed-medium-column feed-medium-editorial-grid min-w-0 flex-1">
        {/* C3-FEED-M3 : header de contenu propre a la bande medium. Il ne se
            rend qu'entre 640 et 1279.98px (classe `.feed-medium-header`), et
            reste sticky en haut de la colonne. */}
        <FeedMediumHeader
          city={city}
          filterPanelOpen={filterPanelOpen}
          filterActive={isFeedMediumInterestFilterActive({
            activated: interestFilterActive,
            interests,
          })}
          onOpenFilter={openMediumFilter}
          filterButtonRef={filterTriggerRef}
        />
        <FeedMediumFilterSheet
          open={filterPanelOpen}
          onOpenChange={setFilterPanelOpen}
          activated={interestFilterActive}
          interests={interests}
          onReset={resetInterestFilter}
          returnFocusRef={filterTriggerRef}
        />
        <div
          data-feed-medium-region="stories"
          data-feed-medium-surface="primary"
          className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
        >
          <div className="border-b border-neutral-100 px-4 py-5 sm:px-6">
            {/* C3-FEED-M5 : la region Stories n'avait aucun titre. Il n'est rendu
                QUE dans la bande medium (`.feed-medium-stories-title`) : le
                desktop >= 1280 et la page /stories partagent ce meme rail et
                conservent leur propre en-tete. */}
            <h2
              data-feed-medium-stories-title=""
              className="feed-medium-stories-title text-sm font-bold text-neutral-900"
            >
              {FEED_MEDIUM_STORIES_TITLE}
            </h2>
            <FeedStoriesRail items={stories} seeAllHref="/stories" />
          </div>
          <div className="px-4 sm:px-6">
            <FeedViewTabs
              activeView={activeView}
              onViewChange={(view) => {
                setLeftNav(null);
                setActiveView(view);
                setFilterPanelOpen(false);
              }}
              filterOpen={interestFilterActive}
              onToggleFilter={() => setInterestFilterActive((v) => !v)}
            />
          </div>
          {interestFilterActive && filterHint ? (
            <p className="feed-legacy-filter-banner border-b border-neutral-100 px-4 py-3 text-xs text-neutral-500 sm:px-6">
              {filterHint}
            </p>
          ) : null}
        </div>

        <div
          id="feed-composer"
          ref={composerRef}
          data-feed-medium-region="composer"
          className="mt-5 scroll-mt-28"
        >
          <div
            data-feed-medium-surface="primary"
            className="rounded-2xl border border-neutral-200/90 bg-white px-4 shadow-sm sm:px-5"
          >
            <FeedComposer city={city} onSubmit={handleCreate} />
          </div>
        </div>

        {!leftNav ? (
          <div data-feed-desktop-video-section="" className="feed-desktop-video-section mt-5">
            {/* Section historique : conservee telle quelle pour le desktop
                >= 1280 et le mobile. Elle consomme la donnee DEJA chargee — la
                region entiere est masquee dans la bande medium, ou la video
                vit desormais dans le flux. */}
            {videoTeasers.isLoading || videoTeasers.isEmpty ? null : (
              <LocalVideoTeaserRail
                items={videoTeasers.items}
                title={LOCAL_VIDEO_TEASER_SECTION_FEED}
                layout="scroll"
              />
            )}
          </div>
        ) : null}

        {/* C3-FEED-M4 : region « stream » — le fil ET ses etats alternatifs
            (chargement, erreur, filtre sans resultat, vide) occupent UNE seule
            case de la grille. Le contenu change, la region non : « context »
            reste donc toujours apres, sans double stream ni saut horizontal. */}
        <div data-feed-medium-region="stream">

        {viewHint ? (
          <p className="mt-4 text-xs leading-relaxed text-neutral-500">{viewHint}</p>
        ) : null}

        {reportMessage ? (
          <p className="mt-4 rounded-xl bg-yunicity-primary-soft px-4 py-3 text-sm text-yunicity-primary">
            {reportMessage}
          </p>
        ) : null}

        {isLoading ? <FeedLoadingState /> : null}
        {!isLoading && error ? <FeedErrorState onRetry={() => void refresh()} /> : null}

        {!isLoading && !error && leftNav === "saved" ? (
          <FeedSavedEventsPanel events={portal.savedEvents} city={city} />
        ) : null}

        {!isLoading && !error && leftNav !== "saved" && displayedPosts.length === 0 ? (
          interestFilterActive && items.length > 0 ? (
            <div
              data-feed-medium-surface="primary"
              className="mt-5 rounded-2xl border border-dashed border-yunicity-border bg-white p-8 text-center shadow-sm"
            >
              <p className="text-base font-semibold text-neutral-900">
                Aucune publication ne correspond à vos centres d&apos;intérêt
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
                Désactivez le filtre ou ajustez vos préférences pour voir plus de contenu local.
              </p>
              <button
                type="button"
                onClick={() => setInterestFilterActive(false)}
                className="mt-4 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Désactiver le filtre
              </button>
            </div>
          ) : (
            <FeedEmptyState city={city} highlights={highlights} />
          )
        ) : null}

        {!isLoading && !error && leftNav !== "saved" && displayedPosts.length > 0 ? (
          <ul
            data-feed-stream-list=""
            className="mt-5 space-y-5 lg:space-y-6"
            aria-label="Publications du fil local"
          >
            {mediumStream.map((entree: FeedStreamItem) =>
              entree.kind === "post" ? (
                <li key={entree.key} data-feed-stream-item="post">
                  <FeedCard
                    post={entree.post}
                    onToggleLike={toggleLike}
                    onReport={handleReport}
                  />
                </li>
              ) : entree.kind === "local-video" ? (
                <li
                  key={entree.key}
                  data-feed-stream-item="local-video"
                  className="feed-medium-stream-video"
                >
                  <FeedVideoStreamItem video={entree.video} />
                </li>
              ) : /* C3-FEED-UNIFIED-CONTEXT-STREAM-R1 : le contrat porte
                     desormais `context-module`, mais ce consommateur ne declare
                     aucune famille disponible — la branche est donc INATTEIGNABLE
                     aujourd'hui. Elle existe pour que le narrowing tienne ; R2 y
                     posera le rendu. Aucun changement visuel dans R1. */
              null,
            )}
          </ul>
        ) : null}

        {nextCursor && !isLoading && !error && leftNav !== "saved" ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={() => void loadMore()}
              className="rounded-full border border-yunicity-border bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              {isLoadingMore ? "Chargement…" : FEED_LOAD_MORE_LABEL}
            </button>
          </div>
        ) : null}

        </div>

        <div data-feed-medium-region="context" className="mt-8 2xl:hidden">
          {rightRail}
        </div>
      </div>
      </div>
    </FeedAppShell>
  );
}
