"use client";

import { ModerationFilters } from "@/components/moderation/moderation-filters";
import { ModerationHeader } from "@/components/moderation/moderation-header";
import { ModerationKpiStrip } from "@/components/moderation/moderation-kpi-strip";
import { ModerationReportsList } from "@/components/moderation/moderation-reports-list";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { moderationStateToSearchParams } from "@/lib/moderation-url";
import { useAdminReportsList } from "@/lib/hooks/use-admin-reports-list";

export function ModerationWorkspace() {
  const {
    state,
    items,
    total,
    page,
    pageSize,
    totalPages,
    summary,
    isLoading,
    error,
    reload,
    setStatusFilter,
    setReasonFilter,
    goToPage,
  } = useAdminReportsList();

  const listSearchQuery = moderationStateToSearchParams(state);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <ModerationHeader isLoading={isLoading} onRefresh={reload} />
      <ModerationKpiStrip summary={summary} filteredTotal={total} />
      <ModerationFilters
        state={state}
        isLoading={isLoading}
        onStatusChange={setStatusFilter}
        onReasonChange={setReasonFilter}
      />
      <ModerationReportsList
        items={items}
        listSearchQuery={listSearchQuery}
        state={state}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
      />
      <PassportOpsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={goToPage}
      />
    </div>
  );
}
