"use client";

import type { AdminStaffDetailResponse } from "@yunicity/types";
import { staffStatusLabel } from "@yunicity/utils";
import Link from "next/link";

interface StaffDetailHeaderProps {
  staff: AdminStaffDetailResponse;
  backHref: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function StaffDetailHeader({
  staff,
  backHref,
  isRefreshing,
  onRefresh,
}: StaffDetailHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
      <div className="space-y-3">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
        >
          ← Retour au staff
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {staff.full_name}
          </h1>
          <p className="mt-1 text-sm text-stone-600">{staff.email}</p>
        </div>
        <p className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
          {staffStatusLabel(staff.is_active)}
        </p>
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
