"use client";

import { NeighborhoodDetailDesktopScreen } from "@/components/neighborhoods/detail/desktop";
import { NeighborhoodDetailMediumScreen } from "@/components/neighborhoods/detail/medium";
import { NeighborhoodDetailMobileScreen } from "@/components/neighborhoods/detail/mobile";
import { NeighborhoodV2Skeleton } from "@/components/neighborhoods/v2/neighborhood-v2-skeleton";
import { NeighborhoodsAppShell } from "@/components/neighborhoods/neighborhoods-app-shell";
import { useNeighborhoodDetailV2 } from "@/hooks/use-neighborhood-detail-v2";
import {
  NEIGHBORHOOD_DETAIL_RETRY,
  NEIGHBORHOOD_V2_BACK_TO_LIST,
  NEIGHBORHOOD_V2_ERROR,
  NEIGHBORHOOD_V2_NOT_FOUND,
} from "@yunicity/utils";
import Link from "next/link";

export function NeighborhoodDetailScreen({ slug, city }: { slug: string; city: string }) {
  const state = useNeighborhoodDetailV2(slug, city);
  const detail = state.detail;

  if (state.loading) {
    return (
      <NeighborhoodsAppShell>
        <div className="web-mobile-neighborhood-detail-only px-4 py-12">
          <NeighborhoodV2Skeleton />
        </div>
        <div className="web-medium-neighborhood-detail-only px-4 py-12 sm:px-6">
          <NeighborhoodV2Skeleton />
        </div>
        <div className="web-desktop-neighborhood-detail-only px-3 py-12 sm:px-4 lg:px-6">
          <NeighborhoodV2Skeleton />
        </div>
      </NeighborhoodsAppShell>
    );
  }

  if (state.isNotFound) {
    return (
      <NeighborhoodsAppShell>
        <div className="web-mobile-neighborhood-detail-only px-4 py-16 text-center">
          <p className="text-base font-medium text-neutral-800">{NEIGHBORHOOD_V2_NOT_FOUND}</p>
          <Link
            href={`/neighborhoods?city=${encodeURIComponent(city)}`}
            className="mt-6 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-yunicity-primary/90"
          >
            {NEIGHBORHOOD_V2_BACK_TO_LIST}
          </Link>
        </div>
        <div className="web-medium-neighborhood-detail-only mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <p className="text-base font-medium text-neutral-800">{NEIGHBORHOOD_V2_NOT_FOUND}</p>
          <Link
            href={`/neighborhoods?city=${encodeURIComponent(city)}`}
            className="mt-6 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-yunicity-primary/90"
          >
            {NEIGHBORHOOD_V2_BACK_TO_LIST}
          </Link>
        </div>
        <div className="web-desktop-neighborhood-detail-only mx-auto max-w-lg px-3 py-16 text-center">
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
        <div className="web-mobile-neighborhood-detail-only px-4 py-16 text-center">
          <p className="text-sm text-red-800">{NEIGHBORHOOD_V2_ERROR}</p>
          <button
            type="button"
            onClick={() => void state.reload()}
            className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {NEIGHBORHOOD_DETAIL_RETRY}
          </button>
        </div>
        <div className="web-medium-neighborhood-detail-only mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <p className="text-sm text-red-800">{NEIGHBORHOOD_V2_ERROR}</p>
          <button
            type="button"
            onClick={() => void state.reload()}
            className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {NEIGHBORHOOD_DETAIL_RETRY}
          </button>
        </div>
        <div className="web-desktop-neighborhood-detail-only mx-auto max-w-lg px-3 py-16 text-center">
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
      <NeighborhoodDetailMobileScreen detail={detail} />
      <NeighborhoodDetailMediumScreen detail={detail} />
      <NeighborhoodDetailDesktopScreen detail={detail} />
    </NeighborhoodsAppShell>
  );
}
