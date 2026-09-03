"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { PassportMediumCategoryBar, PassportMediumTabNav } from "@/components/passport/medium";
import {
  PassportOffersAccordion,
  PassportOffersConditionsBanner,
  PassportOffersHowPanel,
  PassportOffersSavedList,
  PassportOffersStatusHero,
} from "@/components/passport/passport-offers-panels";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportDesktopSegmentProgress, PassportLevelView, PassportNavId } from "@yunicity/utils";
import {
  PASSPORT_DESKTOP_OFFERS_ALL_SUBTITLE,
  PASSPORT_DESKTOP_OFFERS_ALL_TITLE,
  PASSPORT_DESKTOP_OFFERS_CTA,
  PASSPORT_DESKTOP_OFFERS_AVAILABLE,
  PASSPORT_DESKTOP_OFFERS_ELIGIBLE,
  PASSPORT_DESKTOP_OFFERS_ELIGIBLE_SHORT,
  PASSPORT_DESKTOP_OFFERS_EMPTY,
  PASSPORT_DESKTOP_OFFERS_FEATURED_TITLE,
  PASSPORT_DESKTOP_OFFERS_FILTER_AVAILABLE,
  PASSPORT_DESKTOP_OFFERS_FILTER_SAVED,
  PASSPORT_DESKTOP_OFFERS_HOW_TITLE,
  PASSPORT_DESKTOP_OFFERS_PARTNER_TERMS,
  PASSPORT_DESKTOP_OFFERS_SAVE,
  PASSPORT_DESKTOP_OFFERS_SEARCH_PLACEHOLDER,
  PASSPORT_DESKTOP_OFFERS_SHOW_MORE,
  PASSPORT_DESKTOP_OFFERS_SORT_RECENT,
  PASSPORT_DESKTOP_SAVED_TITLE,
  PASSPORT_MOBILE_OFFERS_ALL_TITLE,
  PASSPORT_MOBILE_OFFERS_FILTER_AVAILABLE,
  PASSPORT_MOBILE_OFFERS_FILTER_SAVED,
  buildPartnerOfferHref,
  formatPassportDesktopOfferAvailability,
  formatPassportDesktopOfferDeadline,
  partnerDisplayCategory,
  partnerOfferFlashLabel,
  partnerOfferValueLabel,
  resolvePartnerImage,
  resolvePassportDesktopCategoryTone,
} from "@yunicity/utils";
import { Bookmark, CalendarDays, Check, ChevronDown, ChevronRight, Clock3, Info, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type PassportDesktopOffersTabProps = {
  city: string;
  offers: PartnerOfferPublic[];
  featuredOffer: PartnerOfferPublic | null;
  savedIds: ReadonlySet<string>;
  activeNav: PassportNavId;
  onNavigate: (targetId: string, navId: PassportNavId) => void;
  categoryId: string;
  onCategoryChange: (categoryId: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  availableNow: boolean;
  onAvailableNowChange: (value: boolean) => void;
  savedOnly: boolean;
  onSavedOnlyChange: (value: boolean) => void;
  onToggleSaved: (offerId: string) => void;
  displayName: string;
  levelView: PassportLevelView;
  segmentProgress: PassportDesktopSegmentProgress;
  savedOffers: PartnerOfferPublic[];
  onOpenPassport: () => void;
  onViewAllSaved: () => void;
};

function OfferLogo({ offer, className }: { offer: PartnerOfferPublic; className?: string }) {
  const logoSrc = resolvePartnerImage(
    {
      cover_image_url: offer.partner.cover_image_url,
      logo_url: offer.partner.logo_url,
      category: offer.partner.category,
    },
    "card",
  );
  return (
    <div className={className ?? "h-11 w-11 overflow-hidden rounded-full border-[3px] border-white bg-white shadow"}>
      <CulturalImage
        src={logoSrc}
        alt=""
        placeName={offer.partner.name}
        className="h-full w-full object-cover"
        sizes="44px"
        overlay={false}
        showFallbackCaption={false}
      />
    </div>
  );
}

export function PassportDesktopOffersTab({
  city,
  offers,
  featuredOffer,
  savedIds,
  activeNav,
  onNavigate,
  categoryId,
  onCategoryChange,
  query,
  onQueryChange,
  availableNow,
  onAvailableNowChange,
  savedOnly,
  onSavedOnlyChange,
  onToggleSaved,
  displayName,
  levelView,
  segmentProgress,
  savedOffers,
  onOpenPassport,
  onViewAllSaved,
}: PassportDesktopOffersTabProps) {
  const [visibleCount, setVisibleCount] = useState(6);
  const visible = offers.slice(0, visibleCount);

  return (
    <div className="space-y-5" data-passport-desktop-offers-tab="">
      <div className="passport-desktop-shell-only">
        <PassportMediumTabNav activeNav={activeNav} onNavigate={onNavigate} />
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={PASSPORT_DESKTOP_OFFERS_SEARCH_PLACEHOLDER}
          className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-4 text-sm text-neutral-800 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
        />
      </label>

      <PassportMediumCategoryBar
        activeCategory={categoryId}
        onCategorySelect={onCategoryChange}
        onNavigateOffers={() => onNavigate("passport-desktop-offers", "offers")}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={availableNow}
          onClick={() => onAvailableNowChange(!availableNow)}
          className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition sm:flex-none sm:rounded-full ${
            availableNow
              ? "border-yunicity-primary bg-yunicity-primary text-white"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
          }`}
        >
          <Clock3 className="h-4 w-4" aria-hidden />
          <span className="sm:hidden">{PASSPORT_MOBILE_OFFERS_FILTER_AVAILABLE}</span>
          <span className="hidden sm:inline">{PASSPORT_DESKTOP_OFFERS_FILTER_AVAILABLE}</span>
        </button>
        <button
          type="button"
          aria-pressed={savedOnly}
          onClick={() => onSavedOnlyChange(!savedOnly)}
          className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition sm:flex-none sm:rounded-full ${
            savedOnly
              ? "border-yunicity-primary bg-yunicity-primary text-white"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
          }`}
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          <span className="sm:hidden">{PASSPORT_MOBILE_OFFERS_FILTER_SAVED}</span>
          <span className="hidden sm:inline">{PASSPORT_DESKTOP_OFFERS_FILTER_SAVED}</span>
        </button>
        <button
          type="button"
          aria-label="Filtres"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 sm:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
        </button>
        <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 sm:inline-flex">
          {PASSPORT_DESKTOP_OFFERS_SORT_RECENT}
          <ChevronDown className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <div className="passport-medium-only">
        <PassportOffersStatusHero
          displayName={displayName}
          levelView={levelView}
          segmentProgress={segmentProgress}
          onOpenPassport={onOpenPassport}
        />
      </div>

      {featuredOffer ? (
        <FeaturedOfferCard
          offer={featuredOffer}
          saved={savedIds.has(featuredOffer.id)}
          onToggleSaved={() => onToggleSaved(featuredOffer.id)}
        />
      ) : null}

      <section aria-labelledby="passport-offers-all-title">
        <div className="mb-3 sm:mb-4">
          <h2 id="passport-offers-all-title" className="text-lg font-bold text-neutral-900">
            <span className="sm:hidden">{PASSPORT_MOBILE_OFFERS_ALL_TITLE}</span>
            <span className="hidden sm:inline">{PASSPORT_DESKTOP_OFFERS_ALL_TITLE}</span>
          </h2>
          <p className="mt-0.5 hidden text-sm text-neutral-500 sm:block">
            {PASSPORT_DESKTOP_OFFERS_ALL_SUBTITLE(city)}
          </p>
        </div>

        {visible.length === 0 ? (
          <p className="feed-desktop-surface px-6 py-10 text-center text-sm text-neutral-600">
            {PASSPORT_DESKTOP_OFFERS_EMPTY}
          </p>
        ) : (
          <>
            <ul className="feed-desktop-surface divide-y divide-neutral-100 overflow-hidden sm:hidden">
              {visible.map((offer) => (
                <li key={`row-${offer.id}`}>
                  <OfferListRow
                    offer={offer}
                    saved={savedIds.has(offer.id)}
                    onToggleSaved={() => onToggleSaved(offer.id)}
                  />
                </li>
              ))}
            </ul>
            <ul className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((offer) => (
                <li key={offer.id}>
                  <OfferGridCard
                    offer={offer}
                    saved={savedIds.has(offer.id)}
                    onToggleSaved={() => onToggleSaved(offer.id)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        {offers.length > visibleCount ? (
          <div className="mt-4 sm:mt-6">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + 6)}
              className="inline-flex w-full items-center justify-center rounded-xl border border-yunicity-primary bg-white px-5 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] sm:mx-auto sm:max-w-xl"
            >
              {PASSPORT_DESKTOP_OFFERS_SHOW_MORE}
            </button>
          </div>
        ) : null}
      </section>

      <div className="space-y-3 sm:hidden">
        <PassportOffersAccordion title={PASSPORT_DESKTOP_SAVED_TITLE} titleId="passport-offers-saved-title-mobile">
          <PassportOffersSavedList
            savedOffers={savedOffers}
            onViewAllSaved={onViewAllSaved}
            titleId="passport-offers-saved-title-mobile-list"
            hideHeader
          />
        </PassportOffersAccordion>
        <PassportOffersAccordion title={PASSPORT_DESKTOP_OFFERS_HOW_TITLE} titleId="passport-offers-how-title-mobile">
          <PassportOffersHowPanel titleId="passport-offers-how-title-mobile-body" hideHeader />
        </PassportOffersAccordion>
        <PassportOffersConditionsBanner titleId="passport-offers-conditions-title-mobile" />
      </div>

      <div className="hidden space-y-4 sm:block lg:hidden">
        <div className="passport-medium-grid-2">
          <PassportOffersSavedList
            savedOffers={savedOffers}
            onViewAllSaved={onViewAllSaved}
            titleId="passport-offers-saved-title-medium"
          />
          <PassportOffersHowPanel titleId="passport-offers-how-title-medium" />
        </div>
        <PassportOffersConditionsBanner titleId="passport-offers-conditions-title-medium" />
      </div>
    </div>
  );
}

function FeaturedOfferCard({
  offer,
  saved,
  onToggleSaved,
}: {
  offer: PartnerOfferPublic;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const flashLabel = partnerOfferFlashLabel(offer);
  const category = partnerDisplayCategory(offer.partner);
  const coverSrc = resolvePartnerImage(
    {
      cover_image_url: offer.partner.cover_image_url,
      logo_url: offer.partner.logo_url,
      category: offer.partner.category,
    },
    "hero",
  );

  return (
    <section aria-labelledby="passport-offers-featured-title" className="space-y-3">
      <h2 id="passport-offers-featured-title" className="text-lg font-bold text-neutral-900">
        {PASSPORT_DESKTOP_OFFERS_FEATURED_TITLE}
      </h2>
      <article className="relative overflow-hidden rounded-[1.35rem] bg-neutral-900 text-white">
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
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-neutral-900/55 to-neutral-900/20" />
        </div>
        <div className="relative flex min-h-[16rem] flex-col justify-end gap-3 p-5 sm:min-h-[18rem] sm:p-6">
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <OfferLogo offer={offer} />
              <span className="rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {category}
              </span>
              {flashLabel ? (
                <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  {flashLabel}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={saved}
              aria-label={PASSPORT_DESKTOP_OFFERS_SAVE}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-900 shadow-sm sm:hidden"
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-neutral-900" : ""}`} aria-hidden />
            </button>
          </div>
          <div className="mt-10">
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {offer.title || `Avantage chez ${offer.partner.name}`}
            </h3>
            <p className="mt-1 text-sm text-white/85">{partnerOfferValueLabel(offer)}</p>
          </div>
          <p className="inline-flex items-center gap-2 text-xs text-white/80">
            <CalendarDays className="h-4 w-4 sm:hidden" aria-hidden />
            <Clock3 className="hidden h-4 w-4 sm:inline" aria-hidden />
            <span className="sm:hidden">
              {formatPassportDesktopOfferDeadline(offer) ?? formatPassportDesktopOfferAvailability(offer)}
            </span>
            <span className="hidden sm:inline">{formatPassportDesktopOfferAvailability(offer)}</span>
          </p>
          <p className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-white">
            <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
            <span className="sm:hidden">{PASSPORT_DESKTOP_OFFERS_ELIGIBLE_SHORT}</span>
            <span className="hidden sm:inline">{PASSPORT_DESKTOP_OFFERS_ELIGIBLE}</span>
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={saved}
              aria-label={PASSPORT_DESKTOP_OFFERS_SAVE}
              className="hidden h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 sm:inline-flex"
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-white" : ""}`} aria-hidden />
            </button>
            <Link
              href={buildPartnerOfferHref(offer)}
              className="inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover sm:w-auto"
            >
              {PASSPORT_DESKTOP_OFFERS_CTA}
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}

function OfferListRow({
  offer,
  saved,
  onToggleSaved,
}: {
  offer: PartnerOfferPublic;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const category = partnerDisplayCategory(offer.partner);
  const categoryPill = categoryPillClass(category);
  const terms = offer.conditions?.trim();
  const coverSrc = resolvePartnerImage(
    {
      cover_image_url: offer.partner.cover_image_url,
      logo_url: offer.partner.logo_url,
      category: offer.partner.category,
    },
    "hero",
  );

  return (
    <article className="flex items-center gap-3 px-3 py-3">
      <Link href={buildPartnerOfferHref(offer)} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative h-[4.5rem] w-[5.75rem] shrink-0 overflow-hidden rounded-xl bg-neutral-100">
          <CulturalImage
            src={coverSrc}
            alt=""
            placeName={offer.partner.name}
            className="h-full w-full object-cover"
            sizes="92px"
            overlay={false}
            showFallbackCaption={false}
          />
          <div className="absolute left-1 top-1/2 -translate-y-1/2">
            <OfferLogo offer={offer} className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-white shadow" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryPill}`}>
            {category}
          </span>
          <h3 className="mt-1 truncate text-sm font-bold text-neutral-900">{offer.partner.name}</h3>
          <p className="truncate text-xs text-neutral-600">{partnerOfferValueLabel(offer)}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-neutral-500">
            {terms ? (
              <Info className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
            ) : (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            )}
            <span className="truncate">
              {terms ? PASSPORT_DESKTOP_OFFERS_PARTNER_TERMS : PASSPORT_DESKTOP_OFFERS_AVAILABLE}
            </span>
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleSaved}
          aria-pressed={saved}
          aria-label={PASSPORT_DESKTOP_OFFERS_SAVE}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500"
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-neutral-800 text-neutral-800" : ""}`} aria-hidden />
        </button>
        <Link
          href={buildPartnerOfferHref(offer)}
          aria-label={PASSPORT_DESKTOP_OFFERS_CTA}
          className="inline-flex h-10 w-8 items-center justify-center text-neutral-400"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function categoryPillClass(category: string): string {
  const tone = resolvePassportDesktopCategoryTone(category);
  if (tone.includes("orange")) return "bg-orange-50 text-orange-600";
  if (tone.includes("emerald")) return "bg-emerald-50 text-emerald-700";
  if (tone.includes("violet")) return "bg-violet-50 text-violet-700";
  return "bg-[#EEF0FF] text-yunicity-primary";
}

function OfferGridCard({
  offer,
  saved,
  onToggleSaved,
}: {
  offer: PartnerOfferPublic;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const flashLabel = partnerOfferFlashLabel(offer);
  const category = partnerDisplayCategory(offer.partner);
  const categoryPill = categoryPillClass(category);
  const terms = offer.conditions?.trim();
  const coverSrc = resolvePartnerImage(
    {
      cover_image_url: offer.partner.cover_image_url,
      logo_url: offer.partner.logo_url,
      category: offer.partner.category,
    },
    "hero",
  );

  return (
    <article className="feed-desktop-surface overflow-visible">
      <div className="relative h-40 overflow-visible bg-neutral-100">
        <div className="h-40 overflow-hidden">
          <CulturalImage
            src={coverSrc}
            alt=""
            placeName={offer.partner.name}
            className="h-full w-full object-cover"
            sizes="(min-width: 1280px) 280px, 50vw"
            overlay={false}
            showFallbackCaption={false}
          />
        </div>
        <div className="absolute -bottom-5 left-3 z-[1]">
          <OfferLogo offer={offer} />
        </div>
        {flashLabel ? (
          <span className="absolute right-3 top-3 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {flashLabel}
          </span>
        ) : null}
      </div>
      <div className="space-y-3 px-4 pb-4 pt-7">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryPill}`}>
          {category}
        </span>
        <div>
          <h3 className="text-base font-bold text-neutral-900">{offer.partner.name}</h3>
          <p className="mt-1 text-sm text-neutral-600">{partnerOfferValueLabel(offer)}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
            {terms ? (
              <Info className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
            ) : (
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            )}
            {terms ? PASSPORT_DESKTOP_OFFERS_PARTNER_TERMS : PASSPORT_DESKTOP_OFFERS_AVAILABLE}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSaved}
            aria-pressed={saved}
            aria-label={PASSPORT_DESKTOP_OFFERS_SAVE}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-neutral-800 text-neutral-800" : ""}`} aria-hidden />
          </button>
          <Link
            href={buildPartnerOfferHref(offer)}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-yunicity-primary/35 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            {PASSPORT_DESKTOP_OFFERS_CTA}
          </Link>
        </div>
      </div>
    </article>
  );
}
