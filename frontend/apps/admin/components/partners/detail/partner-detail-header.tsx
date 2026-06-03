"use client";

import { VerificationBadge } from "@/components/verification-badge";
import type { AdminPartnerDetailResponse } from "@yunicity/types";
import {
  ORGANIZATION_VISIBILITY_LABELS,
  partnerStatusLabel,
} from "@yunicity/utils";
import Link from "next/link";

interface PartnerDetailHeaderProps {
  data: AdminPartnerDetailResponse;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function PartnerDetailHeader({
  data,
  isRefreshing,
  onRefresh,
}: PartnerDetailHeaderProps) {
  const org = data.organization;
  const profile = data.partner_profile;

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
      <div className="space-y-3">
        <Link
          href="/partners"
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
        >
          ← Retour aux partenaires
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{org.name}</h1>
          <p className="mt-1 text-sm text-stone-600">{org.city}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge status={org.verification_status} />
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 ring-1 ring-stone-200">
            {ORGANIZATION_VISIBILITY_LABELS[org.visibility] ?? org.visibility}
          </span>
          {profile ? (
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900 ring-1 ring-violet-200">
              {partnerStatusLabel(profile.partner_status)}
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
              Sans profil partenaire
            </span>
          )}
          {profile?.is_featured ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-950 ring-1 ring-amber-300">
              Mis en avant
            </span>
          ) : null}
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
