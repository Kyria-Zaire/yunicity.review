"use client";

import { PassportBookletIcon } from "@/components/passport/passport-booklet-icon";
import { PassportOfferQrDialog } from "@/components/passport/offer-detail/passport-offer-qr-dialog";
import type { PassportDesktopSegmentProgress } from "@yunicity/utils";
import {
  PASSPORT_DESKTOP_HERO_SEGMENT_LABEL,
  PASSPORT_OFFER_DETAIL_ELIGIBLE,
  PASSPORT_OFFER_DETAIL_HISTORY,
  PASSPORT_OFFER_DETAIL_QR_CAPTION,
  PASSPORT_OFFER_DETAIL_QR_CAPTION_SHORT,
  PASSPORT_OFFER_DETAIL_SHOW_QR,
  PASSPORT_OFFER_DETAIL_YOUR_PASSPORT,
  formatPassportDesktopLevelName,
} from "@yunicity/utils";
import { Check } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type PassportOfferStatusCardProps = {
  city: string;
  displayName: string;
  levelLabel: string;
  segmentProgress: PassportDesktopSegmentProgress;
  qrPayload: string | null;
  qrLoading: boolean;
};

export function PassportOfferStatusCard({
  city,
  displayName,
  levelLabel,
  segmentProgress,
  qrPayload,
  qrLoading,
}: PassportOfferStatusCardProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const qrImageSrc = useMemo(
    () =>
      qrPayload
        ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrPayload)}`
        : null,
    [qrPayload],
  );

  return (
    <div className="passport-offer-area-status">
      <section
        className="passport-offer-status feed-desktop-surface"
        aria-label={PASSPORT_OFFER_DETAIL_YOUR_PASSPORT}
        data-passport-offer-status=""
        data-passport-offer-desktop-sidebar=""
      >
        <div className="passport-offer-status-progress">
          <div className="flex items-center gap-2 bg-yunicity-primary px-4 py-3 text-white">
            <PassportBookletIcon className="h-4 w-4" />
            <h2 className="text-sm font-bold">{PASSPORT_OFFER_DETAIL_YOUR_PASSPORT}</h2>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <p className="passport-offer-status-level-split text-base font-bold text-neutral-900">
                {formatPassportDesktopLevelName(levelLabel)}
              </p>
              <p className="passport-offer-status-level-split mt-0.5 text-sm text-neutral-500">
                {PASSPORT_DESKTOP_HERO_SEGMENT_LABEL(segmentProgress.completed, segmentProgress.total)}
              </p>
              <p className="passport-offer-status-level-mobile text-base font-bold text-neutral-900">
                {formatPassportDesktopLevelName(levelLabel)} ·{" "}
                {PASSPORT_DESKTOP_HERO_SEGMENT_LABEL(segmentProgress.completed, segmentProgress.total)}
              </p>
              <div className="mt-3 flex gap-1" aria-hidden>
                {Array.from({ length: segmentProgress.total }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${
                      index < segmentProgress.completed ? "bg-yunicity-primary" : "bg-neutral-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="passport-offer-status-eligible">
          <p className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            <Check className="h-4 w-4" aria-hidden />
            {PASSPORT_OFFER_DETAIL_ELIGIBLE}
          </p>
        </div>

        <div className="passport-offer-status-actions">
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            disabled={!qrImageSrc && !qrLoading}
            className="inline-flex w-full min-h-11 items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-50"
          >
            {PASSPORT_OFFER_DETAIL_SHOW_QR}
          </button>
          <p className="passport-offer-qr-caption-long text-center text-[11px] leading-relaxed text-neutral-500">
            {PASSPORT_OFFER_DETAIL_QR_CAPTION}
          </p>
          <p className="passport-offer-qr-caption-short text-center text-[11px] leading-relaxed text-neutral-500">
            {PASSPORT_OFFER_DETAIL_QR_CAPTION_SHORT}
          </p>
          <Link
            href="/passport#passport-desktop-history"
            className="inline-flex w-full min-h-11 items-center justify-center rounded-xl border border-yunicity-primary/40 bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            {PASSPORT_OFFER_DETAIL_HISTORY}
          </Link>
        </div>
      </section>

      <PassportOfferQrDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        displayName={displayName}
        city={city}
        qrImageSrc={qrImageSrc}
        qrLoading={qrLoading}
      />
    </div>
  );
}
