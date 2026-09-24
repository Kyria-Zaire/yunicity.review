"use client";

import { PassportAppShell } from "@/components/passport/passport-app-shell";
import { PassportDesktopView } from "@/components/passport/desktop";
import { PassportErrorState } from "@/components/passport/passport-error-state";
import { PassportSessionExpiredState } from "@/components/passport/passport-session-expired-state";
import { PassportLoadingState } from "@/components/passport/passport-loading-state";
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
    claimError,
    claimSuccess,
    reload,
    activate,
    clearClaimFeedback,
  } = usePassportMe();

  const passportActive =
    !needsActivation && !isSessionExpired && !!overview && !!badges && !!challenges;
  const { stamps, isLoading: stampsLoading } = usePassportStamps(passportActive);
  const {
    offers,
    isLoading: offersLoading,
    message: offersMessage,
  } = usePassportOffers(passportActive);
  const mobileExtras = usePassportMobileExtras(passportActive, !!profile?.has_active_passport);

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
          {claimSuccess ? (
            <div
              className="mx-4 mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:mx-6"
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
              className="mx-4 mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-6"
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

          {offersLoading ? (
            <div className="px-4 py-12 sm:px-6">
              <PassportLoadingState />
            </div>
          ) : (
            <PassportDesktopView
              profile={profile}
              displayName={displayName}
              overview={overview}
              passportMe={mobileExtras.passportMe}
              qrPayload={mobileExtras.qrPayload}
              qrLoading={mobileExtras.isLoading}
              offers={offers}
              stamps={stamps}
              stampsLoading={stampsLoading}
              offersMessage={offersMessage}
            />
          )}
        </>
      )}
    </PassportAppShell>
  );
}
