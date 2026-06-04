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
  const [isNotFound, setIsNotFound] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    try {
      const data = await partnerCreatorContentAdminApi.getContent(contentId);
      setContent(data);
    } catch (err) {
      setContent(null);
      if (isAuthError(err) && err.status === 404 && err.code === "CREATOR_CONTENT_NOT_FOUND") {
        setIsNotFound(true);
        setError(null);
      } else {
        setError(isAuthError(err) ? err.message : "Contenu introuvable.");
      }
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
      return true;
    } catch (err) {
      setActionError(isAuthError(err) ? err.message : "Approbation impossible.");
      return false;
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
        return true;
      } catch (err) {
        setActionError(isAuthError(err) ? err.message : "Refus impossible.");
        return false;
      } finally {
        setIsModerating(false);
      }
    },
    [contentId, partnerCreatorContentAdminApi],
  );

  const archive = useCallback(async () => {
    setIsModerating(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const updated = await partnerCreatorContentAdminApi.archiveContent(contentId);
      setContent(updated);
      setSuccessMessage("Contenu archivé — retrait du feed et de la fiche partenaire.");
      return true;
    } catch (err) {
      setActionError(isAuthError(err) ? err.message : "Archivage impossible.");
      return false;
    } finally {
      setIsModerating(false);
    }
  }, [contentId, partnerCreatorContentAdminApi]);

  const clearActionFeedback = useCallback(() => {
    setActionError(null);
    setSuccessMessage(null);
  }, []);

  return {
    content,
    isLoading,
    error,
    isNotFound,
    isModerating,
    actionError,
    successMessage,
    reload: load,
    clearActionFeedback,
    approve,
    reject,
    archive,
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
