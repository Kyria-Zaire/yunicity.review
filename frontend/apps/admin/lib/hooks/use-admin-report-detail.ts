"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminReportDetailResponse } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAdminReportDetail(reportId: string) {
  const { adminReportsApi } = useAuth();
  const [report, setReport] = useState<AdminReportDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
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

  return {
    report,
    isLoading,
    isRefreshing,
    error,
    isNotFound,
    reload,
  };
}
