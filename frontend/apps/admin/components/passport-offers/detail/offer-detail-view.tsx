"use client";

import { OfferDetailEditSection } from "@/components/passport-offers/detail/offer-detail-edit-section";
import { OfferDetailHeader } from "@/components/passport-offers/detail/offer-detail-header";
import { OfferDetailIdentityCard } from "@/components/passport-offers/detail/offer-detail-identity-card";
import { OfferDetailModerationSection } from "@/components/passport-offers/detail/offer-detail-moderation-section";
import { OfferDetailPartnerCard } from "@/components/passport-offers/detail/offer-detail-partner-card";
import { OfferDetailPassportConditionsCard } from "@/components/passport-offers/detail/offer-detail-passport-conditions-card";
import { OfferDetailPreviewSection } from "@/components/passport-offers/detail/offer-detail-preview-section";
import { OfferDetailPublicExposureCard } from "@/components/passport-offers/detail/offer-detail-public-exposure-card";
import { useAdminOfferDetail } from "@/lib/hooks/use-admin-offer-detail";
import { buildOffersListPath } from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface OfferDetailViewProps {
  offerId: string;
}

export function OfferDetailView({ offerId }: OfferDetailViewProps) {
  const {
    offer,
    form,
    isLoading,
    error,
    isNotFound,
    saveError,
    actionError,
    actionSuccess,
    isSaving,
    isModerating,
    reload,
    updateForm,
    clearActionFeedback,
    saveOffer,
    approveOffer,
    rejectOffer,
    archiveOffer,
  } = useAdminOfferDetail(offerId);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!actionSuccess) {
      return;
    }
    const timer = window.setTimeout(() => clearActionFeedback(), 5000);
    return () => window.clearTimeout(timer);
  }, [actionSuccess, clearActionFeedback]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    clearActionFeedback();
    try {
      await reload();
    } finally {
      setIsRefreshing(false);
    }
  }, [clearActionFeedback, reload]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-8">
        <p className="text-sm text-stone-500">Chargement de la fiche offre…</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          href={buildOffersListPath()}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour aux offres
        </Link>
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-medium text-stone-900">Offre introuvable</p>
          <p className="mt-2 text-sm text-stone-500">
            L&apos;identifiant <span className="font-mono text-xs">{offerId}</span> ne correspond
            à aucune offre staff.
          </p>
        </div>
      </div>
    );
  }

  if (error || !offer || !form) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          href={buildOffersListPath()}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour aux offres
        </Link>
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
      <OfferDetailHeader
        offer={offer}
        isRefreshing={isRefreshing || isSaving || isModerating}
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

      <OfferDetailIdentityCard offer={offer} />
      <OfferDetailPartnerCard offer={offer} />
      <OfferDetailPassportConditionsCard offer={offer} />
      <OfferDetailPublicExposureCard offer={offer} />
      <OfferDetailModerationSection
        status={offer.offer_status}
        rejectionReason={offer.rejection_reason}
        isSubmitting={isModerating}
        actionError={actionError}
        onApprove={approveOffer}
        onReject={rejectOffer}
        onArchive={archiveOffer}
      />
      <OfferDetailEditSection
        form={form}
        isSaving={isSaving}
        saveError={saveError}
        onChange={updateForm}
        onSave={saveOffer}
      />
      <OfferDetailPreviewSection
        title="Redemptions"
        message="Historique des utilisations prévu en ADMIN-04E."
      />
      <OfferDetailPreviewSection
        title="Historique staff"
        message="Timeline offre prévue en ADMIN-04E."
      />
    </div>
  );
}
