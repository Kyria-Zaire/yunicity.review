"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  CREATOR_CONTENT_DEFAULT_LIST_STATE,
  creatorContentStateToSearchParams,
  parseCreatorContentSearchParams,
  toAdminCreatorContentListParams,
  type AdminCreatorContentListState,
} from "@/lib/creator-content-url";
import type { PartnerCreatorContentAdmin, PartnerCreatorContentRejectPayload, VerifiedOrganizationOption } from "@yunicity/types";
import { creatorContentHasActiveFilters, isAuthError } from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [actionError, setActionError] = useState<string | null>(null);
  const [moderatingContentId, setModeratingContentId] = useState<string | null>(null);
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
      const response = await partnerCreatorContentAdminApi.listContents(
        toAdminCreatorContentListParams(state),
      );
      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.page_size);
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

  const setSearchQuery = useCallback(
    (q: string) => {
      replaceState({ ...state, q: q.trim(), page: 1 });
    },
    [replaceState, state],
  );

  const resetFilters = useCallback(() => {
    replaceState({ ...CREATOR_CONTENT_DEFAULT_LIST_STATE });
  }, [replaceState]);

  const hasActiveFilters = useMemo(() => creatorContentHasActiveFilters(state), [state]);

  const goToPage = useCallback(
    (nextPage: number) => {
      replaceState({ ...state, page: Math.max(1, nextPage) });
    },
    [replaceState, state],
  );

  const approveContent = useCallback(
    async (contentId: string) => {
      setModeratingContentId(contentId);
      setActionError(null);
      try {
        await partnerCreatorContentAdminApi.approveContent(contentId);
        await load();
      } catch (err) {
        setActionError(isAuthError(err) ? err.message : "Approbation impossible.");
      } finally {
        setModeratingContentId(null);
      }
    },
    [load, partnerCreatorContentAdminApi],
  );

  const rejectContent = useCallback(
    async (contentId: string, payload: PartnerCreatorContentRejectPayload) => {
      setModeratingContentId(contentId);
      setActionError(null);
      try {
        await partnerCreatorContentAdminApi.rejectContent(contentId, payload);
        await load();
      } catch (err) {
        setActionError(isAuthError(err) ? err.message : "Refus impossible.");
      } finally {
        setModeratingContentId(null);
      }
    },
    [load, partnerCreatorContentAdminApi],
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
    actionError,
    clearActionError: () => setActionError(null),
    moderatingContentId,
    organizations,
    activeCity: state.city,
    reload: load,
    setStatusFilter,
    setOrganizationFilter,
    setSearchQuery,
    resetFilters,
    hasActiveFilters,
    goToPage,
    approveContent,
    rejectContent,
  };
}
