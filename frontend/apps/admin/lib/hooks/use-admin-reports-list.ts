"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  moderationStateToSearchParams,
  parseModerationSearchParams,
  toAdminReportListParams,
  type AdminModerationListState,
} from "@/lib/moderation-url";
import type { AdminReportListItem, AdminReportStatusSummary } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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

  const [items, setItems] = useState<AdminReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(state.pageSize);
  const [summary, setSummary] = useState<AdminReportStatusSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const replaceState = useCallback(
    (next: AdminModerationListState) => {
      const params = moderationStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/moderation?${qs}` : "/moderation");
    },
    [router],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminReportsApi.listReports(toAdminReportListParams(state));
      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.page_size);
      setSummary(response.summary);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setSummary(EMPTY_SUMMARY);
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les signalements pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminReportsApi, state]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    state,
    items,
    total,
    page,
    pageSize,
    totalPages,
    summary,
    isLoading,
    error,
    reload: load,
    setStatusFilter,
    setReasonFilter,
    goToPage,
  };
}
