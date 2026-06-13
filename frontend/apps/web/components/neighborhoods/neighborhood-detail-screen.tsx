"use client";

import { NeighborhoodDetailBreadcrumbs } from "@/components/neighborhoods/neighborhood-detail-breadcrumbs";
import { NeighborhoodV2BelongingSection } from "@/components/neighborhoods/v2/neighborhood-v2-belonging-section";
import { NeighborhoodV2ExploreSection } from "@/components/neighborhoods/v2/neighborhood-v2-explore-section";
import { NeighborhoodV2Hero } from "@/components/neighborhoods/v2/neighborhood-v2-hero";
import { NeighborhoodV2HistorySection } from "@/components/neighborhoods/v2/neighborhood-v2-history-section";
import { NeighborhoodV2LocalLifeSection } from "@/components/neighborhoods/v2/neighborhood-v2-local-life-section";
import { NeighborhoodV2PracticalSection } from "@/components/neighborhoods/v2/neighborhood-v2-practical-section";
import { NeighborhoodV2Skeleton } from "@/components/neighborhoods/v2/neighborhood-v2-skeleton";
import { NeighborhoodV2StatsSection } from "@/components/neighborhoods/v2/neighborhood-v2-stats-section";
import { NeighborhoodV2TimelineSection } from "@/components/neighborhoods/v2/neighborhood-v2-timeline-section";
import { NeighborhoodsAppShell } from "@/components/neighborhoods/neighborhoods-app-shell";
import { useNeighborhoodDetailV2 } from "@/hooks/use-neighborhood-detail-v2";
import {
  NEIGHBORHOOD_DETAIL_RETRY,
  NEIGHBORHOOD_V2_BACK_TO_LIST,
  NEIGHBORHOOD_V2_ERROR,
  NEIGHBORHOOD_V2_NOT_FOUND,
  NEIGHBORHOOD_V2_SHARE,
  buildNeighborhoodDetailBreadcrumbs,
  neighborhoodHref,
  resolveNeighborhoodV2HistoryStoryForDisplay,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo } from "react";

export function NeighborhoodDetailScreen({ slug, city }: { slug: string; city: string }) {
  const state = useNeighborhoodDetailV2(slug, city);
  const detail = state.detail;

  const breadcrumbs = useMemo(
    () => (detail ? buildNeighborhoodDetailBreadcrumbs(detail) : []),
    [detail],
  );

  const history = useMemo(
    () => (detail ? resolveNeighborhoodV2HistoryStoryForDisplay(detail) : null),
    [detail],
  );

  const timeline = detail?.timeline ?? [];

  async function shareNeighborhood() {
    if (!detail) return;
    const url = `${window.location.origin}${neighborhoodHref(detail.slug, detail.city)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: detail.display_name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      /* annulation ou refus */
    }
  }

  if (state.loading) {
    return (
      <NeighborhoodsAppShell>
        <NeighborhoodV2Skeleton />
      </NeighborhoodsAppShell>
    );
  }

  if (state.isNotFound) {
    return (
      <NeighborhoodsAppShell>
        <div className="mx-auto max-w-lg px-3 py-16 text-center">
          <p className="text-base font-medium text-neutral-800">{NEIGHBORHOOD_V2_NOT_FOUND}</p>
          <Link
            href={`/neighborhoods?city=${encodeURIComponent(city)}`}
            className="mt-6 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-yunicity-primary/90"
          >
            {NEIGHBORHOOD_V2_BACK_TO_LIST}
          </Link>
        </div>
      </NeighborhoodsAppShell>
    );
  }

  if (state.error || !detail) {
    return (
      <NeighborhoodsAppShell>
        <div className="mx-auto max-w-lg px-3 py-16 text-center">
          <p className="text-sm text-red-800">{NEIGHBORHOOD_V2_ERROR}</p>
          <button
            type="button"
            onClick={() => void state.reload()}
            className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {NEIGHBORHOOD_DETAIL_RETRY}
          </button>
        </div>
      </NeighborhoodsAppShell>
    );
  }

  return (
    <NeighborhoodsAppShell>
      <div className="mx-auto w-full min-w-0 max-w-[1100px] space-y-6 overflow-x-hidden px-3 pb-12 sm:px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <NeighborhoodDetailBreadcrumbs items={breadcrumbs} />
          <button
            type="button"
            onClick={() => void shareNeighborhood()}
            className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {NEIGHBORHOOD_V2_SHARE}
          </button>
        </div>

        <NeighborhoodV2Hero detail={detail} />

        {history ? <NeighborhoodV2HistorySection history={history} /> : null}

        <NeighborhoodV2TimelineSection timeline={timeline} />

        <NeighborhoodV2ExploreSection detail={detail} />

        <NeighborhoodV2PracticalSection detail={detail} />

        <NeighborhoodV2LocalLifeSection detail={detail} />

        <NeighborhoodV2BelongingSection detail={detail} />

        <NeighborhoodV2StatsSection detail={detail} />
      </div>
    </NeighborhoodsAppShell>
  );
}
