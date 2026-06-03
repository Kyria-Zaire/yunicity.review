"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  parsePassportOpsSearchParams,
  passportOpsStateToSearchParams,
  toAdminPassportListParams,
  type PassportOpsListState,
} from "@/lib/passport-ops-url";
import type { AdminPassportListItem } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAdminPassportsList() {
  const { adminPassportsApi } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(
    () => parsePassportOpsSearchParams(searchParams),
    [searchParams],
  );

  const [items, setItems] = useState<AdminPassportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const replaceState = useCallback(
    (next: PassportOpsListState) => {
      const params = passportOpsStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/passport-ops?${qs}` : "/passport-ops");
    },
    [router],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminPassportsApi.listPassports(toAdminPassportListParams(state));
      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.page_size);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les Passports pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminPassportsApi, state]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitSearch = useCallback(
    (draft: Pick<PassportOpsListState, "q" | "searchMode" | "status">) => {
      replaceState({
        ...state,
        q: draft.q.trim(),
        searchMode: draft.searchMode,
        status: draft.status,
        page: 1,
      });
    },
    [replaceState, state],
  );

  const setStatusFilter = useCallback(
    (status: PassportOpsListState["status"]) => {
      replaceState({ ...state, status, page: 1 });
    },
    [replaceState, state],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      replaceState({ ...state, page: Math.max(1, nextPage) });
    },
    [replaceState, state],
  );

  const hasSearchQuery = state.q.length > 0;
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
    hasSearchQuery,
    reload: load,
    submitSearch,
    setStatusFilter,
    goToPage,
  };
}
