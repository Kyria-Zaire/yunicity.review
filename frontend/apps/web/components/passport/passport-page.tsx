"use client";

import { PassportAppShell } from "@/components/passport/passport-app-shell";
import { PassportBadgesSection } from "@/components/passport/passport-badges-section";
import { PassportChallengesSection } from "@/components/passport/passport-challenges-section";
import { PassportErrorState } from "@/components/passport/passport-error-state";
import { PassportHero } from "@/components/passport/passport-hero";
import { PassportLoadingState } from "@/components/passport/passport-loading-state";
import { PassportReputationCard } from "@/components/passport/passport-reputation-card";
import { PassportStatsGrid } from "@/components/passport/passport-stats-grid";
import { PassportWalletCard } from "@/components/passport/passport-wallet-card";
import { usePassportMe } from "@/hooks/use-passport-me";
import { yunicityBtnPrimaryLg } from "@/lib/brand-classes";
import {
  PASSPORT_ACTIVATE_BODY,
  PASSPORT_ACTIVATE_CTA,
  PASSPORT_ACTIVATE_TITLE,
} from "@yunicity/utils";

export function PassportPage() {
  const {
    overview,
    badges,
    challenges,
    error,
    isLoading,
    needsActivation,
    isActivating,
    claimingCode,
    claimError,
    claimSuccess,
    reload,
    activate,
    claimReward,
    clearClaimFeedback,
  } = usePassportMe();

  return (
    <PassportAppShell>
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <PassportLoadingState />
        ) : error && !needsActivation ? (
          <PassportErrorState message={error} onRetry={() => void reload()} />
        ) : needsActivation || !overview || !badges || !challenges ? (
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
        ) : (
          <div className="mx-auto max-w-5xl space-y-10">
            <PassportHero summary={overview.summary} passport={overview.passport} />

            <PassportStatsGrid summary={overview.summary} />

            {claimSuccess ? (
              <div
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                role="status"
              >
                <p className="font-semibold">{claimSuccess.message}</p>
                <p className="mt-1">
                  Nouveau solde : {claimSuccess.new_balance.toLocaleString("fr-FR")} YM
                </p>
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
        )}
      </div>
    </PassportAppShell>
  );
}
