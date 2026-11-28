"use client";

import type {
  PassportChallengeResponse,
  PassportChallengesResponse,
  PassportOverviewResponse,
  PassportTierCode,
} from "@yunicity/types";
import { FEED_PORTAL_PASSPORT_CONTINUE, PASSPORT_TIER_LABELS } from "@yunicity/utils";
import { BookMarked } from "lucide-react";
import Link from "next/link";

/**
 * Données Passport fournies par le contrôleur — la vue ne fetch pas.
 * Un changement de largeur remonte/démonte la vue sans relancer d'appel.
 */
export type FeedPassportRailData = {
  overview: PassportOverviewResponse | null;
  challenges: PassportChallengesResponse | null;
  loading: boolean;
  error: boolean;
};

function selectPrimaryChallenge(
  active: PassportChallengeResponse[] | undefined,
): PassportChallengeResponse | null {
  if (!active?.length) return null;
  const inProgress = active.find((challenge) => !challenge.completed && challenge.target > 0);
  return inProgress ?? active[0] ?? null;
}

function PassportProgressRing({ progress, target }: { progress: number; target: number }) {
  const safeTarget = Math.max(target, 1);
  const ratio = Math.min(Math.max(progress / safeTarget, 0), 1);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="relative h-[5.5rem] w-[5.5rem] shrink-0" aria-hidden="true">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-yunicity-primary transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <BookMarked className="h-7 w-7 text-yunicity-primary" strokeWidth={1.75} />
      </div>
    </div>
  );
}

function PassportLoadedContent({
  overview,
  challenges,
}: {
  overview: NonNullable<FeedPassportRailData["overview"]>;
  challenges: PassportChallengeResponse[] | undefined;
}) {
  const { summary } = overview;
  const tierCode = summary.passport_tier;
  const tierLabel =
    tierCode && tierCode in PASSPORT_TIER_LABELS
      ? PASSPORT_TIER_LABELS[tierCode as PassportTierCode]
      : null;

  const primaryChallenge = selectPrimaryChallenge(challenges);
  const hasChallengeProgress =
    primaryChallenge != null && primaryChallenge.target > 0 && !primaryChallenge.completed;

  return (
    <div data-feed-passport-state="loaded" className="space-y-4">
      <div className="flex items-center gap-4">
        {hasChallengeProgress ? (
          <PassportProgressRing
            progress={primaryChallenge.progress}
            target={primaryChallenge.target}
          />
        ) : (
          <div className="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft">
            <BookMarked className="h-7 w-7 text-yunicity-primary" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {tierLabel ? (
            <p className="text-sm font-semibold text-yunicity-primary">Niveau {tierLabel}</p>
          ) : null}
          {hasChallengeProgress ? (
            <>
              <p className="mt-0.5 text-base font-bold text-neutral-900">
                {primaryChallenge.progress} / {primaryChallenge.target} découvertes
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                {primaryChallenge.description || primaryChallenge.name}
              </p>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-base font-bold text-neutral-900">
                {summary.earned_badges} badge{summary.earned_badges !== 1 ? "s" : ""} obtenu
                {summary.earned_badges !== 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Continuez à explorer votre ville et ses pépites.
              </p>
            </>
          )}
        </div>
      </div>

      <Link
        href="/passport"
        className="inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        {FEED_PORTAL_PASSPORT_CONTINUE}
      </Link>
    </div>
  );
}

/**
 * Résumé Passport du fil — FEED-MAIN-LAYOUT-UIUX-01.
 *
 * Surface UNIQUE, montée par le rail droit (>= 1024px) et par la colonne
 * centrale (< 1024px). Un seul des deux emplacements est `display: block` à une
 * largeur donnée : l'autre est `display: none`, donc absent de l'arbre
 * d'accessibilité — aucun doublon perçu, aucun second appel réseau.
 *
 * Purement présentationnel : les quatre états (chargement, erreur,
 * indisponible, chargé) viennent des props. Aucune valeur n'est inventée — pas
 * de XP, de palier ni de récompense qui ne soit dans la réponse API.
 */
export function FeedPassportModule({ overview, challenges, loading, error }: FeedPassportRailData) {
  return (
    <section className="feed-desktop-surface p-4" data-feed-passport-module="">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900">Votre Passport local</h3>
        <Link href="/passport" className="text-xs font-medium text-yunicity-primary hover:underline">
          Ouvrir
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2" aria-hidden="true">
          <div className="h-16 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ) : error || !overview ? (
        <p className="text-xs text-neutral-400">Passport indisponible</p>
      ) : (
        <PassportLoadedContent overview={overview} challenges={challenges?.active} />
      )}
    </section>
  );
}
