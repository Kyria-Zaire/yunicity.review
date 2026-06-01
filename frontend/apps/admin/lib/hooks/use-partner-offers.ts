"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  OrganizationMeItem,
  PartnerOfferCreatePayload,
  PartnerOfferManagement,
  PartnerOfferManagementListParams,
  PartnerOfferUpdatePayload,
} from "@yunicity/types";
import {
  isAuthError,
  listOfferManageableOrganizations,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function usePartnerOrganizations() {
  const { organizationApi } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationMeItem[]>([]);
  const [manageable, setManageable] = useState<OrganizationMeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await organizationApi.listMyOrganizations();
      setOrganizations(data.items);
      setManageable(listOfferManageableOrganizations(data.items));
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger tes lieux.");
    } finally {
      setIsLoading(false);
    }
  }, [organizationApi]);

  useEffect(() => {
    void load();
  }, [load]);

  return { organizations, manageable, isLoading, error, reload: load };
}

export function usePartnerOffersList(params?: PartnerOfferManagementListParams) {
  const { partnerOffersApi } = useAuth();
  const [items, setItems] = useState<PartnerOfferManagement[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await partnerOffersApi.listOffers(params);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger tes offres.");
    } finally {
      setIsLoading(false);
    }
  }, [partnerOffersApi, params]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, total, isLoading, error, reload: load, partnerOffersApi };
}

export function usePartnerOfferMutations() {
  const { partnerOffersApi } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (payload: PartnerOfferCreatePayload) => {
      setIsBusy(true);
      setError(null);
      try {
        return await partnerOffersApi.createOffer(payload);
      } catch (err) {
        const message = isAuthError(err) ? err.message : "Création impossible.";
        setError(message);
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [partnerOffersApi],
  );

  const update = useCallback(
    async (id: string, payload: PartnerOfferUpdatePayload) => {
      setIsBusy(true);
      setError(null);
      try {
        return await partnerOffersApi.updateOffer(id, payload);
      } catch (err) {
        const message = isAuthError(err) ? err.message : "Mise à jour impossible.";
        setError(message);
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [partnerOffersApi],
  );

  const submit = useCallback(
    async (id: string) => {
      setIsBusy(true);
      setError(null);
      try {
        return await partnerOffersApi.submitOffer(id);
      } catch (err) {
        const message = isAuthError(err) ? err.message : "Envoi impossible.";
        setError(message);
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [partnerOffersApi],
  );

  return { create, update, submit, isBusy, error, clearError: () => setError(null) };
}
