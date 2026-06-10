"use client";

import { PassportOpsConseil } from "@/components/passport-ops/passport-ops-conseil";
import { PassportOpsHero } from "@/components/passport-ops/passport-ops-hero";
import { PassportOpsKpiStrip } from "@/components/passport-ops/passport-ops-kpi-strip";
import { PassportOpsList } from "@/components/passport-ops/passport-ops-list";
import { PassportOpsMomentum } from "@/components/passport-ops/passport-ops-momentum";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { PassportOpsRecommendedAction } from "@/components/passport-ops/passport-ops-recommended-action";
import { PassportOpsSearchBar } from "@/components/passport-ops/passport-ops-search-bar";
import { PassportOpsSignal } from "@/components/passport-ops/passport-ops-signal";
import { useAdminPassportsList } from "@/lib/hooks/use-admin-passports-list";
import { usePassportOpsCommand } from "@/lib/hooks/use-passport-ops-command";

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

  const command = usePassportOpsCommand(state.city, hasSearchQuery, total, items);

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <PassportOpsHero />
      <PassportOpsSignal signal={command.signal} />
      <PassportOpsRecommendedAction action={command.nextAction} />
      <PassportOpsKpiStrip cards={command.dashboardKpis} />
      <PassportOpsMomentum momentum={command.momentum} />
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
      <PassportOpsConseil
        message={command.conseilMessage}
        action={command.recommendedAction}
      />
    </div>
  );
}
