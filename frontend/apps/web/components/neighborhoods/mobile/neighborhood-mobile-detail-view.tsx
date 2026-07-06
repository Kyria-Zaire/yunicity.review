"use client";

import {
  NeighborhoodMobileDetailHeader,
  NeighborhoodMobileDetailHero,
  NeighborhoodMobileDetailStatsGrid,
  NeighborhoodMobileDetailTabs,
} from "@/components/neighborhoods/mobile";
import { TerritoryMobilePostComposer } from "@/components/shared/mobile";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  buildNeighborhoodMobileActivityItems,
  buildNeighborhoodMobileFeaturedCards,
  buildNeighborhoodMobileStatsGrid,
  neighborhoodHref,
  selectApprovedContributionsForDisplay,
  TERRITORY_MOBILE_MEMBERSHIP_JOINED,
} from "@yunicity/utils";
import { useTerritoryMembership } from "@/hooks/use-territory-membership";
import { useTerritoryPostSubmit } from "@/hooks/use-territory-post-submit";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

type NeighborhoodMobileDetailViewProps = {
  detail: NeighborhoodDetail;
};

/** Vue mobile complète détail quartier (MOBILE-QUARTIERS-02). */
export function NeighborhoodMobileDetailView({ detail }: NeighborhoodMobileDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const submitPost = useTerritoryPostSubmit();
  const membership = useTerritoryMembership({
    kind: "neighborhood",
    slug: detail.slug,
    city: detail.city,
  });
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [membershipHint, setMembershipHint] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const statsItems = useMemo(
    () => buildNeighborhoodMobileStatsGrid(detail.stats),
    [detail.stats],
  );

  const featuredCards = useMemo(
    () => buildNeighborhoodMobileFeaturedCards(detail),
    [detail],
  );

  const activityItems = useMemo(
    () => buildNeighborhoodMobileActivityItems(selectApprovedContributionsForDisplay(detail.contributions)),
    [detail.contributions],
  );

  const handleShare = useCallback(async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${neighborhoodHref(detail.slug, detail.city)}`
        : neighborhoodHref(detail.slug, detail.city);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: detail.display_name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint("Lien copié dans le presse-papiers.");
      window.setTimeout(() => setShareHint(null), 2500);
    } catch {
      /* annulation */
    }
  }, [detail.city, detail.display_name, detail.slug]);

  const handleJoin = useCallback(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setJoining(true);
    membership.join();
    setMembershipHint(TERRITORY_MOBILE_MEMBERSHIP_JOINED);
    window.setTimeout(() => setMembershipHint(null), 2500);
    setJoining(false);
  }, [membership, router, user]);

  return (
    <div className="web-mobile-neighborhood-detail-only min-w-0 bg-white pb-6">
      <NeighborhoodMobileDetailHeader city={detail.city} onShare={() => void handleShare()} />

      {shareHint ? (
        <p className="mx-4 mt-3 rounded-full bg-neutral-900 px-4 py-2 text-center text-xs text-white">
          {shareHint}
        </p>
      ) : null}

      {membershipHint ? (
        <p className="mx-4 mt-3 rounded-full bg-emerald-700 px-4 py-2 text-center text-xs text-white">
          {membershipHint}
        </p>
      ) : null}

      <div className="space-y-4 px-4 py-3">
        <NeighborhoodMobileDetailHero detail={detail} />
        <NeighborhoodMobileDetailStatsGrid items={statsItems} />
        {membership.isMember ? (
          <TerritoryMobilePostComposer onSubmit={submitPost} />
        ) : null}
        <NeighborhoodMobileDetailTabs
          detail={detail}
          featuredCards={featuredCards}
          activityItems={activityItems}
          isMember={membership.isMember}
          onJoin={handleJoin}
          joining={joining}
        />
      </div>
    </div>
  );
}
