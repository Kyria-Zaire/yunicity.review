"use client";

import type { AuthUser, LoginRequest } from "@yunicity/types";
import { createAdminCockpitApi, type AdminCockpitApi } from "@/lib/admin-cockpit-api";
import { createAdminActivationWavesApi } from "@/lib/admin-activation-waves-api";
import {
  MemoryTokenStorage,
  createAdminAnalyticsApi,
  createAdminPlatformConfigApi,
  createAdminActivityApi,
  createAdminEventsApi,
  createAdminReportsApi,
  createAdminStaffApi,
  createAdminOrganizationsApi,
  createAdminPartnersApi,
  createAdminPassportsApi,
  createAuthClient,
  createPartnerLeadsApi,
  createPartnerOffersAdminApi,
  createPartnerCreatorContentAdminApi,
  createOrganizationApi,
  createPartnerOffersApi,
  createPartnersApi,
  createScanApi,
  getWebApiBaseUrl,
  humanizeAuthFailure,
  type AdminActivationWavesApi,
  type AdminAnalyticsApi,
  type AdminPlatformConfigApi,
  type AdminActivityApi,
  type AdminEventsApi,
  type AdminReportsApi,
  type AdminStaffApi,
  type AdminOrganizationsApi,
  type AdminPartnersApi,
  type AdminPassportsApi,
  type OrganizationApi,
  type PartnerLeadsApi,
  type PartnerCreatorContentAdminApi,
  type PartnerOffersAdminApi,
  type PartnerOffersApi,
  type PartnersApi,
  type ScanApi,
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

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  partnerLeadsApi: PartnerLeadsApi;
  partnerOffersAdminApi: PartnerOffersAdminApi;
  partnerCreatorContentAdminApi: PartnerCreatorContentAdminApi;
  partnerOffersApi: PartnerOffersApi;
  organizationApi: OrganizationApi;
  scanApi: ScanApi;
  partnersApi: PartnersApi;
  adminCockpitApi: AdminCockpitApi;
  adminAnalyticsApi: AdminAnalyticsApi;
  adminPlatformConfigApi: AdminPlatformConfigApi;
  adminActivityApi: AdminActivityApi;
  adminEventsApi: AdminEventsApi;
  adminReportsApi: AdminReportsApi;
  adminStaffApi: AdminStaffApi;
  adminOrganizationsApi: AdminOrganizationsApi;
  adminPartnersApi: AdminPartnersApi;
  adminPassportsApi: AdminPassportsApi;
  adminActivationWavesApi: AdminActivationWavesApi;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const storage = useMemo(() => new MemoryTokenStorage(), []);
  const apiBaseUrl = getWebApiBaseUrl();

  const client = useMemo(
    () =>
      createAuthClient({
        apiBaseUrl,
        platform: "admin",
        storage,
        onSessionCleared: () => setUser(null),
      }),
    [storage, apiBaseUrl],
  );

  const partnerLeadsApi = useMemo(
    () => createPartnerLeadsApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const partnerOffersAdminApi = useMemo(
    () => createPartnerOffersAdminApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const partnerCreatorContentAdminApi = useMemo(
    () => createPartnerCreatorContentAdminApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const partnerOffersApi = useMemo(
    () => createPartnerOffersApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const organizationApi = useMemo(
    () => createOrganizationApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const scanApi = useMemo(() => createScanApi(client, apiBaseUrl), [client, apiBaseUrl]);

  const partnersApi = useMemo(() => createPartnersApi(client, apiBaseUrl), [client, apiBaseUrl]);

  const adminCockpitApi = useMemo(
    () => createAdminCockpitApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminAnalyticsApi = useMemo(
    () => createAdminAnalyticsApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminPlatformConfigApi = useMemo(
    () => createAdminPlatformConfigApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminActivityApi = useMemo(
    () => createAdminActivityApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminEventsApi = useMemo(
    () => createAdminEventsApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminReportsApi = useMemo(
    () => createAdminReportsApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminStaffApi = useMemo(
    () => createAdminStaffApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminOrganizationsApi = useMemo(
    () => createAdminOrganizationsApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminPartnersApi = useMemo(
    () => createAdminPartnersApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminPassportsApi = useMemo(
    () => createAdminPassportsApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  const adminActivationWavesApi = useMemo(
    () => createAdminActivationWavesApi(client, apiBaseUrl),
    [client, apiBaseUrl],
  );

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        await client.refreshAccessToken();
        const me = await client.me();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      setError(null);
      try {
        const response = await client.login(payload);
        setUser(response.user);
      } catch (err) {
        setError(humanizeAuthFailure(err, "Connexion impossible."));
      }
    },
    [client],
  );

  const logout = useCallback(async () => {
    setError(null);
    await client.logout();
    setUser(null);
  }, [client]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      error,
      partnerLeadsApi,
      partnerOffersAdminApi,
      partnerCreatorContentAdminApi,
      partnerOffersApi,
      organizationApi,
      scanApi,
      partnersApi,
      adminCockpitApi,
      adminAnalyticsApi,
      adminPlatformConfigApi,
      adminActivityApi,
      adminEventsApi,
      adminReportsApi,
      adminStaffApi,
      adminOrganizationsApi,
      adminPartnersApi,
      adminPassportsApi,
      adminActivationWavesApi,
      login,
      logout,
      clearError,
    }),
    [
      user,
      isLoading,
      error,
      partnerLeadsApi,
      partnerOffersAdminApi,
      partnerCreatorContentAdminApi,
      partnerOffersApi,
      organizationApi,
      scanApi,
      partnersApi,
      adminCockpitApi,
      adminAnalyticsApi,
      adminPlatformConfigApi,
      adminActivityApi,
      adminEventsApi,
      adminReportsApi,
      adminStaffApi,
      adminOrganizationsApi,
      adminPartnersApi,
      adminPassportsApi,
      adminActivationWavesApi,
      login,
      logout,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
}
