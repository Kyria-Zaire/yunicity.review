"use client";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type {
  LocalEventManagement,
  OrganizationMeItem,
  PartnerCreatorContentManagement,
  PartnerOfferManagement,
  PartnerOfferPublic,
  PartnerPublic,
} from "@yunicity/types";
import {
  filterPartnerPortalOrganizations,
  isPublicPartnerProfile,
  isPartnerPortalManager,
} from "@yunicity/utils";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PartnerPortalContextValue = {
  organizations: OrganizationMeItem[];
  manageableOrganizations: OrganizationMeItem[];
  organization: OrganizationMeItem | null;
  partner: PartnerPublic | null;
  offers: PartnerOfferManagement[];
  publicOffers: PartnerOfferPublic[];
  events: LocalEventManagement[];
  creatorContents: PartnerCreatorContentManagement[];
  isLoading: boolean;
  error: string | null;
  canManage: boolean;
  hasActivePartnerSpace: boolean;
  reload: () => Promise<void>;
  setOrganizationId: (id: string) => void;
};

const PartnerPortalContext = createContext<PartnerPortalContextValue | null>(null);

export function PartnerPortalProvider({ children }: { children: ReactNode }) {
  const api = useYunicityApi();
  const [organizations, setOrganizations] = useState<OrganizationMeItem[]>([]);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [partner, setPartner] = useState<PartnerPublic | null>(null);
  const [offers, setOffers] = useState<PartnerOfferManagement[]>([]);
  const [publicOffers, setPublicOffers] = useState<PartnerOfferPublic[]>([]);
  const [events, setEvents] = useState<LocalEventManagement[]>([]);
  const [creatorContents, setCreatorContents] = useState<PartnerCreatorContentManagement[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const manageableOrganizations = useMemo(
    () => filterPartnerPortalOrganizations(organizations),
    [organizations],
  );

  const organization = useMemo(() => {
    if (manageableOrganizations.length === 0) return null;
    const found = manageableOrganizations.find((o) => o.id === organizationId);
    return found ?? manageableOrganizations[0] ?? null;
  }, [manageableOrganizations, organizationId]);

  const loadOrganizations = useCallback(async () => {
    const orgRes = await api.listMyOrganizations();
    setOrganizations(orgRes.items);
    const manageable = filterPartnerPortalOrganizations(orgRes.items);
    if (manageable.length > 0) {
      setOrganizationId((current) =>
        manageable.some((o) => o.id === current) ? current : manageable[0]!.id,
      );
    }
  }, [api]);

  const loadOrganizationData = useCallback(
    async (activeOrg: OrganizationMeItem) => {
      setIsLoading(true);
      setError(null);
      try {
        const [partnerRes, offersRes, publicOffersRes, eventsRes, contentsRes] =
          await Promise.allSettled([
            api.getPartner(activeOrg.slug, activeOrg.city),
            api.partnerOffers.listOffers({
              organization_id: activeOrg.id,
              page_size: 50,
            }),
            api.listPartnerOffers(activeOrg.slug, activeOrg.city, { limit: 20 }),
            api.organizationEvents.listEvents({
              organization_id: activeOrg.id,
              page_size: 50,
            }),
            api.organizationCreatorContent.listContents({
              organization_id: activeOrg.id,
              page_size: 50,
            }),
          ]);

        setPartner(partnerRes.status === "fulfilled" ? partnerRes.value : null);
        setOffers(offersRes.status === "fulfilled" ? offersRes.value.items : []);
        setPublicOffers(
          publicOffersRes.status === "fulfilled" ? publicOffersRes.value.items : [],
        );
        setEvents(eventsRes.status === "fulfilled" ? eventsRes.value.items : []);
        setCreatorContents(
          contentsRes.status === "fulfilled" ? contentsRes.value.items : [],
        );
      } catch {
        setError("Impossible de charger l’espace partenaire.");
      } finally {
        setIsLoading(false);
      }
    },
    [api],
  );

  const reload = useCallback(async () => {
    await loadOrganizations();
    if (organization) {
      await loadOrganizationData(organization);
    }
  }, [loadOrganizations, loadOrganizationData, organization]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (!organization) {
      setPartner(null);
      setOffers([]);
      setPublicOffers([]);
      setEvents([]);
      setCreatorContents([]);
      setIsLoading(false);
      return;
    }
    void loadOrganizationData(organization);
  }, [organization, loadOrganizationData]);

  const canManage = organization !== null && isPartnerPortalManager(organization);
  const hasActivePartnerSpace =
    partner !== null && isPublicPartnerProfile(partner) && canManage;

  const value = useMemo(
    (): PartnerPortalContextValue => ({
      organizations,
      manageableOrganizations,
      organization,
      partner,
      offers,
      publicOffers,
      events,
      creatorContents,
      isLoading,
      error,
      canManage,
      hasActivePartnerSpace,
      reload,
      setOrganizationId,
    }),
    [
      organizations,
      manageableOrganizations,
      organization,
      partner,
      offers,
      publicOffers,
      events,
      creatorContents,
      isLoading,
      error,
      canManage,
      hasActivePartnerSpace,
      reload,
    ],
  );

  return (
    <PartnerPortalContext.Provider value={value}>{children}</PartnerPortalContext.Provider>
  );
}

export function usePartnerPortalContext(): PartnerPortalContextValue {
  const ctx = useContext(PartnerPortalContext);
  if (!ctx) {
    throw new Error("usePartnerPortalContext must be used within PartnerPortalProvider");
  }
  return ctx;
}

export function usePartnerPortalContextOptional(): PartnerPortalContextValue | null {
  return useContext(PartnerPortalContext);
}
