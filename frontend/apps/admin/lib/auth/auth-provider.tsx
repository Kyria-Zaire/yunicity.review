"use client";

import type { AuthUser, LoginRequest } from "@yunicity/types";
import { createAdminCockpitApi, type AdminCockpitApi } from "@/lib/admin-cockpit-api";
import {
  MemoryTokenStorage,
  createAuthClient,
  createPartnerLeadsApi,
  createPartnerOffersAdminApi,
  createPartnerCreatorContentAdminApi,
  createOrganizationApi,
  createPartnerOffersApi,
  createPartnersApi,
  createScanApi,
  getWebApiBaseUrl,
  isAuthError,
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
        setError(isAuthError(err) ? err.message : "Connexion impossible.");
        throw err;
      }
    },
    [client],
  );

  const logout = useCallback(async () => {
    setError(null);
    await client.logout();
    setUser(null);
  }, [client]);

  const value: AuthContextValue = {
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
    login,
    logout,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
}
