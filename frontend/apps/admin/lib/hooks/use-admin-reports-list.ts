"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  MODERATION_DEFAULT_LIST_STATE,
  moderationStateToSearchParams,
  parseModerationSearchParams,
  toAdminReportListParams,
  type AdminModerationListState,
} from "@/lib/moderation-url";
import { mapAdminError } from "@/lib/admin-query";
import type { AdminReportStatusSummary } from "@yunicity/types";
import { moderationHasActiveFilters } from "@yunicity/utils";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

const EMPTY_SUMMARY: AdminReportStatusSummary = {
  total: 0,
  pending: 0,
  resolved: 0,
  dismissed: 0,
};

export function useAdminReportsList() {
  const { adminReportsApi } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(
    () => parseModerationSearchParams(searchParams),
    [searchParams],
  );

  const query = useQuery({
    queryKey: ["admin", "reports", "list", state],
    queryFn: () => adminReportsApi.listReports(toAdminReportListParams(state)),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const page = query.data?.page ?? 1;
  const pageSize = query.data?.page_size ?? state.pageSize;
  const summary = query.data?.summary ?? EMPTY_SUMMARY;

  const { refetch } = query;
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const replaceState = useCallback(
    (next: AdminModerationListState) => {
      const params = moderationStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/moderation?${qs}` : "/moderation");
    },
    [router],
  );

  const setStatusFilter = useCallback(
    (status: AdminModerationListState["status"]) => {
      replaceState({ ...state, status, page: 1 });
    },
    [replaceState, state],
  );

  const setReasonFilter = useCallback(
    (reason: AdminModerationListState["reason"]) => {
      replaceState({ ...state, reason, page: 1 });
    },
    [replaceState, state],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      replaceState({ ...state, page: Math.max(1, nextPage) });
    },
    [replaceState, state],
  );

  const resetFilters = useCallback(() => {
    replaceState(MODERATION_DEFAULT_LIST_STATE);
  }, [replaceState]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasActiveFilters = moderationHasActiveFilters(state);

  return {
    state,
    items,
    total,
    page,
    pageSize,
    totalPages,
    summary,
    isLoading: query.isPending,
    error: mapAdminError(
      query.error,
      "Impossible de charger les signalements pour le moment.",
    ),
    hasActiveFilters,
    reload,
    setStatusFilter,
    setReasonFilter,
    resetFilters,
    goToPage,
  };
}
