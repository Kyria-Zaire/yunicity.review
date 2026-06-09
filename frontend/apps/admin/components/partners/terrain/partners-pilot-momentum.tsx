"use client";

import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";
import {
  formatAdminMetric,
  partnerPilotMomentumObjectiveCopy,
  partnerPilotMomentumProgress,
  partnerPilotMomentumProgressLabel,
  partnerRecommendedAction,
} from "@yunicity/utils";
import { QrCode, ShieldCheck, Tags, UserPlus } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const RECOMMENDED_ICONS: Record<string, LucideIcon> = {
  verify: ShieldCheck,
  activation: Tags,
  add: UserPlus,
  scan: QrCode,
};

export function PartnersPilotMomentum({
  summary,
}: {
  summary: AdminPartnersWorkspaceSummary;
}) {
  const progress = partnerPilotMomentumProgress(summary);
  const objective = partnerPilotMomentumObjectiveCopy(summary);
  const progressLabel = partnerPilotMomentumProgressLabel(progress.active);
  const recommended = partnerRecommendedAction(summary);
  const RecommendedIcon = RECOMMENDED_ICONS[recommended.id] ?? UserPlus;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:col-span-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
        Momentum du pilote
      </p>

      <h3 className="mt-2 text-sm font-semibold text-stone-900">Objectif du pilote</h3>
      <p className="mt-1 text-sm leading-relaxed text-stone-600">{objective}</p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-stone-800">
            {formatAdminMetric(progress.active)} / {formatAdminMetric(progress.goal)} partenaires
            actifs
          </p>
          <p className="text-sm font-semibold tabular-nums text-yunicity-primary">
            {progress.percent} %
          </p>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100"
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression vers 10 partenaires actifs"
        >
          <div
            className="h-full rounded-full bg-yunicity-primary transition-[width] duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-500">{progressLabel}</p>
      </div>

      <div className="mt-6 rounded-xl border border-stone-100 bg-stone-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Action recommandée
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yunicity-primary-soft text-yunicity-primary">
              <RecommendedIcon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-stone-900">{recommended.title}</p>
              <p className="mt-0.5 text-sm text-stone-600">{recommended.description}</p>
            </div>
          </div>
          <Link
            href={recommended.href}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            {recommended.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
