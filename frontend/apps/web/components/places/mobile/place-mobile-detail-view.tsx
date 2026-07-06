"use client";

import {
  PlaceMobileDetailActionBar,
  PlaceMobileDetailHeader,
  PlaceMobileDetailHero,
  PlaceMobileDetailQuickInfo,
  PlaceMobileDetailTabs,
} from "@/components/places/mobile";
import { TerritoryMobilePostComposer } from "@/components/shared/mobile";
import type { CulturalPlaceDetail } from "@yunicity/types";
import {
  PLACE_DETAIL_MOBILE_SHARE_COPIED,
  TERRITORY_MOBILE_MEMBERSHIP_JOINED,
  buildPlaceMobileDetailQuickInfo,
  buildPlaceMobileDetailShareUrl,
  type PlaceMobileDetailTabId,
} from "@yunicity/utils";
import { useTerritoryMembership } from "@/hooks/use-territory-membership";
import { useTerritoryPostSubmit } from "@/hooks/use-territory-post-submit";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

type PlaceMobileDetailViewProps = {
  place: CulturalPlaceDetail;
};

/** Vue mobile complète détail lieu (MOBILE-LIEUX-02). */
export function PlaceMobileDetailView({ place }: PlaceMobileDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const submitPost = useTerritoryPostSubmit();
  const composerRef = useRef<HTMLDivElement>(null);
  const membership = useTerritoryMembership({
    kind: "place",
    slug: place.slug,
    city: place.city,
  });
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [membershipHint, setMembershipHint] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PlaceMobileDetailTabId>("about");

  const quickInfoItems = useMemo(
    () => buildPlaceMobileDetailQuickInfo(place),
    [place],
  );

  const handleShare = useCallback(async () => {
    const path = buildPlaceMobileDetailShareUrl(place);
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: place.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(PLACE_DETAIL_MOBILE_SHARE_COPIED);
      window.setTimeout(() => setShareHint(null), 2500);
    } catch {
      /* annulation */
    }
  }, [place]);

  const handleToggleMembership = useCallback(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (membership.isMember) {
      membership.leave();
      return;
    }
    membership.join();
    setMembershipHint(TERRITORY_MOBILE_MEMBERSHIP_JOINED);
    window.setTimeout(() => setMembershipHint(null), 2500);
  }, [membership, router, user]);

  const handlePublishClick = useCallback(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!membership.isMember) return;
    setActiveTab("about");
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [membership.isMember, router, user]);

  return (
    <div className="web-mobile-place-detail-only min-w-0 bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <PlaceMobileDetailHeader city={place.city} onShare={() => void handleShare()} />

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
        <PlaceMobileDetailHero
          place={place}
          onOpenPhotos={() => setActiveTab("photos")}
        />
        <PlaceMobileDetailQuickInfo items={quickInfoItems} />
        {membership.isMember ? (
          <div ref={composerRef} id="territory-composer">
            <TerritoryMobilePostComposer onSubmit={submitPost} />
          </div>
        ) : null}
        <PlaceMobileDetailTabs
          place={place}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <PlaceMobileDetailActionBar
        isMember={membership.isMember}
        isAuthenticated={Boolean(user)}
        onToggleMembership={handleToggleMembership}
        onPublishClick={handlePublishClick}
      />
    </div>
  );
}
