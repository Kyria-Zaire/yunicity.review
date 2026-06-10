"use client";

import { CreatorContentConseil } from "@/components/creator-content/creator-content-conseil";
import { CreatorContentFilters } from "@/components/creator-content/creator-content-filters";
import { CreatorContentHero } from "@/components/creator-content/creator-content-hero";
import { CreatorContentKpiStrip } from "@/components/creator-content/creator-content-kpi-strip";
import { CreatorContentList } from "@/components/creator-content/creator-content-list";
import { CreatorContentMomentum } from "@/components/creator-content/creator-content-momentum";
import { CreatorContentNextAction } from "@/components/creator-content/creator-content-next-action";
import { CreatorContentSignal } from "@/components/creator-content/creator-content-signal";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { creatorContentStateToSearchParams } from "@/lib/creator-content-url";
import { useAdminCreatorContentCommand } from "@/lib/hooks/use-admin-creator-content-command";
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
    actionError,
    clearActionError,
    moderatingContentId,
    organizations,
    activeCity,
    reload,
    setStatusFilter,
    setOrganizationFilter,
    setSearchQuery,
    resetFilters,
    hasActiveFilters,
    goToPage,
    approveContent,
    rejectContent,
  } = useAdminCreatorContentList();

  const command = useAdminCreatorContentCommand(activeCity);
  const listSearchQuery = creatorContentStateToSearchParams(state);
  const editorialIsEmpty = (command.metrics?.total ?? 0) === 0;

  async function handleRefresh() {
    await Promise.all([reload(), command.reloadSummary()]);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <CreatorContentHero isLoading={isLoading || command.isLoading} onRefresh={() => void handleRefresh()} />
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
      {command.signal ? <CreatorContentSignal signal={command.signal} /> : null}
      {command.nextAction ? <CreatorContentNextAction action={command.nextAction} /> : null}
      <CreatorContentKpiStrip cards={command.kpiCards} />
      {command.momentum ? <CreatorContentMomentum momentum={command.momentum} /> : null}
      <CreatorContentFilters
        state={state}
        organizations={organizations}
        isLoading={isLoading}
        onStatusChange={(status) => {
          clearActionError();
          setStatusFilter(status);
        }}
        onOrganizationChange={(organizationId) => {
          clearActionError();
          setOrganizationFilter(organizationId);
        }}
        onSearchSubmit={setSearchQuery}
        onRefresh={() => void handleRefresh()}
      />
      <CreatorContentList
        items={items}
        listSearchQuery={listSearchQuery}
        isLoading={isLoading}
        error={error}
        actionError={actionError}
        moderatingContentId={moderatingContentId}
        hasActiveFilters={hasActiveFilters}
        editorialIsEmpty={editorialIsEmpty}
        onRetry={reload}
        onResetFilters={resetFilters}
        onApprove={(contentId) =>
          void approveContent(contentId).then(() => command.reloadSummary())
        }
        onReject={(contentId, reason) =>
          void rejectContent(contentId, { reason }).then(() => command.reloadSummary())
        }
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
        <CreatorContentConseil
          message={command.conseilMessage}
          action={command.recommendedAction}
        />
      ) : null}
    </div>
  );
}
