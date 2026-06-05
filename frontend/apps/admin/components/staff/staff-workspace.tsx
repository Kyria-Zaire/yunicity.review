"use client";

import { StaffFilters } from "@/components/staff/staff-filters";
import { StaffHeader } from "@/components/staff/staff-header";
import { StaffKpiStrip } from "@/components/staff/staff-kpi-strip";
import { StaffList } from "@/components/staff/staff-list";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { useAdminStaffList } from "@/lib/hooks/use-admin-staff-list";
import { staffStateToSearchParams } from "@/lib/staff-url";

export function StaffWorkspace() {
  const {
    state,
    items,
    total,
    page,
    pageSize,
    totalPages,
    kpis,
    isLoading,
    isLoadingKpis,
    error,
    reload,
    setRoleFilter,
    setActiveFilter,
    goToPage,
  } = useAdminStaffList();

  const listSearchQuery = staffStateToSearchParams(state);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <StaffHeader isLoading={isLoading || isLoadingKpis} onRefresh={() => void reload()} />
      <StaffKpiStrip kpis={kpis} filteredTotal={total} isLoading={isLoadingKpis} />
      <StaffFilters
        state={state}
        isLoading={isLoading}
        onRoleChange={setRoleFilter}
        onActiveChange={setActiveFilter}
      />
      <StaffList
        items={items}
        listSearchQuery={listSearchQuery}
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
