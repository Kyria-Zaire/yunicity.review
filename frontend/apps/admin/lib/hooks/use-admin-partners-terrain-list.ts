"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { mapAdminError } from "@/lib/admin-query";
import type { AdminPartnersTerrainListParams } from "@yunicity/types";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

export function useAdminPartnersTerrainList(params: AdminPartnersTerrainListParams) {
  const { adminPartnersApi } = useAuth();
  const [page, setPage] = useState(params.page ?? 1);
  const pageSize = params.page_size ?? 20;

  const requestParams = { ...params, page, page_size: pageSize };

  const query = useQuery({
    queryKey: ["admin", "partners", "terrain", requestParams],
    queryFn: () => adminPartnersApi.listTerrain(requestParams),
  });

  const { refetch } = query;
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    pageSize: query.data?.page_size ?? pageSize,
    isLoading: query.isPending,
    error: mapAdminError(query.error, "Impossible de charger les partenaires."),
    reload,
    setPage,
  };
}
