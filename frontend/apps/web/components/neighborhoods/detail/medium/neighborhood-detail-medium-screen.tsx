"use client";

import { NeighborhoodDetailBreadcrumbs } from "@/components/neighborhoods/neighborhood-detail-breadcrumbs";
import { NeighborhoodDetailMediumBottom } from "@/components/neighborhoods/detail/medium/neighborhood-detail-medium-bottom";
import { NeighborhoodDetailMediumHero } from "@/components/neighborhoods/detail/medium/neighborhood-detail-medium-hero";
import { NeighborhoodDetailMediumIdentity } from "@/components/neighborhoods/detail/medium/neighborhood-detail-medium-identity";
import { NeighborhoodDetailMediumIdentitySection } from "@/components/neighborhoods/detail/medium/neighborhood-detail-medium-identity-section";
import { NeighborhoodDetailMediumOverviewCards } from "@/components/neighborhoods/detail/medium/neighborhood-detail-medium-overview-cards";
import { NeighborhoodDetailMediumPlaces } from "@/components/neighborhoods/detail/medium/neighborhood-detail-medium-places";
import { NeighborhoodDetailMediumPractical } from "@/components/neighborhoods/detail/medium/neighborhood-detail-medium-practical";
import { NeighborhoodDetailMediumToday } from "@/components/neighborhoods/detail/medium/neighborhood-detail-medium-today";
import { NeighborhoodContributionModal } from "@/components/neighborhoods/v2/neighborhood-contribution-modal";
import { useNeighborhoodContributionSubmit } from "@/hooks/use-neighborhood-contribution-submit";
import { useTribeDetailSectionScroll } from "@/hooks/use-tribe-detail-section-scroll";
import { useAuth } from "@/lib/auth/auth-provider";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_MEDIUM_BACK,
  NEIGHBORHOOD_DETAIL_MEDIUM_TABS,
  NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE,
  buildNeighborhoodDetailBreadcrumbs,
  buildNeighborhoodDetailMediumAmbianceLine,
  buildNeighborhoodDetailMediumFeedItems,
  buildNeighborhoodDetailMediumGalleryUrls,
  buildNeighborhoodDetailMediumHeroImage,
  buildNeighborhoodDetailMediumIdentityBody,
  buildNeighborhoodDetailMediumListHref,
  buildNeighborhoodDetailMediumMapHref,
  buildNeighborhoodDetailMediumNowItems,
  buildNeighborhoodDetailMediumPillars,
  buildNeighborhoodDetailMediumPlaceCards,
  buildNeighborhoodDetailMediumSectorHint,
  buildNeighborhoodDetailMediumSelfHref,
  buildNeighborhoodDetailMediumTagline,
  buildNeighborhoodDetailMediumTags,
  buildNeighborhoodDetailMediumTodayEvents,
  type NeighborhoodDetailMediumTabId,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const FOLLOW_STORAGE_KEY = "yunicity.neighborhoods.followed";
const HOME_STORAGE_KEY = "yunicity.neighborhoods.home";

type NeighborhoodDetailMediumScreenProps = {
  detail: NeighborhoodDetail;
};

function readFollowedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FOLLOW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function readHomeSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOME_STORAGE_KEY);
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

/** Détail quartier medium — 640–1023 px (MEDIUM-QUARTIER-DETAIL-01). */
export function NeighborhoodDetailMediumScreen({ detail }: NeighborhoodDetailMediumScreenProps) {
  const { user, yunicityApi } = useAuth();
  const { activeId, scrollTo } = useTribeDetailSectionScroll<NeighborhoodDetailMediumTabId>(
    NEIGHBORHOOD_DETAIL_MEDIUM_TABS,
    "overview",
  );

  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [homeSlug, setHomeSlug] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasActivePassport, setHasActivePassport] = useState(false);

  const { status, errorMessage, submit, reset } = useNeighborhoodContributionSubmit({
    slug: detail.slug,
    city: detail.city,
  });

  useEffect(() => {
    setFollowedSlugs(readFollowedSlugs());
    setHomeSlug(readHomeSlug());
  }, []);

  const persistFollowed = useCallback((next: string[]) => {
    setFollowedSlugs(next);
    try {
      window.localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode */
    }
  }, []);

  const persistHome = useCallback((slug: string) => {
    setHomeSlug(slug);
    try {
      window.localStorage.setItem(HOME_STORAGE_KEY, slug);
    } catch {
      /* quota / private mode */
    }
  }, []);

  const isFollowing = followedSlugs.includes(detail.slug);
  const isHome = homeSlug === detail.slug;
  const name = detail.hero?.display_name ?? detail.display_name;

  const breadcrumbs = useMemo(() => buildNeighborhoodDetailBreadcrumbs(detail), [detail]);
  const tags = useMemo(() => buildNeighborhoodDetailMediumTags(detail), [detail]);
  const tagline = useMemo(() => buildNeighborhoodDetailMediumTagline(detail), [detail]);
  const identityBody = useMemo(() => buildNeighborhoodDetailMediumIdentityBody(detail), [detail]);
  const heroImage = useMemo(() => buildNeighborhoodDetailMediumHeroImage(detail), [detail]);
  const galleryUrls = useMemo(() => buildNeighborhoodDetailMediumGalleryUrls(detail), [detail]);
  const today = useMemo(() => buildNeighborhoodDetailMediumTodayEvents(detail), [detail]);
  const places = useMemo(() => buildNeighborhoodDetailMediumPlaceCards(detail), [detail]);
  const feedItems = useMemo(() => buildNeighborhoodDetailMediumFeedItems(detail), [detail]);
  const nowItems = useMemo(() => buildNeighborhoodDetailMediumNowItems(detail), [detail]);
  const pillars = useMemo(() => buildNeighborhoodDetailMediumPillars(detail), [detail]);
  const ambianceLine = useMemo(() => buildNeighborhoodDetailMediumAmbianceLine(detail), [detail]);
  const sectorHint = useMemo(() => buildNeighborhoodDetailMediumSectorHint(detail), [detail]);
  const mapHref = useMemo(() => buildNeighborhoodDetailMediumMapHref(detail), [detail]);
  const listHref = useMemo(() => buildNeighborhoodDetailMediumListHref(detail), [detail]);
  const selfHref = useMemo(() => buildNeighborhoodDetailMediumSelfHref(detail), [detail]);
  const feedHref = `/feed?city=${encodeURIComponent(detail.city)}&neighborhood=${encodeURIComponent(detail.slug)}`;
  const agendaHref = `/sortir?city=${encodeURIComponent(detail.city)}`;

  const loadPassportEligibility = useCallback(async () => {
    if (!user) {
      setHasActivePassport(false);
      return;
    }
    try {
      const overview = await yunicityApi.getMyPassport();
      setHasActivePassport(overview.passport?.status === "active");
    } catch {
      setHasActivePassport(false);
    }
  }, [user, yunicityApi]);

  useEffect(() => {
    if (!modalOpen) return;
    void loadPassportEligibility();
  }, [loadPassportEligibility, modalOpen]);

  useEffect(() => {
    if (status !== "success") return;
    setSuccessMessage(NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE);
    setModalOpen(false);
    reset();
  }, [reset, status]);

  async function handleContributeSubmit(form: Parameters<typeof submit>[0]) {
    await submit(form);
  }

  function toggleFollow() {
    if (isFollowing) {
      persistFollowed(followedSlugs.filter((slug) => slug !== detail.slug));
      return;
    }
    persistFollowed([...followedSlugs, detail.slug]);
  }

  async function shareNeighborhood() {
    const url = `${window.location.origin}${selfHref}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      /* annulation ou refus */
    }
  }

  return (
    <div
      className="neighborhood-detail-medium-shell web-medium-neighborhood-detail-only mx-auto w-full min-w-0 max-w-[960px] space-y-5 overflow-x-hidden px-4 pb-12 sm:px-6"
      data-neighborhood-detail-medium=""
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={listHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {NEIGHBORHOOD_DETAIL_MEDIUM_BACK}
        </Link>
        <NeighborhoodDetailBreadcrumbs items={breadcrumbs} />
      </div>

      <NeighborhoodDetailMediumHero title={name} imageUrl={heroImage} galleryUrls={galleryUrls} />

      <NeighborhoodDetailMediumIdentity
        name={name}
        tagline={tagline}
        tags={tags}
        mapHref={mapHref}
        isFollowing={isFollowing}
        isHome={isHome}
        tabs={NEIGHBORHOOD_DETAIL_MEDIUM_TABS}
        activeTabId={activeId}
        onSelectTab={scrollTo}
        onToggleFollow={toggleFollow}
        onSetHome={() => persistHome(detail.slug)}
        onShare={() => void shareNeighborhood()}
      />

      <NeighborhoodDetailMediumOverviewCards
        detail={detail}
        name={name}
        ambianceLine={ambianceLine}
        sectorHint={sectorHint}
        mapHref={mapHref}
        isFollowing={isFollowing}
        isHome={isHome}
        onToggleFollow={toggleFollow}
        onSetHome={() => persistHome(detail.slug)}
      />

      <NeighborhoodDetailMediumToday
        neighborhoodName={name}
        featured={today.featured}
        secondary={today.secondary}
      />

      <NeighborhoodDetailMediumIdentitySection body={identityBody} pillars={pillars} />

      <NeighborhoodDetailMediumPlaces places={places} />

      <NeighborhoodDetailMediumBottom
        neighborhoodName={name}
        nowItems={nowItems}
        feedItems={feedItems}
        agendaHref={agendaHref}
        feedHref={feedHref}
        mapHref={mapHref}
        onContribute={() => setModalOpen(true)}
      />

      <NeighborhoodDetailMediumPractical detail={detail} />

      {successMessage ? (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      <NeighborhoodContributionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        displayName={user?.full_name?.trim() || "Vous"}
        hasActivePassport={hasActivePassport}
        status={status}
        errorMessage={errorMessage}
        onSubmit={handleContributeSubmit}
        onReset={reset}
      />
    </div>
  );
}
