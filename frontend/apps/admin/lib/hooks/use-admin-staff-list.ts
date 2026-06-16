"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { mapAdminError } from "@/lib/admin-query";
import {
  staffStateToSearchParams,
  parseStaffSearchParams,
  toAdminStaffListParams,
  type AdminStaffListState,
} from "@/lib/staff-url";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useAdminStaffList() {
  const { adminStaffApi } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const state = useMemo(
    () => parseStaffSearchParams(searchParams),
    [searchParams, searchKey],
  );

  const query = useQuery({
    queryKey: ["admin", "staff", "list", state],
    queryFn: () => adminStaffApi.listStaff(toAdminStaffListParams(state)),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const page = query.data?.page ?? 1;
  const pageSize = query.data?.page_size ?? state.pageSize;

  const { refetch } = query;
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const replaceState = useCallback(
    (next: AdminStaffListState) => {
      const params = staffStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/staff?${qs}` : "/staff");
    },
    [router],
  );

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
    isLoading: query.isPending,
    error: mapAdminError(
      query.error,
      "Impossible de charger les comptes staff pour le moment.",
    ),
    reload,
    setRoleFilter,
    setStatusFilter,
    resetFilters,
    goToPage,
  };
}
