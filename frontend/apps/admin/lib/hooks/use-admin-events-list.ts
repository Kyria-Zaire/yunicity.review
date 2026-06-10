"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  EVENTS_DEFAULT_LIST_STATE,
  eventsStateToSearchParams,
  parseEventsSearchParams,
  toAdminLocalEventListParams,
  type AdminEventsListState,
} from "@/lib/events-url";
import type { AdminLocalEventListItem, LocalEventRejectPayload } from "@yunicity/types";
import { eventsHasActiveFilters, isAuthError } from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAdminEventsList() {
  const { adminEventsApi } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(() => parseEventsSearchParams(searchParams), [searchParams]);

  const [items, setItems] = useState<AdminLocalEventListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(state.pageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [moderatingEventId, setModeratingEventId] = useState<string | null>(null);

  const replaceState = useCallback(
    (next: AdminEventsListState) => {
      const params = eventsStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/events?${qs}` : "/events");
    },
    [router],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminEventsApi.listEvents(toAdminLocalEventListParams(state));
      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.page_size);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(
        isAuthError(err) ? err.message : "Impossible de charger les événements pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminEventsApi, state]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatusFilter = useCallback(
    (status: AdminEventsListState["status"]) => {
      replaceState({ ...state, status, page: 1 });
    },
    [replaceState, state],
  );

  const setCityFilter = useCallback(
    (city: string) => {
      replaceState({ ...state, city: city.trim(), page: 1 });
    },
    [replaceState, state],
  );

  const setSearchQuery = useCallback(
    (q: string) => {
      replaceState({ ...state, q: q.trim(), page: 1 });
    },
    [replaceState, state],
  );

  const setEventTypeFilter = useCallback(
    (eventType: AdminEventsListState["eventType"]) => {
      replaceState({ ...state, eventType, page: 1 });
    },
    [replaceState, state],
  );

  const resetFilters = useCallback(() => {
    replaceState({ ...EVENTS_DEFAULT_LIST_STATE });
  }, [replaceState]);

  const hasActiveFilters = useMemo(() => eventsHasActiveFilters(state), [state]);

  const goToPage = useCallback(
    (nextPage: number) => {
      replaceState({ ...state, page: Math.max(1, nextPage) });
    },
    [replaceState, state],
  );

  const approveEvent = useCallback(
    async (eventId: string) => {
      setModeratingEventId(eventId);
      setActionError(null);
      try {
        await adminEventsApi.approveEvent(eventId);
        await load();
      } catch (err) {
        setActionError(isAuthError(err) ? err.message : "Approbation impossible.");
      } finally {
        setModeratingEventId(null);
      }
    },
    [adminEventsApi, load],
  );

  const rejectEvent = useCallback(
    async (eventId: string, payload: LocalEventRejectPayload) => {
      setModeratingEventId(eventId);
      setActionError(null);
      try {
        await adminEventsApi.rejectEvent(eventId, payload);
        await load();
      } catch (err) {
        setActionError(isAuthError(err) ? err.message : "Refus impossible.");
      } finally {
        setModeratingEventId(null);
      }
    },
    [adminEventsApi, load],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    state,
    items,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    moderatingEventId,
    activeCity: state.city,
    reload: load,
    setStatusFilter,
    setCityFilter,
    setSearchQuery,
    setEventTypeFilter,
    resetFilters,
    hasActiveFilters,
    goToPage,
    approveEvent,
    rejectEvent,
  };
}
