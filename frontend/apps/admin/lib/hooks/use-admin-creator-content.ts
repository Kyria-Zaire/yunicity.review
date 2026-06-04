"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  PartnerCreatorContentAdmin,
  PartnerCreatorContentAdminListParams,
  PartnerCreatorContentRejectPayload,
} from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function useAdminCreatorContentDetail(contentId: string) {
  const { partnerCreatorContentAdminApi } = useAuth();
  const [content, setContent] = useState<PartnerCreatorContentAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await partnerCreatorContentAdminApi.getContent(contentId);
      setContent(data);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Contenu introuvable.");
      setContent(null);
    } finally {
      setIsLoading(false);
    }
  }, [contentId, partnerCreatorContentAdminApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = useCallback(async () => {
    setIsModerating(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const updated = await partnerCreatorContentAdminApi.approveContent(contentId);
      setContent(updated);
      setSuccessMessage("Contenu approuvé et publié.");
    } catch (err) {
      setActionError(isAuthError(err) ? err.message : "Approbation impossible.");
    } finally {
      setIsModerating(false);
    }
  }, [contentId, partnerCreatorContentAdminApi]);

  const reject = useCallback(
    async (payload: PartnerCreatorContentRejectPayload) => {
      setIsModerating(true);
      setActionError(null);
      setSuccessMessage(null);
      try {
        const updated = await partnerCreatorContentAdminApi.rejectContent(contentId, payload);
        setContent(updated);
        setSuccessMessage("Contenu refusé — le partenaire peut corriger et resoumettre.");
      } catch (err) {
        setActionError(isAuthError(err) ? err.message : "Refus impossible.");
      } finally {
        setIsModerating(false);
      }
    },
    [contentId, partnerCreatorContentAdminApi],
  );

  return {
    content,
    isLoading,
    error,
    isModerating,
    actionError,
    successMessage,
    reload: load,
    approve,
    reject,
  };
}

/** Centralise les appels API modération creator content (ADMIN-CREATOR-01). */
export function useAdminCreatorContent() {
  const { partnerCreatorContentAdminApi } = useAuth();

  const list = useCallback(
    (params?: PartnerCreatorContentAdminListParams) =>
      partnerCreatorContentAdminApi.listContents(params),
    [partnerCreatorContentAdminApi],
  );

  const getDetail = useCallback(
    (id: string) => partnerCreatorContentAdminApi.getContent(id),
    [partnerCreatorContentAdminApi],
  );

  const approve = useCallback(
    (id: string) => partnerCreatorContentAdminApi.approveContent(id),
    [partnerCreatorContentAdminApi],
  );

  const reject = useCallback(
    (id: string, payload: PartnerCreatorContentRejectPayload) =>
      partnerCreatorContentAdminApi.rejectContent(id, payload),
    [partnerCreatorContentAdminApi],
  );

  return {
    list,
    getDetail,
    approve,
    reject,
    api: partnerCreatorContentAdminApi,
  };
}
