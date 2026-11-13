"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerPublic } from "@yunicity/types";
import {
  PASSPORT_DESKTOP_PARTNERS_EMPTY,
  PASSPORT_DESKTOP_PARTNERS_TITLE,
  formatPassportDesktopPartnerLocation,
  partnerDisplayCategory,
  partnerPublicHref,
  resolvePartnerImage,
  resolvePassportDesktopCategoryTone,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type PassportDesktopPartnersRailProps = {
  partners: PartnerPublic[];
};

export function PassportDesktopPartnersRail({ partners }: PassportDesktopPartnersRailProps) {
  return (
    <section
      id="passport-desktop-partners"
      className="scroll-mt-28 space-y-4"
      aria-labelledby="passport-desktop-partners-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="passport-desktop-partners-title" className="text-lg font-bold text-neutral-900">
          {PASSPORT_DESKTOP_PARTNERS_TITLE}
        </h2>
        {partners.length > 4 ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-400">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>

      {partners.length === 0 ? (
        <p className="feed-desktop-surface px-6 py-8 text-sm text-neutral-600">
          {PASSPORT_DESKTOP_PARTNERS_EMPTY}
        </p>
      ) : (
        <div className="relative">
          <ul className="flex gap-5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {partners.map((partner) => {
              const imageSrc = resolvePartnerImage(
                {
                  cover_image_url: partner.cover_image_url,
                  logo_url: partner.logo_url,
                  category: partner.category,
                },
                "card",
              );
              const category = partnerDisplayCategory(partner);

              return (
                <li key={partner.id} className="w-[13.5rem] shrink-0">
                  <Link href={partnerPublicHref(partner)} className="group flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-neutral-100 bg-neutral-100 shadow-sm transition group-hover:ring-2 group-hover:ring-yunicity-primary/30">
                      <CulturalImage
                        src={imageSrc}
                        alt=""
                        placeName={partner.name}
                        className="h-full w-full object-cover"
                        sizes="56px"
                        overlay={false}
                        showFallbackCaption={false}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-neutral-900">{partner.name}</p>
                      <p className={`text-[11px] font-medium ${resolvePassportDesktopCategoryTone(category)}`}>
                        {category}
                      </p>
                      <p className="truncate text-[11px] text-neutral-500">
                        {formatPassportDesktopPartnerLocation(partner)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
