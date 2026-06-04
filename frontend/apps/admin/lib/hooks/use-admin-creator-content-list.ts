"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  creatorContentStateToSearchParams,
  parseCreatorContentSearchParams,
  toAdminCreatorContentListParams,
  type AdminCreatorContentListState,
} from "@/lib/creator-content-url";
import type { PartnerCreatorContentAdmin, VerifiedOrganizationOption } from "@yunicity/types";
import { CREATOR_CONTENT_MAX_PAGE_SIZE, isAuthError } from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function filterByOrganization(
  items: PartnerCreatorContentAdmin[],
  organizationId: string,
): PartnerCreatorContentAdmin[] {
  if (!organizationId) {
    return items;
  }
  return items.filter((item) => item.organization_id === organizationId);
}

function paginateClient<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function useAdminCreatorContentList() {
  const { partnerCreatorContentAdminApi, partnerOffersAdminApi } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo(
    () => parseCreatorContentSearchParams(searchParams),
    [searchParams],
  );

  const [items, setItems] = useState<PartnerCreatorContentAdmin[]>([]);
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
    (next: AdminCreatorContentListState) => {
      const params = creatorContentStateToSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `/creator-content?${qs}` : "/creator-content");
    },
    [router],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usesClientOrgFilter = Boolean(state.organizationId);
      const requestState = usesClientOrgFilter
        ? { ...state, page: 1, pageSize: CREATOR_CONTENT_MAX_PAGE_SIZE }
        : state;
      const response = await partnerCreatorContentAdminApi.listContents(
        toAdminCreatorContentListParams(requestState),
      );
      const filtered = filterByOrganization(response.items, state.organizationId);
      const visible = usesClientOrgFilter
        ? paginateClient(filtered, state.page, state.pageSize)
        : filtered;
      setItems(visible);
      setTotal(usesClientOrgFilter ? filtered.length : response.total);
      setPage(usesClientOrgFilter ? state.page : response.page);
      setPageSize(usesClientOrgFilter ? state.pageSize : response.page_size);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(
        isAuthError(err) ? err.message : "Impossible de charger les contenus pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [partnerCreatorContentAdminApi, state]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatusFilter = useCallback(
    (status: AdminCreatorContentListState["status"]) => {
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
    isLoading,
    error,
    organizations,
    usesClientOrganizationFilter: Boolean(state.organizationId),
    reload: load,
    setStatusFilter,
    setOrganizationFilter,
    goToPage,
  };
}
