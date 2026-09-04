"use client";

import { NeighborhoodDetailBreadcrumbs } from "@/components/neighborhoods/neighborhood-detail-breadcrumbs";
import { NeighborhoodDetailDesktopFeed } from "@/components/neighborhoods/detail/desktop/neighborhood-detail-desktop-feed";
import { NeighborhoodDetailDesktopHero } from "@/components/neighborhoods/detail/desktop/neighborhood-detail-desktop-hero";
import { NeighborhoodDetailDesktopIdentity } from "@/components/neighborhoods/detail/desktop/neighborhood-detail-desktop-identity";
import { NeighborhoodDetailDesktopIdentitySection } from "@/components/neighborhoods/detail/desktop/neighborhood-detail-desktop-identity-section";
import { NeighborhoodDetailDesktopPlaces } from "@/components/neighborhoods/detail/desktop/neighborhood-detail-desktop-places";
import { NeighborhoodDetailDesktopPractical } from "@/components/neighborhoods/detail/desktop/neighborhood-detail-desktop-practical";
import { NeighborhoodDetailDesktopRightRail } from "@/components/neighborhoods/detail/desktop/neighborhood-detail-desktop-right-rail";
import { NeighborhoodDetailDesktopToday } from "@/components/neighborhoods/detail/desktop/neighborhood-detail-desktop-today";
import { NeighborhoodContributionModal } from "@/components/neighborhoods/v2/neighborhood-contribution-modal";
import { useNeighborhoodContributionSubmit } from "@/hooks/use-neighborhood-contribution-submit";
import { useTribeDetailSectionScroll } from "@/hooks/use-tribe-detail-section-scroll";
import { useAuth } from "@/lib/auth/auth-provider";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_DESKTOP_BACK,
  NEIGHBORHOOD_DETAIL_DESKTOP_TABS,
  NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE,
  buildNeighborhoodDetailBreadcrumbs,
  buildNeighborhoodDetailDesktopAmbianceLine,
  buildNeighborhoodDetailDesktopFeedItems,
  buildNeighborhoodDetailDesktopGalleryUrls,
  buildNeighborhoodDetailDesktopHeroImage,
  buildNeighborhoodDetailDesktopIdentityBody,
  buildNeighborhoodDetailDesktopListHref,
  buildNeighborhoodDetailDesktopMapHref,
  buildNeighborhoodDetailDesktopNowItems,
  buildNeighborhoodDetailDesktopPillars,
  buildNeighborhoodDetailDesktopPlaceCards,
  buildNeighborhoodDetailDesktopSectorHint,
  buildNeighborhoodDetailDesktopSelfHref,
  buildNeighborhoodDetailDesktopTagline,
  buildNeighborhoodDetailDesktopTags,
  buildNeighborhoodDetailDesktopTodayEvents,
  type NeighborhoodDetailDesktopTabId,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const FOLLOW_STORAGE_KEY = "yunicity.neighborhoods.followed";
const HOME_STORAGE_KEY = "yunicity.neighborhoods.home";

type NeighborhoodDetailDesktopScreenProps = {
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

/** Détail quartier desktop — ≥1024 px (DESKTOP-QUARTIER-DETAIL-01). */
export function NeighborhoodDetailDesktopScreen({ detail }: NeighborhoodDetailDesktopScreenProps) {
  const { user, yunicityApi } = useAuth();
  const { activeId, scrollTo } = useTribeDetailSectionScroll<NeighborhoodDetailDesktopTabId>(
    NEIGHBORHOOD_DETAIL_DESKTOP_TABS,
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

  const breadcrumbs = useMemo(() => buildNeighborhoodDetailBreadcrumbs(detail), [detail]);
  const tags = useMemo(() => buildNeighborhoodDetailDesktopTags(detail), [detail]);
  const tagline = useMemo(() => buildNeighborhoodDetailDesktopTagline(detail), [detail]);
  const identityBody = useMemo(() => buildNeighborhoodDetailDesktopIdentityBody(detail), [detail]);
  const heroImage = useMemo(() => buildNeighborhoodDetailDesktopHeroImage(detail), [detail]);
  const galleryUrls = useMemo(() => buildNeighborhoodDetailDesktopGalleryUrls(detail), [detail]);
  const today = useMemo(() => buildNeighborhoodDetailDesktopTodayEvents(detail), [detail]);
  const places = useMemo(() => buildNeighborhoodDetailDesktopPlaceCards(detail), [detail]);
  const feedItems = useMemo(() => buildNeighborhoodDetailDesktopFeedItems(detail), [detail]);
  const nowItems = useMemo(() => buildNeighborhoodDetailDesktopNowItems(detail), [detail]);
  const pillars = useMemo(() => buildNeighborhoodDetailDesktopPillars(detail), [detail]);
  const ambianceLine = useMemo(() => buildNeighborhoodDetailDesktopAmbianceLine(detail), [detail]);
  const sectorHint = useMemo(() => buildNeighborhoodDetailDesktopSectorHint(detail), [detail]);
  const mapHref = useMemo(() => buildNeighborhoodDetailDesktopMapHref(detail), [detail]);
  const listHref = useMemo(() => buildNeighborhoodDetailDesktopListHref(detail), [detail]);
  const selfHref = useMemo(() => buildNeighborhoodDetailDesktopSelfHref(detail), [detail]);
  const feedHref = `/feed?city=${encodeURIComponent(detail.city)}&neighborhood=${encodeURIComponent(detail.slug)}`;
  const agendaHref = `/sortir?city=${encodeURIComponent(detail.city)}`;
  const name = detail.hero?.display_name ?? detail.display_name;

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

  async function handleContributeSubmit(
    form: Parameters<typeof submit>[0],
  ) {
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
      className="neighborhood-detail-desktop-shell web-desktop-neighborhood-detail-only mx-auto w-full min-w-0 max-w-[1200px] space-y-5 overflow-x-hidden px-4 pb-14 lg:px-6"
      data-neighborhood-detail-desktop=""
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={listHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {NEIGHBORHOOD_DETAIL_DESKTOP_BACK}
        </Link>
        <NeighborhoodDetailBreadcrumbs items={breadcrumbs} />
      </div>

      <NeighborhoodDetailDesktopHero title={name} imageUrl={heroImage} galleryUrls={galleryUrls} />

      <div className="neighborhood-detail-desktop-grid gap-6">
        <div className="min-w-0 space-y-6">
          <NeighborhoodDetailDesktopIdentity
            name={name}
            tagline={tagline}
            tags={tags}
            mapHref={mapHref}
            isFollowing={isFollowing}
            isHome={isHome}
            tabs={NEIGHBORHOOD_DETAIL_DESKTOP_TABS}
            activeTabId={activeId}
            onSelectTab={scrollTo}
            onToggleFollow={toggleFollow}
            onSetHome={() => persistHome(detail.slug)}
            onShare={() => void shareNeighborhood()}
          />

          <NeighborhoodDetailDesktopToday
            neighborhoodName={name}
            featured={today.featured}
            secondary={today.secondary}
          />

          <NeighborhoodDetailDesktopIdentitySection body={identityBody} pillars={pillars} />

          <NeighborhoodDetailDesktopPlaces places={places} />

          <NeighborhoodDetailDesktopFeed items={feedItems} viewAllHref={feedHref} />

          <NeighborhoodDetailDesktopPractical detail={detail} />
        </div>

        <div className="neighborhood-detail-desktop-rail lg:sticky lg:top-20 lg:self-start">
          <NeighborhoodDetailDesktopRightRail
            detail={detail}
            ambianceLine={ambianceLine}
            sectorHint={sectorHint}
            mapHref={mapHref}
            agendaHref={agendaHref}
            nowItems={nowItems}
            isFollowing={isFollowing}
            isHome={isHome}
            onToggleFollow={toggleFollow}
            onSetHome={() => persistHome(detail.slug)}
            onContribute={() => setModalOpen(true)}
          />
        </div>
      </div>

      {successMessage ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
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
