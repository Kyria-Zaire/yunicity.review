"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  AdminPassportDetailResponse,
  AdminPassportStatus,
} from "@yunicity/types";
import { isAuthError, passportStatusActionSuccessMessage, type PassportStatusActionKind } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

function actionErrorMessage(err: unknown): string {
  if (isAuthError(err)) {
    return err.message;
  }
  return "L'action n'a pas pu être effectuée pour le moment.";
}

export function useAdminPassportDetail(passportId: string) {
  const { adminPassportsApi } = useAuth();
  const [data, setData] = useState<AdminPassportDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!passportId.trim()) {
      setData(null);
      setIsNotFound(true);
      setError("Identifiant passport invalide.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    try {
      const response = await adminPassportsApi.getPassportDetail(passportId);
      setData(response);
    } catch (err) {
      setData(null);
      if (isAuthError(err) && err.status === 404 && err.code === "PASSPORT_NOT_FOUND") {
        setIsNotFound(true);
        setError("Passport introuvable.");
      } else {
        setIsNotFound(false);
        setError(
          isAuthError(err)
            ? err.message
            : "Impossible de charger la fiche passport pour le moment.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminPassportsApi, passportId]);

  useEffect(() => {
    void load();
  }, [load]);

  const clearActionFeedback = useCallback(() => {
    setActionError(null);
    setActionSuccess(null);
  }, []);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const patchStatus = useCallback(
    async (targetStatus: AdminPassportStatus, reason: string, kind: PassportStatusActionKind) => {
      setIsSubmitting(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        const response = await adminPassportsApi.patchPassportStatus(passportId, {
          status: targetStatus,
          reason,
        });
        setData(response);
        setActionSuccess(passportStatusActionSuccessMessage(kind));
        return true;
      } catch (err) {
        setActionError(actionErrorMessage(err));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [adminPassportsApi, passportId],
  );

  const suspendPassport = useCallback(
    (reason: string) => patchStatus("suspended", reason, "suspend"),
    [patchStatus],
  );

  const reactivatePassport = useCallback(
    (reason: string) => patchStatus("active", reason, "reactivate"),
    [patchStatus],
  );

  return {
    data,
    isLoading,
    error,
    isNotFound,
    reload: load,
    isSubmitting,
    actionError,
    actionSuccess,
    clearActionFeedback,
    clearActionError,
    suspendPassport,
    reactivatePassport,
  };
}
