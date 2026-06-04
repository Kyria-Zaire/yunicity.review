"use client";

import { CreatorContentDetailAuditSection } from "@/components/creator-content/detail/creator-content-detail-audit-section";
import { CreatorContentDetailFeedSyncCard } from "@/components/creator-content/detail/creator-content-detail-feed-sync-card";
import { CreatorContentDetailHeader } from "@/components/creator-content/detail/creator-content-detail-header";
import { CreatorContentDetailIdentityCard } from "@/components/creator-content/detail/creator-content-detail-identity-card";
import { CreatorContentDetailModerationSection } from "@/components/creator-content/detail/creator-content-detail-moderation-section";
import { CreatorContentDetailOrganizationCard } from "@/components/creator-content/detail/creator-content-detail-organization-card";
import { CreatorContentDetailPreviewCard } from "@/components/creator-content/detail/creator-content-detail-preview-card";
import { CreatorContentDetailPublicExposureCard } from "@/components/creator-content/detail/creator-content-detail-public-exposure-card";
import { useAdminCreatorContentActions } from "@/lib/hooks/use-admin-creator-content-actions";
import { useAdminCreatorContentDetail } from "@/lib/hooks/use-admin-creator-content";
import { buildCreatorContentListBackPath } from "@yunicity/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface CreatorContentDetailViewProps {
  contentId: string;
}

export function CreatorContentDetailView({ contentId }: CreatorContentDetailViewProps) {
  const searchParams = useSearchParams();
  const backHref = useMemo(() => buildCreatorContentListBackPath(searchParams), [searchParams]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    content,
    isLoading,
    error,
    isNotFound,
    isModerating,
    actionError,
    successMessage,
    reload,
    clearActionFeedback,
    approve,
    reject,
    archive,
  } = useAdminCreatorContentDetail(contentId);

  const detailReady = !isLoading && !isNotFound && !error && !!content;
  const auditActions = useAdminCreatorContentActions(contentId, detailReady);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    void auditActions.reload();
    const timer = window.setTimeout(() => clearActionFeedback(), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage, auditActions.reload, clearActionFeedback]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    clearActionFeedback();
    try {
      await Promise.all([reload(), auditActions.reload()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [auditActions, clearActionFeedback, reload]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 py-8">
        <p className="text-sm text-stone-500">Chargement de la fiche contenu…</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour aux contenus créateurs
        </Link>
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-lg font-medium text-stone-900">Contenu introuvable</p>
          <p className="mt-2 text-sm text-stone-500">
            Ce contenu n&apos;existe pas ou n&apos;est plus accessible.
          </p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour aux contenus créateurs
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error ?? "Impossible de charger le contenu."}
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
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {successMessage}
        </p>
      ) : null}

      <CreatorContentDetailHeader
        content={content}
        backHref={backHref}
        isRefreshing={isRefreshing || isModerating}
        onRefresh={() => void handleRefresh()}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <CreatorContentDetailIdentityCard content={content} />
          <CreatorContentDetailPreviewCard content={content} />
        </div>
        <div className="space-y-6">
          <CreatorContentDetailOrganizationCard content={content} />
          <CreatorContentDetailPublicExposureCard content={content} />
          <CreatorContentDetailFeedSyncCard content={content} />
        </div>
      </div>

      <CreatorContentDetailModerationSection
        content={content}
        isSubmitting={isModerating}
        actionError={actionError}
        onApprove={approve}
        onReject={(reason) => reject({ reason })}
        onArchive={archive}
        onClearActionError={clearActionFeedback}
      />

      <CreatorContentDetailAuditSection
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
