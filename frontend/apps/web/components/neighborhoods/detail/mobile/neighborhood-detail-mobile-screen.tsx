"use client";

import { NeighborhoodDetailMobileBottom } from "@/components/neighborhoods/detail/mobile/neighborhood-detail-mobile-bottom";
import { NeighborhoodDetailMobileHeader } from "@/components/neighborhoods/detail/mobile/neighborhood-detail-mobile-header";
import { NeighborhoodDetailMobileHero } from "@/components/neighborhoods/detail/mobile/neighborhood-detail-mobile-hero";
import { NeighborhoodDetailMobileIdentity } from "@/components/neighborhoods/detail/mobile/neighborhood-detail-mobile-identity";
import { NeighborhoodDetailMobileIdentitySection } from "@/components/neighborhoods/detail/mobile/neighborhood-detail-mobile-identity-section";
import { NeighborhoodDetailMobileOverview } from "@/components/neighborhoods/detail/mobile/neighborhood-detail-mobile-overview";
import { NeighborhoodDetailMobilePlaces } from "@/components/neighborhoods/detail/mobile/neighborhood-detail-mobile-places";
import { NeighborhoodDetailMobilePractical } from "@/components/neighborhoods/detail/mobile/neighborhood-detail-mobile-practical";
import { NeighborhoodDetailMobileToday } from "@/components/neighborhoods/detail/mobile/neighborhood-detail-mobile-today";
import { NeighborhoodContributionModal } from "@/components/neighborhoods/v2/neighborhood-contribution-modal";
import { useNeighborhoodContributionSubmit } from "@/hooks/use-neighborhood-contribution-submit";
import { useTribeDetailSectionScroll } from "@/hooks/use-tribe-detail-section-scroll";
import { useAuth } from "@/lib/auth/auth-provider";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_TABS,
  NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE,
  buildNeighborhoodDetailMobileAmbianceLine,
  buildNeighborhoodDetailMobileFeedItems,
  buildNeighborhoodDetailMobileGalleryUrls,
  buildNeighborhoodDetailMobileHeroImage,
  buildNeighborhoodDetailMobileIdentityBody,
  buildNeighborhoodDetailMobileListHref,
  buildNeighborhoodDetailMobileMapHref,
  buildNeighborhoodDetailMobileNowItems,
  buildNeighborhoodDetailMobilePillars,
  buildNeighborhoodDetailMobilePlaceCards,
  buildNeighborhoodDetailMobileSectorHint,
  buildNeighborhoodDetailMobileSelfHref,
  buildNeighborhoodDetailMobileTagline,
  buildNeighborhoodDetailMobileTags,
  buildNeighborhoodDetailMobileTodayEvents,
  type NeighborhoodDetailMobileTabId,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

const FOLLOW_STORAGE_KEY = "yunicity.neighborhoods.followed";
const HOME_STORAGE_KEY = "yunicity.neighborhoods.home";

type NeighborhoodDetailMobileScreenProps = {
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

/** Détail quartier mobile — <640 px (MOBILE-QUARTIER-DETAIL-01). */
export function NeighborhoodDetailMobileScreen({ detail }: NeighborhoodDetailMobileScreenProps) {
  const { user, yunicityApi } = useAuth();
  const { activeId, scrollTo } = useTribeDetailSectionScroll<NeighborhoodDetailMobileTabId>(
    NEIGHBORHOOD_DETAIL_MOBILE_TABS,
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

  const tags = useMemo(() => buildNeighborhoodDetailMobileTags(detail), [detail]);
  const tagline = useMemo(() => buildNeighborhoodDetailMobileTagline(detail), [detail]);
  const identityBody = useMemo(() => buildNeighborhoodDetailMobileIdentityBody(detail), [detail]);
  const heroImage = useMemo(() => buildNeighborhoodDetailMobileHeroImage(detail), [detail]);
  const galleryUrls = useMemo(() => buildNeighborhoodDetailMobileGalleryUrls(detail), [detail]);
  const today = useMemo(() => buildNeighborhoodDetailMobileTodayEvents(detail), [detail]);
  const places = useMemo(() => buildNeighborhoodDetailMobilePlaceCards(detail), [detail]);
  const feedItems = useMemo(() => buildNeighborhoodDetailMobileFeedItems(detail), [detail]);
  const nowItems = useMemo(() => buildNeighborhoodDetailMobileNowItems(detail), [detail]);
  const pillars = useMemo(() => buildNeighborhoodDetailMobilePillars(detail), [detail]);
  const ambianceLine = useMemo(() => buildNeighborhoodDetailMobileAmbianceLine(detail), [detail]);
  const sectorHint = useMemo(() => buildNeighborhoodDetailMobileSectorHint(detail), [detail]);
  const mapHref = useMemo(() => buildNeighborhoodDetailMobileMapHref(detail), [detail]);
  const listHref = useMemo(() => buildNeighborhoodDetailMobileListHref(detail), [detail]);
  const selfHref = useMemo(() => buildNeighborhoodDetailMobileSelfHref(detail), [detail]);
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
      className="web-mobile-neighborhood-detail-only min-w-0 overflow-x-hidden bg-white pb-10"
      data-neighborhood-detail-mobile=""
    >
      <NeighborhoodDetailMobileHeader
        title={name}
        listHref={listHref}
        onShare={() => void shareNeighborhood()}
      />

      <div className="space-y-5 px-4 pt-3">
        <NeighborhoodDetailMobileHero title={name} imageUrl={heroImage} galleryUrls={galleryUrls} />

        <NeighborhoodDetailMobileIdentity
          name={name}
          tagline={tagline}
          tags={tags}
          mapHref={mapHref}
          isFollowing={isFollowing}
          isHome={isHome}
          tabs={NEIGHBORHOOD_DETAIL_MOBILE_TABS}
          activeTabId={activeId}
          onSelectTab={scrollTo}
          onToggleFollow={toggleFollow}
          onSetHome={() => persistHome(detail.slug)}
        />

        <NeighborhoodDetailMobileOverview
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

        <NeighborhoodDetailMobileToday
          neighborhoodName={name}
          featured={today.featured}
          secondary={today.secondary}
          agendaHref={agendaHref}
        />

        <NeighborhoodDetailMobileIdentitySection body={identityBody} pillars={pillars} />

        <NeighborhoodDetailMobilePlaces places={places} />

        <NeighborhoodDetailMobileBottom
          neighborhoodName={name}
          nowItems={nowItems}
          feedItems={feedItems}
          agendaHref={agendaHref}
          feedHref={feedHref}
          mapHref={mapHref}
          onContribute={() => setModalOpen(true)}
        />

        <NeighborhoodDetailMobilePractical detail={detail} />

        {successMessage ? (
          <p
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}
      </div>

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
