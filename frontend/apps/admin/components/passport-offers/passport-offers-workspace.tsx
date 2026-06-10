"use client";

import { PassportOffersConseil } from "@/components/passport-offers/passport-offers-conseil";
import { PassportOffersFilters } from "@/components/passport-offers/passport-offers-filters";
import { PassportOffersHero } from "@/components/passport-offers/passport-offers-hero";
import { PassportOffersKpiStrip } from "@/components/passport-offers/passport-offers-kpi-strip";
import { PassportOffersList } from "@/components/passport-offers/passport-offers-list";
import { PassportOffersMomentum } from "@/components/passport-offers/passport-offers-momentum";
import { PassportOffersNextAction } from "@/components/passport-offers/passport-offers-next-action";
import { PassportOffersSignal } from "@/components/passport-offers/passport-offers-signal";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { useAdminOffersList } from "@/lib/hooks/use-admin-offers-list";
import { usePartnerOffersCommand } from "@/lib/hooks/use-partner-offers-command";
import { passportOffersStateToSearchParams } from "@/lib/passport-offers-url";

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
    setSearchQuery,
    resetFilters,
    hasActiveFilters,
    goToPage,
  } = useAdminOffersList();

  const command = usePartnerOffersCommand(activeCity);
  const listSearchQuery = passportOffersStateToSearchParams(state);
  const catalogueIsEmpty = (command.metrics?.total ?? 0) === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <PassportOffersHero />
      {command.summaryError && !command.metrics ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {command.summaryError}
          <button
            type="button"
            onClick={() => void command.reloadSummary()}
            className="ml-3 font-medium underline"
          >
            Réessayer
          </button>
        </div>
      ) : null}
      {command.signal ? <PassportOffersSignal signal={command.signal} /> : null}
      {command.nextAction ? <PassportOffersNextAction action={command.nextAction} /> : null}
      <PassportOffersKpiStrip cards={command.kpiCards} />
      {command.momentum ? <PassportOffersMomentum momentum={command.momentum} /> : null}
      <PassportOffersFilters
        state={state}
        organizations={organizations}
        isLoading={isLoading}
        onStatusChange={setStatusFilter}
        onOrganizationChange={setOrganizationFilter}
        onOfferTypeChange={setOfferTypeFilter}
        onSearchSubmit={setSearchQuery}
        onRefresh={reload}
      />
      <PassportOffersList
        items={items}
        listSearchQuery={listSearchQuery}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        catalogueIsEmpty={catalogueIsEmpty}
        onRetry={reload}
        onResetFilters={resetFilters}
      />
      <PassportOpsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={goToPage}
      />
      {command.conseilMessage && command.recommendedAction ? (
        <PassportOffersConseil
          message={command.conseilMessage}
          action={command.recommendedAction}
        />
      ) : null}
    </div>
  );
}
