"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  AdminReportDetailResponse,
  AdminReportDismissPayload,
  AdminReportResolvePayload,
} from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAdminReportDetail(reportId: string) {
  const { adminReportsApi } = useAuth();
  const [report, setReport] = useState<AdminReportDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const reload = useCallback(async () => {
    const background = hasLoadedRef.current;
    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    setIsNotFound(false);
    try {
      const data = await adminReportsApi.getReportDetail(reportId);
      setReport(data);
      hasLoadedRef.current = true;
    } catch (err) {
      setReport(null);
      hasLoadedRef.current = false;
      if (isAuthError(err) && err.status === 404 && err.code === "REPORT_NOT_FOUND") {
        setIsNotFound(true);
        setError(null);
      } else {
        setError(
          isAuthError(err) ? err.message : "Impossible de charger le signalement.",
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminReportsApi, reportId]);

  useEffect(() => {
    hasLoadedRef.current = false;
    void reload();
  }, [reload]);

  const clearActionFeedback = useCallback(() => {
    setActionError(null);
    setSuccessMessage(null);
  }, []);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const dismissReport = useCallback(
    async (payload: AdminReportDismissPayload = {}) => {
      setIsSubmitting(true);
      setActionError(null);
      setSuccessMessage(null);
      try {
        const updated = await adminReportsApi.dismissReport(reportId, payload);
        setReport(updated);
        setSuccessMessage("Signalement classé sans suite.");
        return true;
      } catch (err) {
        setActionError(
          isAuthError(err)
            ? err.message
            : "Impossible de classer ce signalement sans suite.",
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [adminReportsApi, reportId],
  );

  const resolveReport = useCallback(
    async (payload: AdminReportResolvePayload) => {
      setIsSubmitting(true);
      setActionError(null);
      setSuccessMessage(null);
      try {
        const updated = await adminReportsApi.resolveReport(reportId, payload);
        setReport(updated);
        setSuccessMessage(
          payload.hide_post
            ? "Signalement résolu — le post a été masqué du feed."
            : "Signalement résolu.",
        );
        return true;
      } catch (err) {
        setActionError(
          isAuthError(err) ? err.message : "Impossible de résoudre ce signalement.",
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [adminReportsApi, reportId],
  );

  return {
    report,
    isLoading,
    isRefreshing,
    error,
    isNotFound,
    isSubmitting,
    actionError,
    successMessage,
    reload,
    clearActionFeedback,
    clearActionError,
    dismissReport,
    resolveReport,
  };
}
