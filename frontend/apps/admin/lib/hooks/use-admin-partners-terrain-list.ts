"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  AdminPartnersTerrainListItem,
  AdminPartnersTerrainListParams,
} from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function useAdminPartnersTerrainList(params: AdminPartnersTerrainListParams) {
  const { adminPartnersApi } = useAuth();
  const [items, setItems] = useState<AdminPartnersTerrainListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(params.page ?? 1);
  const [pageSize, setPageSize] = useState(params.page_size ?? 20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminPartnersApi.listTerrain({
        ...params,
        page,
        page_size: pageSize,
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
          : "Impossible de charger les partenaires.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminPartnersApi, params, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    total,
    page,
    pageSize,
    isLoading,
    error,
    reload: load,
    setPage,
  };
}
