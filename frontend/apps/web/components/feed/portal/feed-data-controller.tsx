"use client";

import type { FeedReportReason } from "@yunicity/types";
import type { FeedPortalView } from "@yunicity/utils";
import {
  FEED_PORTAL_FOR_YOU_HINT,
  FEED_PORTAL_POPULAR_HINT,
  PROFILE_INTERESTS,
  buildFeedDesktopMoments,
  buildFeedHighlightEvents,
  filterFeedPostsByView,
  filterFeedPostsContributions,
  filterFeedPostsDiscussions,
  selectFeedStreamLocalVideos,
} from "@yunicity/utils";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { FeedResponsiveShell } from "@/components/feed/feed-responsive-shell";
import { FeedMediumFilterSheet } from "@/components/feed/portal/feed-medium-filter-sheet";
import { CitizenAuthenticatedShell } from "@/components/shell/citizen-authenticated-shell";
import { useCurrentWeather } from "@/hooks/use-current-weather";
import { useFeed } from "@/hooks/use-feed";
import { useFeedPortalContext } from "@/hooks/use-feed-portal-context";
import { useLocalVideoTeasers } from "@/hooks/use-local-video-teasers";
import { usePassportFeedRail } from "@/hooks/use-passport-feed-rail";
import { useVisibleActivation } from "@/hooks/use-visible-activation";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import type { FeedContextModuleFamily } from "@/lib/feed/feed-context-stream";
import {
  feedEnrichmentForScope,
  isSameFeedVideoEnrichment,
  resolveFeedEnrichmentSnapshot,
} from "@/lib/feed/feed-enrichment-snapshot";
import {
  buildFeedStream,
  filterFeedContextFamiliesForDesktop,
} from "@/lib/feed/feed-stream";
import {
  isFeedMediumInterestFilterActive,
  resetFeedMediumFilterActivation,
} from "@/lib/layout/feed-medium-filter-contract";

const CITY_VIDEO_TEASER_FILTER = { kind: "city" } as const;
type FeedLeftNav =
  | FeedPortalView
  | "home"
  | "for_you"
  | "favorites"
  | "my_events"
  | "my_tribes"
  | "discussions"
  | "stories"
  | "contributions"
  | "saved"
  | "subscriptions"
  | "nearby"
  | null;

/**
 * Contrôleur de données du fil — C3-FEED-RESPONSIVE-SHELL-R4.
 *
 * Seul propriétaire du réseau : tous les hooks de fetch et tout l'état vivent
 * ici, et le squelette (`FeedResponsiveShell`) est purement présentationnel.
 *
 * Ce contrôleur ne connaît aucun palier : il ne mesure aucune largeur, n'écoute
 * aucun `resize` et n'appelle aucun `matchMedia`. Le responsive est décidé
 * exclusivement par les media queries de `globals.css`. Il en découle une seule
 * colonne centrale, une seule liste de publications et une seule pagination,
 * quelle que soit la largeur.
 *
 * Rails Desktop : armés par `useVisibleActivation`, qui observe le RÉSULTAT du
 * layout. Sous 1280px les rails sont `display: none`, n'intersectent jamais, et
 * aucune requête de rail ne part. L'activation est définitive : élargir puis
 * rétrécir la fenêtre ne relance aucun fetch.
 */
export function FeedDataController() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const portal = useFeedPortalContext();
  const composerRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<FeedPortalView>("for_you");
  const [leftNav, setLeftNav] = useState<FeedLeftNav>(null);
  const [interestFilterActive, setInterestFilterActive] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const feed = useFeed({
    scopeKey: `${activeView}:${leftNav ?? "main"}:${interestFilterActive}`,
  });

  const {
    loadInitial,
    refresh,
    loadMore,
    items,
    isLoading,
    error,
    appendError,
    hasNextPage,
    isLoadingMore,
    createPost,
    toggleLike,
  } = feed;

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const city = portal.city || user?.city || "Reims";

  // Rails Desktop : armés au premier affichage réel du rail (≥1280px), jamais
  // désarmés → aucun refetch lorsque la largeur retraverse 1280px.
  const { ref: desktopProbeRef, activated: desktopRailsEnabled } =
    useVisibleActivation<HTMLElement>();

  const passportRail = usePassportFeedRail(desktopRailsEnabled);
  const weatherRail = useCurrentWeather({
    city: desktopRailsEnabled ? city : "",
  });

  // `loading` couvre aussi l'état « armé mais pas encore résolu » : sans cela le
  // premier rendu Desktop afficherait l'état indisponible avant même l'appel.
  const passportRailData = useMemo(
    () => ({
      overview: passportRail.overview,
      challenges: passportRail.challenges,
      loading:
        passportRail.loading || (!passportRail.overview && !passportRail.error),
      error: passportRail.error,
    }),
    [
      passportRail.challenges,
      passportRail.error,
      passportRail.loading,
      passportRail.overview,
    ],
  );
  const weatherRailData = useMemo(
    () => ({
      weather: weatherRail.weather,
      loading:
        weatherRail.loading || (!weatherRail.weather && !weatherRail.error),
      error: weatherRail.error,
    }),
    [weatherRail.error, weatherRail.loading, weatherRail.weather],
  );
  const interests = useMemo(() => {
    const fromProfile = portal.profile?.interests ?? [];
    return fromProfile.filter(
      (interest): interest is (typeof PROFILE_INTERESTS)[number] =>
        (PROFILE_INTERESTS as readonly string[]).includes(interest),
    );
  }, [portal.profile?.interests]);

  const videoTeasers = useLocalVideoTeasers({
    city,
    filter: CITY_VIDEO_TEASER_FILTER,
  });
  const candidateStreamVideos = useMemo(
    () => selectFeedStreamLocalVideos(videoTeasers.items),
    [videoTeasers.items],
  );
  const desktopMoments = useMemo(
    () =>
      buildFeedDesktopMoments({
        city,
        culturalPlaces: portal.culturalPlaces,
        localVideos: videoTeasers.items,
      }),
    [city, portal.culturalPlaces, videoTeasers.items],
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

  const displayedPosts = useMemo(() => {
    if (leftNav === "discussions") return filterFeedPostsDiscussions(items);
    if (leftNav === "contributions")
      return filterFeedPostsContributions(items, user?.id ?? null);
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

  const streamIsContextual = activeView === "for_you" && leftNav === null;
  const candidateContextFamilies = useMemo<FeedContextModuleFamily[]>(() => {
    const families: FeedContextModuleFamily[] = [];
    if (highlights.length > 0) families.push("must-see");
    if (portal.highlightOffer) families.push("local-privilege");
    return families;
  }, [highlights.length, portal.highlightOffer]);

  const enrichmentCandidate = useMemo(
    () => ({
      scopeKey: city,
      value: {
        videos: candidateStreamVideos,
        families: candidateContextFamilies,
        highlights,
        highlightOffer: portal.highlightOffer,
        tribes: [],
        trends: [],
      },
    }),
    [
      candidateContextFamilies,
      candidateStreamVideos,
      city,
      highlights,
      portal.highlightOffer,
    ],
  );
  const [enrichmentSnapshot, setEnrichmentSnapshot] = useState<
    typeof enrichmentCandidate | null
  >(null);
  const enrichmentSourcesSettled = !portal.loading && !videoTeasers.isLoading;

  useEffect(() => {
    setEnrichmentSnapshot((current) =>
      resolveFeedEnrichmentSnapshot(
        current,
        enrichmentCandidate,
        enrichmentSourcesSettled,
        (left, right) =>
          left.highlightOffer === right.highlightOffer &&
          left.highlights === right.highlights &&
          isSameFeedVideoEnrichment(
            { videos: left.videos, families: left.families },
            { videos: right.videos, families: right.families },
          ),
      ),
    );
  }, [enrichmentCandidate, enrichmentSourcesSettled]);

  const resolvedEnrichment = feedEnrichmentForScope(enrichmentSnapshot, city);
  const renderedEnrichment = streamIsContextual
    ? resolvedEnrichment
    : enrichmentCandidate.value;
  const streamWaitingForEnrichment =
    streamIsContextual && resolvedEnrichment === null;

  const desktopStream = useMemo(
    () =>
      buildFeedStream(
        displayedPosts,
        streamIsContextual ? (renderedEnrichment?.videos ?? []) : null,
        activeView,
        {
          availableContextFamilies: streamIsContextual
            ? filterFeedContextFamiliesForDesktop(
                renderedEnrichment?.families ?? [],
              )
            : [],
        },
      ),
    [activeView, displayedPosts, renderedEnrichment, streamIsContextual],
  );
  const streamLoading = isLoading || (!error && streamWaitingForEnrichment);

  const viewHint =
    activeView === "for_you" &&
    !leftNav &&
    isFeedMediumInterestFilterActive({
      activated: interestFilterActive,
      interests,
    })
      ? FEED_PORTAL_FOR_YOU_HINT
      : activeView === "popular" && !leftNav
        ? FEED_PORTAL_POPULAR_HINT
        : null;
  const filterHint = isFeedMediumInterestFilterActive({
    activated: interestFilterActive,
    interests,
  }) ? (
    <>
      Filtre actif selon vos centres d&apos;intérêt :{" "}
      {interests.slice(0, 4).join(", ")}
      {interests.length > 4 ? "..." : ""}
    </>
  ) : interestFilterActive && interests.length === 0 ? (
    <>
      Ajoutez vos centres d&apos;intérêt dans les{" "}
      <Link
        href="/settings"
        className="font-semibold text-yunicity-primary hover:underline"
      >
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

  async function handleCreate(body: string, mediaUrl?: string | null) {
    await createPost(body, mediaUrl);
  }

  async function handleReport(postId: string, reason: FeedReportReason) {
    await api.reportFeedPost(postId, { reason });
    setReportMessage("Merci, votre signalement a été transmis à l'équipe.");
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

  const userFirstName = user?.full_name?.split(" ")[0] || "Voyageur";
  const filterActive = isFeedMediumInterestFilterActive({
    activated: interestFilterActive,
    interests,
  });
  const showSaved = leftNav === "saved";

  return (
    <CitizenAuthenticatedShell variant="citizen-feed-shell">
      <>
        <FeedResponsiveShell
          city={city}
          userFirstName={userFirstName}
          userAvatarUrl={portal.profile?.avatar_url ?? null}
          portalEvents={portal.events}
          storyMoments={desktopMoments}
          onCreatePost={handleCreate}
          composerRef={composerRef}
          filterHint={filterHint}
          activeView={activeView}
          leftNav={leftNav}
          onLeftNavSelect={handleLeftNavSelect}
          filterPanelOpen={filterPanelOpen}
          filterActive={filterActive}
          onOpenFilter={openMediumFilter}
          filterButtonRef={filterTriggerRef}
          highlightOffer={renderedEnrichment?.highlightOffer ?? null}
          weather={weatherRailData}
          passport={passportRailData}
          desktopProbeRef={desktopProbeRef}
          showSaved={showSaved}
          stream={desktopStream}
          streamLoading={streamLoading}
          streamError={error}
          highlights={renderedEnrichment?.highlights ?? []}
          savedEvents={portal.savedEvents}
          onToggleLike={toggleLike}
          onReport={handleReport}
          onRefresh={() => void refresh()}
          hasNextPage={hasNextPage}
          isLoadingMore={isLoadingMore}
          appendError={appendError}
          onLoadMore={loadMore}
          viewHint={viewHint}
          reportMessage={reportMessage}
          interestFilterBlockedCount={items.length}
          onDisableInterestFilter={() => setInterestFilterActive(false)}
        />

        <FeedMediumFilterSheet
          open={filterPanelOpen}
          onOpenChange={setFilterPanelOpen}
          activated={interestFilterActive}
          interests={interests}
          onReset={resetInterestFilter}
          returnFocusRef={filterTriggerRef}
        />
      </>
    </CitizenAuthenticatedShell>
  );
}
