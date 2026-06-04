"use client";

import { PassportDetailActionsSection } from "@/components/passport-ops/detail/passport-detail-actions-section";
import { PassportDetailHeader } from "@/components/passport-ops/detail/passport-detail-header";
import { PassportDetailIdentityCard } from "@/components/passport-ops/detail/passport-detail-identity-card";
import { PassportDetailQrCard } from "@/components/passport-ops/detail/passport-detail-qr-card";
import { PassportDetailRedemptionsSection } from "@/components/passport-ops/detail/passport-detail-redemptions-section";
import { PassportDetailStats } from "@/components/passport-ops/detail/passport-detail-stats";
import { PassportDetailStampsSection } from "@/components/passport-ops/detail/passport-detail-stamps-section";
import { useAdminPassportDetail } from "@/lib/hooks/use-admin-passport-detail";
import { useAdminPassportRedemptions } from "@/lib/hooks/use-admin-passport-redemptions";
import { useAdminPassportStamps } from "@/lib/hooks/use-admin-passport-stamps";
import { buildPassportOpsListPath } from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface PassportDetailViewProps {
  passportId: string;
}

export function PassportDetailView({ passportId }: PassportDetailViewProps) {
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
    clearActionError,
    suspendPassport,
    reactivatePassport,
  } = useAdminPassportDetail(passportId);
  const detailReady = Boolean(data) && !isNotFound && !isLoading;

  const stamps = useAdminPassportStamps(passportId, detailReady);
  const redemptions = useAdminPassportRedemptions(passportId, detailReady);

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
      await Promise.all([stamps.reload(), redemptions.reload()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [clearActionFeedback, redemptions, reload, stamps]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-8">
        <p className="text-sm text-stone-500">Chargement de la fiche passport…</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          href={buildPassportOpsListPath()}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour à Passport Ops
        </Link>
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-medium text-stone-900">Passport introuvable</p>
          <p className="mt-2 text-sm text-stone-500">
            L&apos;identifiant <span className="font-mono text-xs">{passportId}</span> ne correspond
            à aucun passport staff.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          href={buildPassportOpsListPath()}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour à Passport Ops
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
      <PassportDetailHeader
        data={data}
        isRefreshing={isRefreshing || isSubmitting}
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

      <PassportDetailActionsSection
        status={data.status}
        isSubmitting={isSubmitting}
        actionError={actionError}
        onClearActionError={clearActionError}
        onSuspend={suspendPassport}
        onReactivate={reactivatePassport}
      />

      <PassportDetailIdentityCard data={data} />
      <PassportDetailQrCard qrToken={data.qr_token} />
      <PassportDetailStats stats={data.stats} />
      <PassportDetailStampsSection
        items={stamps.items}
        total={stamps.total}
        page={stamps.page}
        pageSize={stamps.pageSize}
        totalPages={stamps.totalPages}
        isLoading={stamps.isLoading}
        error={stamps.error}
        onRetry={stamps.reload}
        onPageChange={stamps.goToPage}
      />
      <PassportDetailRedemptionsSection
        items={redemptions.items}
        total={redemptions.total}
        page={redemptions.page}
        pageSize={redemptions.pageSize}
        totalPages={redemptions.totalPages}
        isLoading={redemptions.isLoading}
        error={redemptions.error}
        onRetry={redemptions.reload}
        onPageChange={redemptions.goToPage}
      />
    </div>
  );
}
