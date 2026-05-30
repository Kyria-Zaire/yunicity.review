"use client";

import { CulturalPlaceDetailScreen } from "@/components/places/cultural-place-detail-screen";
import { PartnerDetailScreen } from "@/components/partners/partner-detail-screen";
import { PlacesAppShell } from "@/components/places/places-app-shell";
import { usePlaceDetail } from "@/hooks/use-place-detail";
import {
  PARTNER_DETAIL_ERROR,
  PARTNER_DETAIL_LOADING,
  PARTNER_DETAIL_RETRY,
} from "@yunicity/utils";
import Link from "next/link";

type PlaceDetailScreenProps = {
  slug: string;
  city: string;
};

export function PlaceDetailScreen({ slug, city }: PlaceDetailScreenProps) {
  const { state, reload } = usePlaceDetail(slug, city);

  if (state.status === "loading") {
    return (
      <PlacesAppShell>
        <p className="py-16 text-center text-sm text-neutral-500" role="status">
          {PARTNER_DETAIL_LOADING}
        </p>
      </PlacesAppShell>
    );
  }

  if (state.status === "error") {
    return (
      <PlacesAppShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white px-6 py-10 text-center">
          <p className="text-sm text-neutral-700">{PARTNER_DETAIL_ERROR}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void reload()}
              className="text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PARTNER_DETAIL_RETRY}
            </button>
            <Link href="/places" className="text-sm font-semibold text-neutral-600 hover:underline">
              Retour aux lieux
            </Link>
          </div>
        </div>
      </PlacesAppShell>
    );
  }

  if (state.status === "cultural") {
    return <CulturalPlaceDetailScreen place={state.place} />;
  }

  return <PartnerDetailScreen partner={state.partner} />;
}
