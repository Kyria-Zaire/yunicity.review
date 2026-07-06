"use client";

import { PassportAppShell } from "@/components/passport/passport-app-shell";
import { PassportMobileView } from "@/components/passport/mobile";
import { PassportBadgesSection } from "@/components/passport/passport-badges-section";
import { PassportChallengesSection } from "@/components/passport/passport-challenges-section";
import { PassportErrorState } from "@/components/passport/passport-error-state";
import { PassportOffersList } from "@/components/passport/passport-offers-section";
import { PassportPartnerOffersSection } from "@/components/passport/passport-partner-offers-section";
import { PassportSessionExpiredState } from "@/components/passport/passport-session-expired-state";
import { PassportHero } from "@/components/passport/passport-hero";
import { PassportLoadingState } from "@/components/passport/passport-loading-state";
import { PassportReputationCard } from "@/components/passport/passport-reputation-card";
import { PassportStampsSection } from "@/components/passport/passport-stamps-section";
import { PassportStatsGrid } from "@/components/passport/passport-stats-grid";
import { PassportWalletCard } from "@/components/passport/passport-wallet-card";
import { usePassportMe } from "@/hooks/use-passport-me";
import { usePassportMobileExtras } from "@/hooks/use-passport-mobile-extras";
import { usePassportOffers } from "@/hooks/use-passport-offers";
import { usePassportStamps } from "@/hooks/use-passport-stamps";
import { useAuth } from "@/lib/auth/auth-provider";
import { yunicityBtnPrimaryLg } from "@/lib/brand-classes";
import {
  PASSPORT_ACTIVATE_BODY,
  PASSPORT_ACTIVATE_CTA,
  PASSPORT_ACTIVATE_TITLE,
  buildSettingsDisplayName,
  formatClaimSuccessBanner,
} from "@yunicity/utils";

export function PassportPage() {
  const { user } = useAuth();
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
    claimingCode,
    claimError,
    claimSuccess,
    reload,
    activate,
    claimReward,
    clearClaimFeedback,
  } = usePassportMe();

  const passportActive =
    !needsActivation && !isSessionExpired && !!overview && !!badges && !!challenges;
  const { stamps, isLoading: stampsLoading } = usePassportStamps(passportActive);
  const {
    offers,
    isLoading: offersLoading,
    redeem,
    redeemingId,
    message: offersMessage,
  } = usePassportOffers(passportActive);
  const mobileExtras = usePassportMobileExtras(passportActive);

  const displayName = profile
    ? buildSettingsDisplayName(profile, user)
    : user?.full_name?.trim() || "Citoyen";

  const activationCard = (
    <div className="mx-auto max-w-lg rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">
        Territoire · Identité
      </p>
      <h1 className="mt-2 text-2xl font-bold text-neutral-900">{PASSPORT_ACTIVATE_TITLE}</h1>
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
    <PassportAppShell>
      {isSessionExpired ? (
        <>
          <div className="web-mobile-passport-only px-4 py-8">
            <PassportSessionExpiredState />
          </div>
          <div className="web-desktop-passport-only px-4 py-6 sm:px-6 sm:py-8">
            <PassportSessionExpiredState />
          </div>
        </>
      ) : isLoading ? (
        <>
          <p
            className="web-mobile-passport-only px-4 py-12 text-center text-sm text-neutral-500"
            role="status"
          >
            Chargement de votre passeport…
          </p>
          <div className="web-desktop-passport-only px-4 py-6 sm:px-6 sm:py-8">
            <PassportLoadingState />
          </div>
        </>
      ) : error && !needsActivation ? (
        <>
          <div className="web-mobile-passport-only px-4 py-8">
            <PassportErrorState message={error} onRetry={() => void reload()} />
          </div>
          <div className="web-desktop-passport-only px-4 py-6 sm:px-6 sm:py-8">
            <PassportErrorState message={error} onRetry={() => void reload()} />
          </div>
        </>
      ) : needsActivation || !overview || !badges || !challenges || !profile ? (
        <>
          <div className="web-mobile-passport-only px-4 py-8">{activationCard}</div>
          <div className="web-desktop-passport-only px-4 py-6 sm:px-6 sm:py-8">{activationCard}</div>
        </>
      ) : (
        <>
          <PassportMobileView
            profile={profile}
            displayName={displayName}
            overview={overview}
            passportMe={mobileExtras.passportMe}
            qrPayload={mobileExtras.qrPayload}
            qrLoading={mobileExtras.isLoading}
            offers={offers}
            stamps={stamps}
            stampsLoading={stampsLoading}
          />

          <div className="web-desktop-passport-only px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-5xl space-y-10">
            <PassportHero summary={overview.summary} passport={overview.passport} />

            <PassportStatsGrid summary={overview.summary} />

            {claimSuccess ? (
              <div
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                role="status"
              >
                <p className="font-semibold">{formatClaimSuccessBanner(claimSuccess)}</p>
                {claimSuccess.claimed ? (
                  <p className="mt-1 text-emerald-800">
                    Nouveau solde : {claimSuccess.new_balance.toLocaleString("fr-FR")} YM
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={clearClaimFeedback}
                  className="mt-2 text-xs font-semibold underline underline-offset-2"
                >
                  Fermer
                </button>
              </div>
            ) : null}

            {claimError ? (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                <p>{claimError}</p>
                <button
                  type="button"
                  onClick={clearClaimFeedback}
                  className="mt-2 text-xs font-semibold underline underline-offset-2"
                >
                  Fermer
                </button>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <PassportWalletCard wallet={overview.wallet} />
              <PassportReputationCard reputation={overview.reputation} />
            </div>

            <PassportBadgesSection badges={badges} />

            <PassportChallengesSection
              challenges={challenges}
              claimingCode={claimingCode}
              onClaim={(code) => void claimReward(code)}
            />

            <PassportStampsSection stamps={stamps} isLoading={stampsLoading} />

            {offersLoading ? (
              <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
                <p className="text-sm text-neutral-500">Chargement des avantages partenaires…</p>
              </section>
            ) : (
              <>
                <PassportPartnerOffersSection offers={offers} />
                {offers.length > 0 ? (
                  <PassportOffersList
                    offers={offers}
                    isLoading={false}
                    message={offersMessage}
                    redeemingId={redeemingId}
                    onRedeem={(offerId) => void redeem(offerId)}
                  />
                ) : null}
              </>
            )}

            <footer className="rounded-2xl border border-neutral-200/80 bg-white px-6 py-5 text-center shadow-sm">
              <p className="text-sm font-medium text-neutral-800">
                Le Passport évolue avec tes actions dans la ville.
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Réputation, YuniMonnaie, badges et défis reflètent votre engagement local — pas votre
                temps d&apos;écran.
              </p>
            </footer>
          </div>
          </div>
        </>
      )}
    </PassportAppShell>
  );
}
