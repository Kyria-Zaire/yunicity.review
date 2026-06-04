"use client";

import {
  ModerationReportReasonBadge,
  ModerationReportStatusBadge,
} from "@/components/moderation/detail/moderation-report-badges";
import type { AdminReportDetailResponse } from "@yunicity/types";
import { shortReportId } from "@yunicity/utils";
import Link from "next/link";

interface ModerationReportDetailHeaderProps {
  report: AdminReportDetailResponse;
  backHref: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function ModerationReportDetailHeader({
  report,
  backHref,
  isRefreshing,
  onRefresh,
}: ModerationReportDetailHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
      <div className="space-y-3">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
        >
          ← Retour aux signalements
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Signalement {shortReportId(report.id)}
          </h1>
          <p className="mt-1 font-mono text-xs text-stone-500">{report.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModerationReportReasonBadge reason={report.reason} />
          <ModerationReportStatusBadge status={report.status} />
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRefreshing ? "Actualisation…" : "Actualiser"}
      </button>
    </header>
  );
}
