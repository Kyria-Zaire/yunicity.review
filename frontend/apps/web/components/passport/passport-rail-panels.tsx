"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { PassportBookletIcon } from "@/components/passport/passport-booklet-icon";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportDesktopActivityItem, PassportDesktopSegmentProgress } from "@yunicity/utils";
import {
  PASSPORT_DESKTOP_ACTIVITY_EMPTY,
  PASSPORT_DESKTOP_ACTIVITY_TITLE,
  PASSPORT_DESKTOP_ACTIVITY_VIEW_ALL,
  PASSPORT_DESKTOP_PROGRESS_CTA,
  PASSPORT_DESKTOP_PROGRESS_RATIO,
  PASSPORT_DESKTOP_PROGRESS_REMAINING,
  PASSPORT_DESKTOP_PROGRESS_TITLE,
  PASSPORT_DESKTOP_QR_ERROR,
  PASSPORT_DESKTOP_QR_EXPAND,
  PASSPORT_DESKTOP_QR_HINT,
  PASSPORT_DESKTOP_QR_LOADING,
  PASSPORT_DESKTOP_QR_TITLE,
  PASSPORT_DESKTOP_RULES_BODY,
  PASSPORT_DESKTOP_RULES_CTA,
  PASSPORT_DESKTOP_RULES_TITLE,
  PASSPORT_DESKTOP_SAVED_EMPTY,
  PASSPORT_DESKTOP_SAVED_TITLE,
  PASSPORT_DESKTOP_SAVED_VIEW_ALL,
  PASSPORT_MEDIUM_QR_PREVIEW,
  buildPartnerOfferHref,
  partnerOfferValueLabel,
  resolvePartnerImage,
} from "@yunicity/utils";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  MapPin,
  Maximize2,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Variante de montage d'un panneau de rail. Elle existait déjà pour la mise en
 * forme ; elle porte désormais aussi la PORTÉE des identifiants.
 */
export type PassportPanelVariant = "rail" | "medium";

/**
 * ── Pourquoi une portée ─────────────────────────────────────────────────────
 * Ces panneaux sont montés DEUX FOIS : une fois par le rail droit desktop, une
 * fois par les blocs medium, les deux coexistant dans le DOM sous un portillon
 * CSS. Leurs identifiants étant écrits en dur, la page rendait dix `id`
 * dupliqués — mesuré sur /passport. Conséquences réelles : `getElementById`
 * renvoie le PREMIER nœud, donc la navigation pouvait viser la copie masquée,
 * et chaque `aria-labelledby` devenait ambigu.
 *
 * Le palier desktop garde ses identifiants historiques : toute référence
 * existante (`#passport-desktop-qr` du héros, cibles de
 * `passport-nav-contract`) reste valide. Seule la variante medium est
 * préfixée.
 */
function panelId(variant: PassportPanelVariant, nom: string): string {
  return `${variant === "medium" ? "passport-medium" : "passport-desktop"}-${nom}`;
}

/**
 * Nom LOGIQUE du panneau, identique dans les deux variantes. La navigation
 * s'en sert pour viser le panneau VISIBLE, quelle que soit la portée des `id`.
 */
function panelAnchor(nom: string): string {
  return `passport-desktop-${nom}`;
}

function ActivityIcon({ tone }: { tone: PassportDesktopActivityItem["tone"] }) {
  const className = "h-4 w-4 shrink-0";
  if (tone === "green") return <CalendarDays className={`${className} text-emerald-600`} aria-hidden />;
  if (tone === "orange") return <Tag className={`${className} text-orange-600`} aria-hidden />;
  return <MapPin className={`${className} text-yunicity-primary`} aria-hidden />;
}

type PassportQrPanelProps = {
  displayName: string;
  city: string;
  qrPayload: string | null;
  qrLoading: boolean;
  variant?: PassportPanelVariant;
};

export function PassportQrPanel({
  displayName,
  city,
  qrPayload,
  qrLoading,
  variant = "rail",
}: PassportQrPanelProps) {
  const [qrExpanded, setQrExpanded] = useState(false);
  const qrSize = variant === "medium" ? 176 : 160;

  const qrImageSrc = useMemo(
    () =>
      qrPayload
        ? `https://api.qrserver.com/v1/create-qr-code/?size=${qrExpanded ? 320 : qrSize}x${qrExpanded ? 320 : qrSize}&data=${encodeURIComponent(qrPayload)}`
        : null,
    [qrExpanded, qrPayload, qrSize],
  );

  const qrBoxClass =
    variant === "medium"
      ? "flex h-[7.25rem] w-[7.25rem] shrink-0 flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white p-2"
      : "flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white p-2";

  return (
    <>
      <section
        id={panelId(variant, "qr")}
        data-passport-anchor={panelAnchor("qr")}
        className="scroll-mt-28 feed-desktop-surface overflow-hidden"
        aria-labelledby={panelId(variant, "qr-title")}
      >
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 id={panelId(variant, "qr-title")} className="text-sm font-bold text-neutral-900">
            {PASSPORT_DESKTOP_QR_TITLE}
          </h2>
        </div>

        <div className={`flex items-start gap-3 p-4 ${variant === "medium" ? "sm:gap-4" : ""}`}>
          <div className={qrBoxClass}>
            {qrLoading ? (
              <span className="text-center text-[10px] text-neutral-500">{PASSPORT_DESKTOP_QR_LOADING}</span>
            ) : qrImageSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageSrc} alt={PASSPORT_DESKTOP_QR_TITLE} className="h-full w-full" />
                {variant === "medium" ? (
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                    {PASSPORT_MEDIUM_QR_PREVIEW}
                  </p>
                ) : null}
              </>
            ) : (
              <span className="text-center text-[10px] leading-tight text-neutral-500">
                {PASSPORT_DESKTOP_QR_ERROR}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="truncate text-sm font-bold text-neutral-900">{displayName}</p>
            <p className="text-xs text-neutral-500">Passport {city}</p>
            <PassportBookletIcon className="mt-2 h-5 w-4 text-yunicity-primary" />
          </div>
        </div>

        <div className="border-t border-neutral-100 p-3">
          <button
            type="button"
            onClick={() => setQrExpanded(true)}
            disabled={!qrImageSrc}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-50"
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
            {PASSPORT_DESKTOP_QR_EXPAND}
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{PASSPORT_DESKTOP_QR_HINT}</p>
        </div>
      </section>

      {qrExpanded && qrImageSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="passport-qr-expanded-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 id="passport-qr-expanded-title" className="text-base font-bold text-neutral-900">
              {PASSPORT_DESKTOP_QR_TITLE}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {displayName} · Passport {city}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageSrc} alt={PASSPORT_DESKTOP_QR_TITLE} className="mx-auto mt-4 h-56 w-56" />
            <p className="mt-3 text-center text-xs text-neutral-500">{PASSPORT_DESKTOP_QR_HINT}</p>
            <button
              type="button"
              onClick={() => setQrExpanded(false)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

type PassportProgressPanelProps = {
  segmentProgress: PassportDesktopSegmentProgress;
  onOpenProgress: () => void;
  variant?: PassportPanelVariant;
};

export function PassportProgressPanel({
  segmentProgress,
  onOpenProgress,
  variant = "rail",
}: PassportProgressPanelProps) {
  return (
    <section
      className="feed-desktop-surface p-4"
      data-passport-anchor={panelAnchor("progress")}
      aria-labelledby={panelId(variant, "progress-title")}
    >
      <h2 id={panelId(variant, "progress-title")} className="text-sm font-bold text-neutral-900">
        {PASSPORT_DESKTOP_PROGRESS_TITLE}
      </h2>
      <p className="mt-3 text-3xl font-bold tabular-nums text-neutral-900">
        {PASSPORT_DESKTOP_PROGRESS_RATIO(segmentProgress.completed, segmentProgress.total)}
      </p>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: segmentProgress.total }).map((_, index) => (
          <span
            key={index}
            className={`h-2 flex-1 rounded-full ${index < segmentProgress.completed ? "bg-yunicity-primary" : "bg-neutral-200"}`}
            aria-hidden
          />
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-neutral-600">
        {PASSPORT_DESKTOP_PROGRESS_REMAINING(segmentProgress.remaining)}
      </p>
      <button
        type="button"
        onClick={onOpenProgress}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-yunicity-primary/30 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
      >
        {PASSPORT_DESKTOP_PROGRESS_CTA}
      </button>
    </section>
  );
}

type PassportSavedPanelProps = {
  savedOffers: PartnerOfferPublic[];
  variant?: PassportPanelVariant;
};

export function PassportSavedPanel({ savedOffers, variant = "rail" }: PassportSavedPanelProps) {
  return (
    <section
      id={panelId(variant, "saved")}
      data-passport-anchor={panelAnchor("saved")}
      className="scroll-mt-28 feed-desktop-surface overflow-hidden"
      aria-labelledby={panelId(variant, "saved-title")}
    >
      <div className="border-b border-neutral-100 px-4 py-3">
        <h2 id={panelId(variant, "saved-title")} className="text-sm font-bold text-neutral-900">
          {PASSPORT_DESKTOP_SAVED_TITLE}
        </h2>
      </div>

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
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-100">
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
                  <Bookmark className="h-4 w-4 shrink-0 fill-neutral-800 text-neutral-800" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {savedOffers.length > 0 ? (
        <div className="border-t border-neutral-100 p-3">
          <Link
            href="#passport-desktop-offers"
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PASSPORT_DESKTOP_SAVED_VIEW_ALL}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : null}
    </section>
  );
}

type PassportActivityPanelProps = {
  activityItems: PassportDesktopActivityItem[];
  onOpenHistory: () => void;
  variant?: PassportPanelVariant;
};

export function PassportActivityPanel({
  activityItems,
  onOpenHistory,
  variant = "rail",
}: PassportActivityPanelProps) {
  return (
    <section
      id={panelId(variant, "history")}
      data-passport-anchor={panelAnchor("history")}
      className="scroll-mt-28 feed-desktop-surface overflow-hidden"
      aria-labelledby={panelId(variant, "activity-title")}
    >
      <div className="border-b border-neutral-100 px-4 py-3">
        <h2 id={panelId(variant, "activity-title")} className="text-sm font-bold text-neutral-900">
          {PASSPORT_DESKTOP_ACTIVITY_TITLE}
        </h2>
      </div>

      {activityItems.length === 0 ? (
        <p className="px-4 py-4 text-sm text-neutral-500">{PASSPORT_DESKTOP_ACTIVITY_EMPTY}</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {activityItems.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50">
                  <ActivityIcon tone={item.tone} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  <p className="truncate text-xs text-neutral-600">{item.subtitle}</p>
                </div>
                <p className="shrink-0 pt-0.5 text-[11px] text-neutral-500">{item.dateLabel}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-neutral-100 p-3">
        <button
          type="button"
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PASSPORT_DESKTOP_ACTIVITY_VIEW_ALL}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

export function PassportRulesPanel({ variant = "rail" }: { variant?: PassportPanelVariant } = {}) {
  return (
    <section
      className="feed-desktop-surface p-4"
      data-passport-anchor={panelAnchor("rules")}
      aria-labelledby={panelId(variant, "rules-title")}
      data-passport-rules-panel=""
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
        <div>
          <h2 id={panelId(variant, "rules-title")} className="text-sm font-bold text-neutral-900">
            {PASSPORT_DESKTOP_RULES_TITLE}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{PASSPORT_DESKTOP_RULES_BODY}</p>
          <Link
            href="#passport-desktop-how"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PASSPORT_DESKTOP_RULES_CTA}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
