"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  parsePassportOffersSearchParams,
  passportOffersStateToSearchParams,
  toAdminOfferListParams,
  type AdminOfferStatusFilter,
  type AdminOfferTypeFilter,
  type PassportOffersListState,
} from "@/lib/passport-offers-url";
import type { AdminOfferListItem, VerifiedOrganizationOption } from "@yunicity/types";
import { DEFAULT_ADMIN_OFFERS_CITY, isAuthError } from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAdminOffersList() {
  const { partnerOffersAdminApi } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(
    () => parsePassportOffersSearchParams(searchParams),
    [searchParams],
  );

  const [items, setItems] = useState<AdminOfferListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(state.pageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<VerifiedOrganizationOption[]>([]);

  useEffect(() => {
    void partnerOffersAdminApi.listVerifiedOrganizations().then((response) => {
      setOrganizations(response.items);
    });
  }, [partnerOffersAdminApi]);

  const replaceState = useCallback(
    (next: PassportOffersListState) => {
      const params = passportOffersStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/passport-offers?${qs}` : "/passport-offers");
    },
    [router],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await partnerOffersAdminApi.listOffers(toAdminOfferListParams(state));
      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.page_size);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(
        isAuthError(err) ? err.message : "Impossible de charger les offres pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [partnerOffersAdminApi, state]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatusFilter = useCallback(
    (status: AdminOfferStatusFilter) => {
      replaceState({ ...state, status, page: 1 });
    },
    [replaceState, state],
  );

  const setOrganizationFilter = useCallback(
    (organizationId: string) => {
      replaceState({ ...state, organizationId, page: 1 });
    },
    [replaceState, state],
  );

  const setOfferTypeFilter = useCallback(
    (offerType: AdminOfferTypeFilter) => {
      replaceState({ ...state, offerType, page: 1 });
    },
    [replaceState, state],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      replaceState({ ...state, page: Math.max(1, nextPage) });
    },
    [replaceState, state],
  );

  const activeCity = useMemo(() => {
    if (state.organizationId) {
      const org = organizations.find((entry) => entry.id === state.organizationId);
      if (org?.city) {
        return org.city;
      }
    }
    return DEFAULT_ADMIN_OFFERS_CITY;
  }, [organizations, state.organizationId]);

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
    organizations,
    activeCity,
    reload: load,
    setStatusFilter,
    setOrganizationFilter,
    setOfferTypeFilter,
    goToPage,
  };
}
