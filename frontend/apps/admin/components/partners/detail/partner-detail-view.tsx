"use client";

import { PartnerDetailActionsSection } from "@/components/partners/detail/partner-detail-actions-section";
import { PartnerDetailCapabilities } from "@/components/partners/detail/partner-detail-capabilities";
import { PartnerDetailCounters } from "@/components/partners/detail/partner-detail-counters";
import { PartnerDetailHeader } from "@/components/partners/detail/partner-detail-header";
import { PartnerDetailIdentityCard } from "@/components/partners/detail/partner-detail-identity-card";
import { PartnerDetailLinks } from "@/components/partners/detail/partner-detail-links";
import { PartnerDetailProfileCard } from "@/components/partners/detail/partner-detail-profile-card";
import { PartnerDetailSettingsPanel } from "@/components/partners/detail/partner-detail-settings-panel";
import { useAdminPartnerDetail } from "@/lib/hooks/use-admin-partner-detail";
import { useState } from "react";

interface PartnerDetailViewProps {
  organizationId: string;
}

export function PartnerDetailView({ organizationId }: PartnerDetailViewProps) {
  const {
    data,
    isLoading,
    error,
    isNotFound,
    reload,
    isSubmitting,
    actionError,
    actionSuccess,
    clearActionFeedback,
    createProfile,
    activate,
    pause,
    upgradePremium,
    patchSettings,
  } = useAdminPartnerDetail(organizationId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    clearActionFeedback();
    try {
      await reload();
    } finally {
      setIsRefreshing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-8">
        <p className="text-sm text-stone-500">Chargement de la fiche partenaire…</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-medium text-stone-900">Organisation introuvable</p>
          <p className="mt-2 text-sm text-stone-500">
            L&apos;identifiant <span className="font-mono text-xs">{organizationId}</span> ne
            correspond à aucune organisation.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error ?? "Erreur inconnue."}
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="ml-3 font-medium underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <PartnerDetailHeader
        data={data}
        isRefreshing={isRefreshing || isLoading}
        onRefresh={() => void handleRefresh()}
      />

      {actionSuccess ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          {actionSuccess}
          <button
            type="button"
            onClick={clearActionFeedback}
            className="ml-3 font-medium underline"
          >
            Fermer
          </button>
        </div>
      ) : null}
      {actionError ? (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {actionError}
          <button
            type="button"
            onClick={clearActionFeedback}
            className="ml-3 font-medium underline"
          >
            Fermer
          </button>
        </div>
      ) : null}

      <PartnerDetailActionsSection
        organizationName={data.organization.name}
        capabilities={data.capabilities}
        isSubmitting={isSubmitting}
        onCreateProfile={createProfile}
        onActivate={activate}
        onPause={pause}
        onUpgradePremium={upgradePremium}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PartnerDetailIdentityCard organization={data.organization} />
        <PartnerDetailProfileCard profile={data.partner_profile} />
      </div>

      <PartnerDetailSettingsPanel
        data={data}
        isSubmitting={isSubmitting}
        onPatch={patchSettings}
      />

      <PartnerDetailCounters counters={data.counters} />
      <PartnerDetailLinks links={data.links} city={data.organization.city} />
      <PartnerDetailCapabilities capabilities={data.capabilities} />
    </div>
  );
}
