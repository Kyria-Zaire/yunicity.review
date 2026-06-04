"use client";

import { CreatorContentFilters } from "@/components/creator-content/creator-content-filters";
import { CreatorContentHeader } from "@/components/creator-content/creator-content-header";
import { CreatorContentKpiStrip } from "@/components/creator-content/creator-content-kpi-strip";
import { CreatorContentList } from "@/components/creator-content/creator-content-list";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { creatorContentStateToSearchParams } from "@/lib/creator-content-url";
import { useAdminCreatorContentList } from "@/lib/hooks/use-admin-creator-content-list";

export function CreatorContentWorkspace() {
  const {
    state,
    items,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    organizations,
    usesClientOrganizationFilter,
    reload,
    setStatusFilter,
    setOrganizationFilter,
    goToPage,
  } = useAdminCreatorContentList();

  const listSearchQuery = creatorContentStateToSearchParams(state);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <CreatorContentHeader isLoading={isLoading} onRefresh={reload} />
      <CreatorContentKpiStrip
        apiTotal={total}
        items={items}
        usesClientOrganizationFilter={usesClientOrganizationFilter}
      />
      <CreatorContentFilters
        state={state}
        organizations={organizations}
        isLoading={isLoading}
        onStatusChange={setStatusFilter}
        onOrganizationChange={setOrganizationFilter}
      />
      <CreatorContentList
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
