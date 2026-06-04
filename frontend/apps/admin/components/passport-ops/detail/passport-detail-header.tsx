"use client";

import { PassportStatusBadge } from "@/components/passport-ops/passport-status-badge";
import type { AdminPassportDetailResponse } from "@yunicity/types";
import { buildPassportOpsListPath } from "@yunicity/utils";
import Link from "next/link";

interface PassportDetailHeaderProps {
  data: AdminPassportDetailResponse;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function PassportDetailHeader({
  data,
  isRefreshing,
  onRefresh,
}: PassportDetailHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <Link
          href={buildPassportOpsListPath()}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour à Passport Ops
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-semibold tracking-tight text-stone-900">
            {data.passport_number}
          </h1>
          <PassportStatusBadge status={data.status} />
        </div>
        <p className="text-sm text-stone-600">{data.city}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
      >
        {isRefreshing ? "Actualisation…" : "Actualiser"}
      </button>
    </div>
  );
}
