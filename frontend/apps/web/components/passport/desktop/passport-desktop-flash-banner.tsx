"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerOfferPublic } from "@yunicity/types";
import {
  PASSPORT_DESKTOP_FLASH_BANNER_CTA,
  PASSPORT_DESKTOP_FLASH_BANNER_KICKER,
  PASSPORT_DESKTOP_FLASH_BANNER_TITLE,
  PASSPORT_DESKTOP_OFFERS_FLASH,
  buildPartnerOfferHref,
  formatPassportDesktopOfferAvailability,
  resolvePartnerImage,
} from "@yunicity/utils";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

type PassportDesktopFlashBannerProps = {
  offer: PartnerOfferPublic;
};

export function PassportDesktopFlashBanner({ offer }: PassportDesktopFlashBannerProps) {
  const coverSrc = resolvePartnerImage(
    {
      cover_image_url: offer.partner.cover_image_url,
      logo_url: offer.partner.logo_url,
      category: offer.partner.category,
    },
    "hero",
  );

  return (
    <article
      className="relative overflow-hidden rounded-[1.25rem] border border-red-100 bg-neutral-950 text-white shadow-md"
      data-passport-desktop-flash=""
    >
      <div className="absolute inset-0">
        <CulturalImage
          src={coverSrc}
          alt=""
          placeName={offer.partner.name}
          className="h-full w-full object-cover"
          sizes="(min-width: 1024px) 720px, 100vw"
          overlay={false}
          showFallbackCaption={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/70 to-neutral-950/25" />
      </div>

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-300">
            <Zap className="h-3.5 w-4 fill-red-400 text-red-400" aria-hidden />
            {PASSPORT_DESKTOP_FLASH_BANNER_KICKER} · {PASSPORT_DESKTOP_OFFERS_FLASH}
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            {PASSPORT_DESKTOP_FLASH_BANNER_TITLE(offer.partner.name)}
          </h2>
          <p className="mt-1 text-sm text-white/80">{offer.title}</p>
          <p className="mt-2 text-xs font-medium text-white/70">
            {formatPassportDesktopOfferAvailability(offer)}
          </p>
        </div>

        <Link
          href={buildPartnerOfferHref(offer)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-white/95"
        >
          {PASSPORT_DESKTOP_FLASH_BANNER_CTA}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
