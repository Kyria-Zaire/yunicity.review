"use client";

import { EventsConseil } from "@/components/events/events-conseil";
import { EventsFilters } from "@/components/events/events-filters";
import { EventsHero } from "@/components/events/events-hero";
import { EventsKpiStrip } from "@/components/events/events-kpi-strip";
import { EventsList } from "@/components/events/events-list";
import { EventsMomentum } from "@/components/events/events-momentum";
import { EventsNextAction } from "@/components/events/events-next-action";
import { EventsSignal } from "@/components/events/events-signal";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { eventsStateToSearchParams } from "@/lib/events-url";
import { useAdminEventsCommand } from "@/lib/hooks/use-admin-events-command";
import { useAdminEventsList } from "@/lib/hooks/use-admin-events-list";

export function EventsWorkspace() {
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
    moderatingEventId,
    activeCity,
    reload,
    setStatusFilter,
    setCityFilter,
    setSearchQuery,
    setEventTypeFilter,
    resetFilters,
    hasActiveFilters,
    goToPage,
    approveEvent,
    rejectEvent,
  } = useAdminEventsList();

  const command = useAdminEventsCommand(activeCity);
  const listSearchQuery = eventsStateToSearchParams(state);
  const agendaIsEmpty = (command.metrics?.total ?? 0) === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <EventsHero />
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
      {command.signal ? <EventsSignal signal={command.signal} /> : null}
      {command.nextAction ? <EventsNextAction action={command.nextAction} /> : null}
      <EventsKpiStrip cards={command.kpiCards} />
      {command.momentum ? <EventsMomentum momentum={command.momentum} /> : null}
      <EventsFilters
        state={state}
        isLoading={isLoading}
        onStatusChange={(status) => {
          clearActionError();
          setStatusFilter(status);
        }}
        onCityChange={(city) => {
          clearActionError();
          setCityFilter(city);
        }}
        onEventTypeChange={(eventType) => {
          clearActionError();
          setEventTypeFilter(eventType);
        }}
        onSearchSubmit={setSearchQuery}
        onRefresh={reload}
      />
      <EventsList
        items={items}
        listSearchQuery={listSearchQuery}
        isLoading={isLoading}
        error={error}
        actionError={actionError}
        moderatingEventId={moderatingEventId}
        hasActiveFilters={hasActiveFilters}
        agendaIsEmpty={agendaIsEmpty}
        onRetry={reload}
        onResetFilters={resetFilters}
        onApprove={(eventId) => void approveEvent(eventId)}
        onReject={(eventId, reason) => void rejectEvent(eventId, { reason })}
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
        <EventsConseil message={command.conseilMessage} action={command.recommendedAction} />
      ) : null}
    </div>
  );
}
