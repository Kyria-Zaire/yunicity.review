"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminStaffActionItem, AdminStaffDetailResponse } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export const STAFF_ACTIONS_PAGE_SIZE = 20;

export function useAdminStaffDetail(staffId: string) {
  const { adminStaffApi } = useAuth();
  const [staff, setStaff] = useState<AdminStaffDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const hasLoadedRef = useRef(false);

  const reload = useCallback(async () => {
    const background = hasLoadedRef.current;
    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    setIsNotFound(false);
    try {
      const data = await adminStaffApi.getStaffDetail(staffId);
      setStaff(data);
      hasLoadedRef.current = true;
    } catch (err) {
      setStaff(null);
      hasLoadedRef.current = false;
      if (isAuthError(err) && err.status === 404) {
        setIsNotFound(true);
        setError(null);
      } else {
        setError(
          isAuthError(err)
            ? err.message
            : "Impossible de charger la fiche staff.",
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminStaffApi, staffId]);

  useEffect(() => {
    hasLoadedRef.current = false;
    void reload();
  }, [reload]);

  return {
    staff,
    isLoading,
    isRefreshing,
    error,
    isNotFound,
    reload,
  };
}

export function useAdminStaffActions(staffId: string, enabled: boolean) {
  const { adminStaffApi } = useAuth();
  const [items, setItems] = useState<AdminStaffActionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(STAFF_ACTIONS_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !staffId.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminStaffApi.listStaffActions(staffId, {
        page,
        page_size: STAFF_ACTIONS_PAGE_SIZE,
      });
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
          : "Impossible de charger l'historique staff pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminStaffApi, enabled, page, staffId]);

  useEffect(() => {
    setPage(1);
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const goToPage = useCallback((nextPage: number) => {
    setPage(Math.max(1, nextPage));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    reload: load,
    goToPage,
  };
}
