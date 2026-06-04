"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { PartnerOfferAdminRedemptionItem } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export const OFFER_REDEMPTIONS_PAGE_SIZE = 20;

export function useAdminOfferRedemptions(offerId: string, enabled: boolean) {
  const { partnerOffersAdminApi } = useAuth();
  const [items, setItems] = useState<PartnerOfferAdminRedemptionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(OFFER_REDEMPTIONS_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !offerId.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await partnerOffersAdminApi.listOfferRedemptions(offerId, {
        page,
        page_size: OFFER_REDEMPTIONS_PAGE_SIZE,
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
          : "Impossible de charger l'historique des utilisations pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled, offerId, page, partnerOffersAdminApi]);

  useEffect(() => {
    setPage(1);
  }, [offerId]);

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
