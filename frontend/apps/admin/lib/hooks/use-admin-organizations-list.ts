"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminOrganizationListParams, AdminOrganizationListItem } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function useAdminOrganizationsList(params: AdminOrganizationListParams) {
  const { adminOrganizationsApi } = useAuth();
  const [items, setItems] = useState<AdminOrganizationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 20;
  const city = params.city;
  const verificationStatus = params.verification_status;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminOrganizationsApi.listOrganizations({
        city,
        verification_status: verificationStatus,
        page,
        page_size: pageSize,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les organisations pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminOrganizationsApi, city, verificationStatus, page, pageSize]);

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
  };
}
