"use client";

import type { AuthUser, LoginRequest, RegisterRequest } from "@yunicity/types";
import {
  MemoryTokenStorage,
  createAuthClient,
  createYunicityApi,
  getWebApiBaseUrl,
  humanizeAuthFailure,
  syncPassportSessionUser,
  type YunicityApi,
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
  yunicityApi: YunicityApi;
  login: (payload: LoginRequest) => Promise<boolean>;
  register: (payload: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
        platform: "web",
        storage,
        onSessionCleared: () => {
          syncPassportSessionUser(null);
          setUser(null);
        },
      }),
    [apiBaseUrl, storage],
  );

  const yunicityApi = useMemo(
    () => createYunicityApi(client, apiBaseUrl),
    [apiBaseUrl, client],
  );

  const refreshUser = useCallback(async () => {
    const me = await client.me();
    setUser(me);
  }, [client]);

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

  /**
   * Restauration depuis le cache arrière/avant (bfcache) : le JS reprend avec un
   * access token en mémoire parfois expiré. On force un refresh cookie avant que
   * les hooks métier (profil, chrome citoyen) ne partent en 401.
   */
  useEffect(() => {
    async function recoverSessionFromBFCache() {
      try {
        await client.refreshAccessToken();
        const me = await client.me();
        setUser(me);
      } catch {
        setUser(null);
      }
    }

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        void recoverSessionFromBFCache();
      }
    }

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [client]);

  useEffect(() => {
    syncPassportSessionUser(user?.id ?? null);
  }, [user?.id]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      setError(null);
      try {
        const response = await client.login(payload);
        setUser(response.user);
        return true;
      } catch (err) {
        setError(humanizeAuthFailure(err, "Connexion impossible."));
        return false;
      }
    },
    [client],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      setError(null);
      try {
        const response = await client.register(payload);
        setUser(response.user);
        return true;
      } catch (err) {
        setError(humanizeAuthFailure(err, "Inscription impossible."));
        return false;
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
    yunicityApi,
    login,
    register,
    logout,
    refreshUser,
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
