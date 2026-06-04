"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminCreatorContentActionItem } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export const CREATOR_CONTENT_ACTIONS_PAGE_SIZE = 20;

export function useAdminCreatorContentActions(contentId: string, enabled: boolean) {
  const { partnerCreatorContentAdminApi } = useAuth();
  const [items, setItems] = useState<AdminCreatorContentActionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(CREATOR_CONTENT_ACTIONS_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !contentId.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await partnerCreatorContentAdminApi.listContentActions(contentId, {
        page,
        page_size: CREATOR_CONTENT_ACTIONS_PAGE_SIZE,
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
  }, [contentId, enabled, page, partnerCreatorContentAdminApi]);

  useEffect(() => {
    setPage(1);
  }, [contentId]);

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
