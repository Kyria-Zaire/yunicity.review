"use client";

import { ModerationConseil } from "@/components/moderation/moderation-conseil";
import { ModerationFilters } from "@/components/moderation/moderation-filters";
import { ModerationHero } from "@/components/moderation/moderation-hero";
import { ModerationKpiStrip } from "@/components/moderation/moderation-kpi-strip";
import { ModerationMomentum } from "@/components/moderation/moderation-momentum";
import { ModerationNextAction } from "@/components/moderation/moderation-next-action";
import { ModerationReportsList } from "@/components/moderation/moderation-reports-list";
import { ModerationSignal } from "@/components/moderation/moderation-signal";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { useAdminModerationCommand } from "@/lib/hooks/use-admin-moderation-command";
import { useAdminReportsList } from "@/lib/hooks/use-admin-reports-list";
import { moderationStateToSearchParams } from "@/lib/moderation-url";

export function ModerationWorkspace() {
  const {
    state,
    items,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    hasActiveFilters,
    reload,
    setStatusFilter,
    setReasonFilter,
    resetFilters,
    goToPage,
  } = useAdminReportsList();

  const command = useAdminModerationCommand();
  const listSearchQuery = moderationStateToSearchParams(state);
  const trustSafetyIsEmpty = (command.metrics?.total ?? 0) === 0;

  async function handleRefresh() {
    await Promise.all([reload(), command.reloadSummary()]);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <ModerationHero
        isLoading={isLoading || command.isLoading}
        onRefresh={() => void handleRefresh()}
      />
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
      {command.signal ? <ModerationSignal signal={command.signal} /> : null}
      {command.nextAction ? <ModerationNextAction action={command.nextAction} /> : null}
      <ModerationKpiStrip cards={command.kpiCards} />
      {command.momentum ? <ModerationMomentum momentum={command.momentum} /> : null}
      <ModerationFilters
        state={state}
        isLoading={isLoading}
        onStatusChange={setStatusFilter}
        onReasonChange={setReasonFilter}
        onRefresh={() => void handleRefresh()}
      />
      <ModerationReportsList
        items={items}
        listSearchQuery={listSearchQuery}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        trustSafetyIsEmpty={trustSafetyIsEmpty}
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
        <ModerationConseil message={command.conseilMessage} action={command.recommendedAction} />
      ) : null}
    </div>
  );
}
