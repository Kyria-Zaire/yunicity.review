"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminPassportStampItem } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export const PASSPORT_STAMPS_PAGE_SIZE = 20;

export function useAdminPassportStamps(passportId: string, enabled: boolean) {
  const { adminPassportsApi } = useAuth();
  const [items, setItems] = useState<AdminPassportStampItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PASSPORT_STAMPS_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !passportId.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminPassportsApi.listPassportStamps(passportId, {
        page,
        page_size: PASSPORT_STAMPS_PAGE_SIZE,
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
          : "Impossible de charger les tampons pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminPassportsApi, enabled, page, passportId]);

  useEffect(() => {
    setPage(1);
  }, [passportId]);

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
