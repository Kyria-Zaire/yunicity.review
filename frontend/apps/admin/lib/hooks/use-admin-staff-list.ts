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

export interface AdminStaffKpiSummary {
  total: number;
  active: number;
  suspended: number;
  superAdmins: number;
}

const EMPTY_KPIS: AdminStaffKpiSummary = {
  total: 0,
  active: 0,
  suspended: 0,
  superAdmins: 0,
};

export function useAdminStaffList() {
  const { adminStaffApi } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(() => parseStaffSearchParams(searchParams), [searchParams]);

  const [items, setItems] = useState<AdminStaffListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(state.pageSize);
  const [kpis, setKpis] = useState<AdminStaffKpiSummary>(EMPTY_KPIS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const replaceState = useCallback(
    (next: AdminStaffListState) => {
      const params = staffStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/staff?${qs}` : "/staff");
    },
    [router],
  );

  const loadKpis = useCallback(async () => {
    setIsLoadingKpis(true);
    try {
      const [all, active, suspended, superAdmins] = await Promise.all([
        adminStaffApi.listStaff({ page: 1, page_size: 1 }),
        adminStaffApi.listStaff({ page: 1, page_size: 1, is_active: true }),
        adminStaffApi.listStaff({ page: 1, page_size: 1, is_active: false }),
        adminStaffApi.listStaff({ page: 1, page_size: 1, role: "SUPER_ADMIN" }),
      ]);
      setKpis({
        total: all.total,
        active: active.total,
        suspended: suspended.total,
        superAdmins: superAdmins.total,
      });
    } catch {
      setKpis(EMPTY_KPIS);
    } finally {
      setIsLoadingKpis(false);
    }
  }, [adminStaffApi]);

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
    void loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(async () => {
    await Promise.all([loadKpis(), load()]);
  }, [load, loadKpis]);

  const setRoleFilter = useCallback(
    (role: AdminStaffListState["role"]) => {
      replaceState({ ...state, role, page: 1 });
    },
    [replaceState, state],
  );

  const setActiveFilter = useCallback(
    (active: AdminStaffListState["active"]) => {
      replaceState({ ...state, active, page: 1 });
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
    kpis,
    isLoading,
    isLoadingKpis,
    error,
    reload,
    setRoleFilter,
    setActiveFilter,
    goToPage,
  };
}
