"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  AdminPartnerActivatePayload,
  AdminPartnerCreateProfilePayload,
  AdminPartnerDetailResponse,
  AdminPartnerPatchPayload,
  AdminPartnerPausePayload,
  AdminPartnerUpgradePremiumPayload,
} from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

function actionErrorMessage(err: unknown): string {
  if (isAuthError(err)) {
    return err.message;
  }
  return "L'action n'a pas pu être effectuée pour le moment.";
}

export function useAdminPartnerDetail(organizationId: string) {
  const { adminPartnersApi } = useAuth();
  const [data, setData] = useState<AdminPartnerDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId.trim()) {
      setData(null);
      setIsNotFound(true);
      setError("Identifiant organisation invalide.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    try {
      const response = await adminPartnersApi.getPartnerDetail(organizationId);
      setData(response);
    } catch (err) {
      setData(null);
      if (isAuthError(err) && err.status === 404 && err.code === "ORGANIZATION_NOT_FOUND") {
        setIsNotFound(true);
        setError("Organisation introuvable.");
      } else {
        setIsNotFound(false);
        setError(
          isAuthError(err)
            ? err.message
            : "Impossible de charger la fiche partenaire pour le moment.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminPartnersApi, organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = useCallback(
    async (
      successMessage: string,
      action: () => Promise<AdminPartnerDetailResponse>,
    ): Promise<boolean> => {
      setIsSubmitting(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        const response = await action();
        setData(response);
        setActionSuccess(successMessage);
        return true;
      } catch (err) {
        setActionError(actionErrorMessage(err));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const clearActionFeedback = useCallback(() => {
    setActionError(null);
    setActionSuccess(null);
  }, []);

  const createProfile = useCallback(
    (payload: AdminPartnerCreateProfilePayload) =>
      runAction("Profil partenaire créé.", () =>
        adminPartnersApi.createProfile(organizationId, payload),
      ),
    [adminPartnersApi, organizationId, runAction],
  );

  const activate = useCallback(
    (payload: AdminPartnerActivatePayload) =>
      runAction("Partenaire activé.", () => adminPartnersApi.activate(organizationId, payload)),
    [adminPartnersApi, organizationId, runAction],
  );

  const pause = useCallback(
    (payload: AdminPartnerPausePayload) =>
      runAction("Partenaire mis en pause.", () => adminPartnersApi.pause(organizationId, payload)),
    [adminPartnersApi, organizationId, runAction],
  );

  const upgradePremium = useCallback(
    (payload: AdminPartnerUpgradePremiumPayload) =>
      runAction("Partenaire passé en premium.", () =>
        adminPartnersApi.upgradePremium(organizationId, payload),
      ),
    [adminPartnersApi, organizationId, runAction],
  );

  const patchSettings = useCallback(
    (payload: AdminPartnerPatchPayload) =>
      runAction("Réglages enregistrés.", () =>
        adminPartnersApi.patchSettings(organizationId, payload),
      ),
    [adminPartnersApi, organizationId, runAction],
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
    createProfile,
    activate,
    pause,
    upgradePremium,
    patchSettings,
  };
}
