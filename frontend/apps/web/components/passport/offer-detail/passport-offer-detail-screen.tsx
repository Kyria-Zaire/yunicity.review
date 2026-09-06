"use client";

import { PassportAppShell } from "@/components/passport/passport-app-shell";
import { PassportErrorState } from "@/components/passport/passport-error-state";
import { PassportLoadingState } from "@/components/passport/passport-loading-state";
import { PassportOfferDesktopView } from "@/components/passport/offer-detail/passport-offer-desktop-view";
import { PassportOfferMobileView } from "@/components/passport/offer-detail/mobile";
import { PassportSessionExpiredState } from "@/components/passport/passport-session-expired-state";
import { usePassportOfferDetail } from "@/hooks/use-passport-offer-detail";
import { yunicityBtnPrimaryLg } from "@/lib/brand-classes";
import {
  PASSPORT_ACTIVATE_BODY,
  PASSPORT_ACTIVATE_CTA,
  PASSPORT_ACTIVATE_TITLE,
  PASSPORT_OFFER_DETAIL_BACK,
  PASSPORT_OFFER_DETAIL_NOT_FOUND,
  buildPassportDesktopSegmentProgress,
  buildPassportLevel,
  buildPassportLevelFromReputation,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo } from "react";

type PassportOfferDetailScreenProps = {
  offerId: string;
};

export function PassportOfferDetailScreen({ offerId }: PassportOfferDetailScreenProps) {
  const {
    overview,
    badges,
    challenges,
    profile,
    error,
    isLoading,
    needsActivation,
    isSessionExpired,
    isActivating,
    reload,
    activate,
    extras,
    offersLoading,
    offer,
    related,
    city,
    displayName,
  } = usePassportOfferDetail(offerId);

  const levelView = useMemo(() => {
    if (!overview) return null;
    if (extras.passportMe) return buildPassportLevel(extras.passportMe);
    return buildPassportLevelFromReputation(
      overview.reputation.total_points,
      overview.summary.passport_tier ?? "Citoyen",
    );
  }, [extras.passportMe, overview]);

  const segmentProgress = useMemo(
    () => (levelView ? buildPassportDesktopSegmentProgress(levelView) : null),
    [levelView],
  );

  const activationCard = (
    <div className="mx-auto max-w-lg rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-neutral-900">{PASSPORT_ACTIVATE_TITLE}</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{PASSPORT_ACTIVATE_BODY}</p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => void activate()}
        disabled={isActivating}
        className={`mt-6 w-full ${yunicityBtnPrimaryLg} disabled:opacity-60`}
      >
        {isActivating ? "Activation…" : PASSPORT_ACTIVATE_CTA}
      </button>
    </div>
  );

  return (
    <PassportAppShell variant="offer-detail">
      {isSessionExpired ? (
        <div className="px-4 py-8 sm:px-6">
          <PassportSessionExpiredState />
        </div>
      ) : isLoading ? (
        <div className="px-4 py-8 sm:px-6">
          <p className="sr-only" role="status">
            Chargement de votre passeport…
          </p>
          <PassportLoadingState />
        </div>
      ) : error && !needsActivation ? (
        <div className="px-4 py-8 sm:px-6">
          <PassportErrorState message={error} onRetry={() => void reload()} />
        </div>
      ) : needsActivation || !overview || !badges || !challenges || !profile ? (
        <div className="px-4 py-8 sm:px-6">{activationCard}</div>
      ) : offersLoading || !segmentProgress || !levelView ? (
        <div className="px-4 py-8 sm:px-6">
          <PassportLoadingState />
        </div>
      ) : !offer ? (
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-base font-semibold text-neutral-900">{PASSPORT_OFFER_DETAIL_NOT_FOUND}</p>
          <Link href="/passport" className="mt-4 inline-block text-sm font-semibold text-yunicity-primary hover:underline">
            {PASSPORT_OFFER_DETAIL_BACK}
          </Link>
        </div>
      ) : (
        <>
          <PassportOfferMobileView
            offer={offer}
            related={related}
            city={city}
            displayName={displayName}
            levelLabel={levelView.level.label}
            segmentProgress={segmentProgress}
            qrPayload={extras.qrPayload}
            qrLoading={extras.isLoading}
          />
          <PassportOfferDesktopView
            offer={offer}
            related={related}
            city={city}
            displayName={displayName}
            levelLabel={levelView.level.label}
            segmentProgress={segmentProgress}
            qrPayload={extras.qrPayload}
            qrLoading={extras.isLoading}
          />
        </>
      )}
    </PassportAppShell>
  );
}
