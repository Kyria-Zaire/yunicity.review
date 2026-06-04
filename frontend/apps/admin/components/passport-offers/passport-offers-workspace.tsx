"use client";

import { PassportOffersFilters } from "@/components/passport-offers/passport-offers-filters";
import { PassportOffersHeader } from "@/components/passport-offers/passport-offers-header";
import { PassportOffersKpiStrip } from "@/components/passport-offers/passport-offers-kpi-strip";
import { PassportOffersList } from "@/components/passport-offers/passport-offers-list";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { useAdminOffersList } from "@/lib/hooks/use-admin-offers-list";

export function PassportOffersWorkspace() {
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
    activeCity,
    reload,
    setStatusFilter,
    setOrganizationFilter,
    setOfferTypeFilter,
    goToPage,
  } = useAdminOffersList();

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PassportOffersHeader />
      <PassportOffersKpiStrip
        total={total}
        activeCity={activeCity}
        statusFilter={state.status}
      />
      <PassportOffersFilters
        state={state}
        organizations={organizations}
        isLoading={isLoading}
        onStatusChange={setStatusFilter}
        onOrganizationChange={setOrganizationFilter}
        onOfferTypeChange={setOfferTypeFilter}
        onRefresh={reload}
      />
      <PassportOffersList
        items={items}
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
