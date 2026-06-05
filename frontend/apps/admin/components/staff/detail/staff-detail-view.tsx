"use client";

import { StaffDetailAccountAccessSection } from "@/components/staff/detail/staff-detail-account-access-section";
import { StaffDetailAuditSection } from "@/components/staff/detail/staff-detail-audit-section";
import { StaffDetailAuditSummaryCard } from "@/components/staff/detail/staff-detail-audit-summary-card";
import { StaffDetailHeader } from "@/components/staff/detail/staff-detail-header";
import { StaffDetailIdentityCard } from "@/components/staff/detail/staff-detail-identity-card";
import { StaffDetailRbacSection } from "@/components/staff/detail/staff-detail-rbac-section";
import { StaffDetailRolesCard } from "@/components/staff/detail/staff-detail-roles-card";
import { StaffDetailSecurityCard } from "@/components/staff/detail/staff-detail-security-card";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  useAdminStaffActions,
  useAdminStaffDetail,
  useAdminStaffMutations,
} from "@/lib/hooks/use-admin-staff-detail";
import { buildStaffListBackPath } from "@yunicity/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface StaffDetailViewProps {
  staffId: string;
}

export function StaffDetailView({ staffId }: StaffDetailViewProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const backHref = buildStaffListBackPath(searchParams);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const { staff, isLoading, isRefreshing, error, isNotFound, reload, applyStaffDetail } =
    useAdminStaffDetail(staffId);

  const detailReady = !isLoading && !isNotFound && !error && !!staff;
  const auditActions = useAdminStaffActions(staffId, detailReady);

  const mutations = useAdminStaffMutations(
    staffId,
    applyStaffDetail,
    auditActions.resetAndReload,
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshingAll(true);
    mutations.clearActionFeedback();
    try {
      await Promise.all([reload(), auditActions.resetAndReload()]);
    } finally {
      setIsRefreshingAll(false);
    }
  }, [auditActions, mutations, reload]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <p className="text-sm text-stone-500">Chargement de la fiche staff…</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour au staff
        </Link>
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-lg font-medium text-stone-900">Compte staff introuvable</p>
          <p className="mt-2 text-sm text-stone-500">
            Ce compte n&apos;existe pas ou n&apos;a pas de rôle staff plateforme.
          </p>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour au staff
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

  const latestAction = auditActions.items[0] ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <StaffDetailHeader
        staff={staff}
        backHref={backHref}
        isRefreshing={isRefreshing || isRefreshingAll}
        onRefresh={() => void handleRefresh()}
      />

      {mutations.actionSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {mutations.actionSuccess}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <StaffDetailIdentityCard staff={staff} />
        <StaffDetailRolesCard staff={staff} />
        <StaffDetailSecurityCard staff={staff} />
        <StaffDetailAuditSummaryCard
          totalActions={auditActions.total}
          latestAction={latestAction}
          isLoading={auditActions.isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StaffDetailRbacSection
          staff={staff}
          currentUserId={user?.id ?? null}
          isSubmitting={mutations.isSubmitting}
          actionError={mutations.actionError}
          onAssignRole={mutations.assignRole}
          onRevokeRole={mutations.revokeRole}
          onClearActionError={mutations.clearActionFeedback}
        />
        <StaffDetailAccountAccessSection
          staff={staff}
          currentUserId={user?.id ?? null}
          isSubmitting={mutations.isSubmitting}
          actionError={mutations.actionError}
          onSuspend={mutations.suspendStaff}
          onReactivate={mutations.reactivateStaff}
          onClearActionError={mutations.clearActionFeedback}
        />
      </div>

      <StaffDetailAuditSection
        items={auditActions.items}
        total={auditActions.total}
        page={auditActions.page}
        pageSize={auditActions.pageSize}
        totalPages={auditActions.totalPages}
        isLoading={auditActions.isLoading}
        error={auditActions.error}
        onRetry={auditActions.reload}
        onPageChange={auditActions.goToPage}
      />
    </div>
  );
}
