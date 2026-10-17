"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { PassportBookletIcon } from "@/components/passport/passport-booklet-icon";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportDesktopSegmentProgress, PassportLevelView } from "@yunicity/utils";
import {
  PASSPORT_DESKTOP_HERO_SEGMENT_LABEL,
  PASSPORT_DESKTOP_OFFERS_CONDITIONS_BODY,
  PASSPORT_DESKTOP_OFFERS_CONDITIONS_CTA,
  PASSPORT_DESKTOP_OFFERS_CONDITIONS_TITLE,
  PASSPORT_DESKTOP_OFFERS_HOW_LOCK,
  PASSPORT_DESKTOP_OFFERS_HOW_STEPS,
  PASSPORT_DESKTOP_OFFERS_HOW_TITLE,
  PASSPORT_DESKTOP_OFFERS_OPEN_PASSPORT,
  PASSPORT_DESKTOP_OFFERS_PASSPORT_ACTIVE,
  PASSPORT_DESKTOP_SAVED_EMPTY,
  PASSPORT_DESKTOP_SAVED_TITLE,
  PASSPORT_DESKTOP_SAVED_VIEW_ALL,
  buildPartnerOfferHref,
  formatPassportDesktopLevelName,
  partnerOfferValueLabel,
  resolvePartnerImage,
} from "@yunicity/utils";
import { ArrowRight, Check, ChevronDown, ChevronRight, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

type PassportOffersStatusHeroProps = {
  displayName: string;
  levelView: PassportLevelView;
  segmentProgress: PassportDesktopSegmentProgress;
  onOpenPassport: () => void;
};

export function PassportOffersStatusHero({
  displayName,
  levelView,
  segmentProgress,
  onOpenPassport,
}: PassportOffersStatusHeroProps) {
  const currentLabel = formatPassportDesktopLevelName(levelView.level.label);
  const progressLabel = PASSPORT_DESKTOP_HERO_SEGMENT_LABEL(
    segmentProgress.completed,
    segmentProgress.total,
  );

  return (
    <section
      className="rounded-[1.25rem] bg-yunicity-primary px-4 py-4 text-white sm:flex sm:items-center sm:gap-4 sm:px-5 sm:py-3.5"
      aria-label="Statut Passport"
      data-passport-offers-status-hero=""
    >
      <div className="flex min-w-0 items-center gap-3 sm:flex-1">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/10">
          <PassportBookletIcon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold sm:block">
            <span className="sm:hidden">
              {currentLabel} · {progressLabel}
            </span>
            <span className="hidden sm:inline">{displayName}</span>
          </p>
          <p className="hidden truncate text-xs text-white/80 sm:block">{currentLabel}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-1 sm:hidden" aria-hidden>
        {Array.from({ length: segmentProgress.total }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < segmentProgress.completed ? "bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold sm:mt-0 sm:shrink-0">
        <Check className="h-4 w-4 text-emerald-300" aria-hidden />
        {PASSPORT_DESKTOP_OFFERS_PASSPORT_ACTIVE}
      </p>

      <button
        type="button"
        onClick={onOpenPassport}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/70 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:mt-0 sm:w-auto sm:border-0 sm:bg-white sm:text-yunicity-primary sm:hover:bg-white/90"
      >
        {PASSPORT_DESKTOP_OFFERS_OPEN_PASSPORT}
      </button>
    </section>
  );
}

type PassportOffersSavedListProps = {
  savedOffers: PartnerOfferPublic[];
  onViewAllSaved: () => void;
  titleId: string;
  hideHeader?: boolean;
};

export function PassportOffersSavedList({
  savedOffers,
  onViewAllSaved,
  titleId,
  hideHeader = false,
}: PassportOffersSavedListProps) {
  return (
    <section className={hideHeader ? "" : "feed-desktop-surface overflow-hidden"} aria-labelledby={hideHeader ? undefined : titleId}>
      {hideHeader ? null : (
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 id={titleId} className="text-sm font-bold text-neutral-900">
            {PASSPORT_DESKTOP_SAVED_TITLE}
          </h2>
        </div>
      )}
      {savedOffers.length === 0 ? (
        <p className="px-4 py-4 text-sm text-neutral-500">{PASSPORT_DESKTOP_SAVED_EMPTY}</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {savedOffers.map((offer) => {
            const logoSrc = resolvePartnerImage(
              {
                cover_image_url: offer.partner.cover_image_url,
                logo_url: offer.partner.logo_url,
                category: offer.partner.category,
              },
              "card",
            );
            return (
              <li key={offer.id}>
                <Link
                  href={buildPartnerOfferHref(offer)}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    <CulturalImage
                      src={logoSrc}
                      alt=""
                      placeName={offer.partner.name}
                      className="h-full w-full object-cover"
                      sizes="40px"
                      overlay={false}
                      showFallbackCaption={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{offer.partner.name}</p>
                    <p className="truncate text-xs text-neutral-500">{partnerOfferValueLabel(offer)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {savedOffers.length > 0 ? (
        <div className="border-t border-neutral-100 p-3">
          <button
            type="button"
            onClick={onViewAllSaved}
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PASSPORT_DESKTOP_SAVED_VIEW_ALL}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function PassportOffersHowPanel({
  titleId,
  hideHeader = false,
}: {
  titleId: string;
  hideHeader?: boolean;
}) {
  return (
    <section className={hideHeader ? "px-4 pb-4" : "feed-desktop-surface p-4"} aria-labelledby={titleId}>
      {hideHeader ? null : (
        <h2 id={titleId} className="text-sm font-bold text-neutral-900">
          {PASSPORT_DESKTOP_OFFERS_HOW_TITLE}
        </h2>
      )}
      <ol className={hideHeader ? "space-y-3" : "mt-4 space-y-3"}>
        {PASSPORT_DESKTOP_OFFERS_HOW_STEPS.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-xs font-bold text-yunicity-primary">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
              <p className="mt-0.5 text-xs text-neutral-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 inline-flex items-start gap-2 text-[11px] leading-relaxed text-neutral-500">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {PASSPORT_DESKTOP_OFFERS_HOW_LOCK}
      </p>
    </section>
  );
}

export function PassportOffersAccordion({
  title,
  titleId,
  defaultOpen = true,
  children,
}: {
  title: string;
  titleId: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="feed-desktop-surface overflow-hidden" aria-labelledby={titleId}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left"
      >
        <h2 id={titleId} className="text-sm font-bold text-neutral-900">
          {title}
        </h2>
        <ChevronDown
          className={`h-4 w-4 text-neutral-500 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? children : null}
    </section>
  );
}

export function PassportOffersConditionsBanner({ titleId }: { titleId: string }) {
  return (
    <section className="feed-desktop-surface p-4" aria-labelledby={titleId}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
        <div>
          <h2 id={titleId} className="text-sm font-bold text-neutral-900">
            {PASSPORT_DESKTOP_OFFERS_CONDITIONS_TITLE}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {PASSPORT_DESKTOP_OFFERS_CONDITIONS_BODY}
          </p>
          <Link
            href="#passport-desktop-how"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PASSPORT_DESKTOP_OFFERS_CONDITIONS_CTA}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
