"use client";

import { EventsFilters } from "@/components/events/events-filters";
import { EventsHeader } from "@/components/events/events-header";
import { EventsKpiStrip } from "@/components/events/events-kpi-strip";
import { EventsList } from "@/components/events/events-list";
import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import { eventsStateToSearchParams } from "@/lib/events-url";
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
    goToPage,
    approveEvent,
    rejectEvent,
  } = useAdminEventsList();

  const listSearchQuery = eventsStateToSearchParams(state);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <EventsHeader />
      <EventsKpiStrip total={total} activeCity={activeCity} statusFilter={state.status} />
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
        onRefresh={reload}
      />
      <EventsList
        items={items}
        listSearchQuery={listSearchQuery}
        isLoading={isLoading}
        error={error}
        actionError={actionError}
        moderatingEventId={moderatingEventId}
        onRetry={reload}
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
    </div>
  );
}
