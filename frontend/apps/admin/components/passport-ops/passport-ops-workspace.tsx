"use client";

import { PassportOpsHeader } from "@/components/passport-ops/passport-ops-header";
import { PassportOpsKpiStrip } from "@/components/passport-ops/passport-ops-kpi-strip";
import { PassportOpsList } from "@/components/passport-ops/passport-ops-list";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { PassportOpsSearchBar } from "@/components/passport-ops/passport-ops-search-bar";
import { useAdminPassportsList } from "@/lib/hooks/use-admin-passports-list";

export function PassportOpsWorkspace() {
  const {
    state,
    items,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    hasSearchQuery,
    reload,
    submitSearch,
    setStatusFilter,
    goToPage,
  } = useAdminPassportsList();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PassportOpsHeader />
      <PassportOpsKpiStrip
        total={total}
        city={state.city}
        statusFilter={state.status}
        hasSearchQuery={hasSearchQuery}
      />
      <PassportOpsSearchBar
        state={state}
        isLoading={isLoading}
        onSubmit={submitSearch}
        onStatusChange={setStatusFilter}
      />
      <PassportOpsList
        items={items}
        isLoading={isLoading}
        error={error}
        hasSearchQuery={hasSearchQuery}
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
