"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  staffStateToSearchParams,
  parseStaffSearchParams,
  toAdminStaffListParams,
  type AdminStaffListState,
} from "@/lib/staff-url";
import type { AdminStaffListItem } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAdminStaffList() {
  const { adminStaffApi } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(() => parseStaffSearchParams(searchParams), [searchParams]);

  const [items, setItems] = useState<AdminStaffListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(state.pageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const replaceState = useCallback(
    (next: AdminStaffListState) => {
      const params = staffStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/staff?${qs}` : "/staff");
    },
    [router],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminStaffApi.listStaff(toAdminStaffListParams(state));
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
          : "Impossible de charger les comptes staff pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminStaffApi, state]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(async () => {
    await load();
  }, [load]);

  const setRoleFilter = useCallback(
    (role: AdminStaffListState["role"]) => {
      replaceState({ ...state, role, page: 1 });
    },
    [replaceState, state],
  );

  const setStatusFilter = useCallback(
    (status: AdminStaffListState["status"]) => {
      replaceState({ ...state, status, page: 1 });
    },
    [replaceState, state],
  );

  const resetFilters = useCallback(() => {
    replaceState({
      role: "",
      status: "",
      page: 1,
      pageSize: state.pageSize,
    });
  }, [replaceState, state.pageSize]);

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
    isLoading,
    error,
    reload,
    setRoleFilter,
    setStatusFilter,
    resetFilters,
    goToPage,
  };
}
