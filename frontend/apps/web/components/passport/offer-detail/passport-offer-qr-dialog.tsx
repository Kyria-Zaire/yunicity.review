"use client";

import {
  PASSPORT_DESKTOP_QR_ERROR,
  PASSPORT_DESKTOP_QR_LOADING,
  PASSPORT_DESKTOP_QR_TITLE,
  PASSPORT_OFFER_DETAIL_QR_CAPTION,
} from "@yunicity/utils";

type PassportOfferQrDialogProps = {
  open: boolean;
  onClose: () => void;
  displayName: string;
  city: string;
  qrImageSrc: string | null;
  qrLoading: boolean;
};

export function PassportOfferQrDialog({
  open,
  onClose,
  displayName,
  city,
  qrImageSrc,
  qrLoading,
}: PassportOfferQrDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="passport-offer-qr-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h2 id="passport-offer-qr-title" className="text-base font-bold text-neutral-900">
          {PASSPORT_DESKTOP_QR_TITLE}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {displayName} · Passport {city}
        </p>
        {qrLoading ? (
          <p className="mt-6 text-center text-sm text-neutral-500">{PASSPORT_DESKTOP_QR_LOADING}</p>
        ) : qrImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImageSrc} alt={PASSPORT_DESKTOP_QR_TITLE} className="mx-auto mt-4 h-56 w-56" />
        ) : (
          <p className="mt-6 text-center text-sm text-neutral-500">{PASSPORT_DESKTOP_QR_ERROR}</p>
        )}
        <p className="mt-3 text-center text-xs text-neutral-500">{PASSPORT_OFFER_DETAIL_QR_CAPTION}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
