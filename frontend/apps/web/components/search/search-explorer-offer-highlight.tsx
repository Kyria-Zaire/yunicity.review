"use client";

import type { PartnerOfferPublic } from "@yunicity/types";
import { CulturalImage } from "@/components/culture/cultural-image";
import { HOME_PRIVILEGE_TITLE, buildPartnerOfferHref } from "@yunicity/utils";
import Link from "next/link";

type SearchExplorerOfferHighlightProps = {
  offer: PartnerOfferPublic;
};

export function SearchExplorerOfferHighlight({ offer }: SearchExplorerOfferHighlightProps) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-neutral-900">{HOME_PRIVILEGE_TITLE}</h2>
      <div className="mt-3 flex gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-100">
          <CulturalImage
            src={offer.partner.logo_url}
            alt=""
            placeName={offer.partner.name}
            className="h-full w-full"
            sizes="48px"
            overlay={false}
            showFallbackCaption={false}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-yunicity-primary">{offer.partner.name}</p>
          <p className="font-semibold text-neutral-900">{offer.title}</p>
          {offer.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{offer.description}</p>
          ) : null}
        </div>
      </div>
      <Link
        href={buildPartnerOfferHref(offer)}
        className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
      >
        Voir l&apos;avantage
      </Link>
    </section>
  );
}
