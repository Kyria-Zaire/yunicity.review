"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerOffer, PartnerPublic } from "@yunicity/types";
import {
  PASSPORT_PARTNERS_RAIL_CTA,
  PASSPORT_PARTNERS_RAIL_EMPTY,
  PASSPORT_PARTNERS_RAIL_SUBTITLE,
  PASSPORT_PARTNERS_RAIL_TITLE,
  buildPartnerPlaceCards,
  filterPartnerOffersForOrganization,
  partnerPublicHref,
  resolvePartnerImage,
} from "@yunicity/utils";
import Link from "next/link";

type PassportPartnersPanelProps = {
  partners: PartnerPublic[];
  offers: PartnerOffer[];
};

export function PassportPartnersPanel({ partners, offers }: PassportPartnersPanelProps) {
  const cards = buildPartnerPlaceCards(partners).slice(0, 4);

  return (
    <section
      id="passport-partners"
      className="scroll-mt-28 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-neutral-900">{PASSPORT_PARTNERS_RAIL_TITLE}</h2>
      <p className="mt-1 text-sm text-neutral-600">{PASSPORT_PARTNERS_RAIL_SUBTITLE}</p>

      {cards.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">{PASSPORT_PARTNERS_RAIL_EMPTY}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {cards.map((card) => {
            const partner = partners.find((item) => item.slug === card.slug);
            const partnerOffers = partner
              ? filterPartnerOffersForOrganization(offers, partner.organization_id)
              : [];
            return (
              <li key={card.id}>
                <article className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                    <CulturalImage
                      src={resolvePartnerImage(
                        partner ?? {
                          cover_image_url: card.imageUrl,
                          logo_url: card.logoUrl,
                          category: null,
                        },
                        "card",
                      )}
                      alt=""
                      placeName={card.name}
                      className="h-full w-full"
                      sizes="56px"
                      overlay={false}
                      showFallbackCaption={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold text-neutral-900">{card.name}</p>
                    <p className="text-xs text-neutral-500">{card.categoryLabel}</p>
                    {partnerOffers.length > 0 ? (
                      <p className="mt-1 text-xs font-medium text-yunicity-primary">
                        {partnerOffers.length} offre{partnerOffers.length > 1 ? "s" : ""} Passport
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-neutral-500">{PASSPORT_PARTNERS_RAIL_EMPTY}</p>
                    )}
                    <Link
                      href={partnerPublicHref({ slug: card.slug, city: partner?.city ?? "Reims" })}
                      className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
                    >
                      {PASSPORT_PARTNERS_RAIL_CTA}
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
