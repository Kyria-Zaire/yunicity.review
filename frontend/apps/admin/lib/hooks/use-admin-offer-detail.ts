"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";
import type {
  PartnerOfferAdmin,
  PartnerOfferAdminUpdatePayload,
  PartnerOfferType,
} from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export interface OfferDetailFormState {
  title: string;
  description: string;
  offerType: PartnerOfferType;
  redemptionLimit: number;
  validFrom: string;
  validUntil: string;
}

function applyOfferToForm(offer: PartnerOfferAdmin): OfferDetailFormState {
  return {
    title: offer.title,
    description: offer.description ?? "",
    offerType: offer.offer_type,
    redemptionLimit: offer.redemption_limit,
    validFrom: toDatetimeLocalValue(offer.valid_from),
    validUntil: toDatetimeLocalValue(offer.valid_until),
  };
}

export function useAdminOfferDetail(offerId: string) {
  const { partnerOffersAdminApi } = useAuth();

  const [offer, setOffer] = useState<PartnerOfferAdmin | null>(null);
  const [form, setForm] = useState<OfferDetailFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModerating, setIsModerating] = useState(false);

  const syncOffer = useCallback((data: PartnerOfferAdmin) => {
    setOffer(data);
    setForm(applyOfferToForm(data));
  }, []);

  const load = useCallback(async () => {
    if (!offerId.trim()) {
      setOffer(null);
      setForm(null);
      setIsNotFound(true);
      setError("Identifiant offre invalide.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    try {
      const data = await partnerOffersAdminApi.getOffer(offerId);
      syncOffer(data);
    } catch (err) {
      setOffer(null);
      setForm(null);
      if (isAuthError(err) && err.status === 404 && err.code === "OFFER_NOT_FOUND") {
        setIsNotFound(true);
        setError("Offre introuvable.");
      } else {
        setIsNotFound(false);
        setError(isAuthError(err) ? err.message : "Impossible de charger l'offre pour le moment.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [offerId, partnerOffersAdminApi, syncOffer]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateForm = useCallback((patch: Partial<OfferDetailFormState>) => {
    setForm((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const clearActionFeedback = useCallback(() => {
    setActionError(null);
    setActionSuccess(null);
  }, []);

  const saveOffer = useCallback(async () => {
    if (!offer || !form) {
      return false;
    }
    setIsSaving(true);
    setSaveError(null);
    const payload: PartnerOfferAdminUpdatePayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      offer_type: form.offerType,
      redemption_limit: form.redemptionLimit,
      valid_from: form.validFrom ? fromDatetimeLocalValue(form.validFrom) : null,
      valid_until: form.validUntil ? fromDatetimeLocalValue(form.validUntil) : null,
    };
    try {
      const updated = await partnerOffersAdminApi.updateOffer(offer.id, payload);
      syncOffer(updated);
      setActionSuccess("Modifications enregistrées.");
      return true;
    } catch (err) {
      setSaveError(isAuthError(err) ? err.message : "Enregistrement impossible.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [form, offer, partnerOffersAdminApi, syncOffer]);

  const approveOffer = useCallback(async () => {
    if (!offer) {
      return false;
    }
    setIsModerating(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await partnerOffersAdminApi.approveOffer(offer.id);
      syncOffer(updated);
      setActionSuccess("Offre approuvée et publiée.");
      return true;
    } catch (err) {
      setActionError(isAuthError(err) ? err.message : "Approbation impossible.");
      return false;
    } finally {
      setIsModerating(false);
    }
  }, [offer, partnerOffersAdminApi, syncOffer]);

  const rejectOffer = useCallback(
    async (reason: string) => {
      if (!offer || !reason.trim()) {
        return false;
      }
      setIsModerating(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        const updated = await partnerOffersAdminApi.rejectOffer(offer.id, {
          reason: reason.trim(),
        });
        syncOffer(updated);
        setActionSuccess("Offre refusée. Le partenaire peut ajuster et resoumettre.");
        return true;
      } catch (err) {
        setActionError(isAuthError(err) ? err.message : "Refus impossible.");
        return false;
      } finally {
        setIsModerating(false);
      }
    },
    [offer, partnerOffersAdminApi, syncOffer],
  );

  const archiveOffer = useCallback(async () => {
    if (!offer) {
      return false;
    }
    setIsModerating(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await partnerOffersAdminApi.archiveOffer(offer.id);
      syncOffer(updated);
      setActionSuccess("Offre archivée.");
      return true;
    } catch (err) {
      setActionError(isAuthError(err) ? err.message : "Archivage impossible.");
      return false;
    } finally {
      setIsModerating(false);
    }
  }, [offer, partnerOffersAdminApi, syncOffer]);

  return {
    offer,
    form,
    isLoading,
    error,
    isNotFound,
    saveError,
    actionError,
    actionSuccess,
    isSaving,
    isModerating,
    reload: load,
    updateForm,
    clearActionFeedback,
    saveOffer,
    approveOffer,
    rejectOffer,
    archiveOffer,
  };
}
