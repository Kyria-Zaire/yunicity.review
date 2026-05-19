import type { AuthUser, LoginRequest, RegisterRequest } from "@yunicity/types";
import {
  createAuthClient,
  createYunicityApi,
  getExpoApiBaseUrl,
  humanizeAuthFailure,
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

import { SecureTokenStorage } from "./secure-storage";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  yunicityApi: YunicityApi;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storage = useMemo(() => new SecureTokenStorage(), []);

  const apiBaseUrl = getExpoApiBaseUrl();

  const client = useMemo(
    () =>
      createAuthClient({
        apiBaseUrl,
        platform: "mobile",
        storage,
        onSessionCleared: () => setUser(null),
      }),
    [apiBaseUrl, storage],
  );

  const yunicityApi = useMemo(
    () => createYunicityApi(client, apiBaseUrl),
    [apiBaseUrl, client],
  );

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const access = await storage.getAccessToken();
        if (!access) {
          return;
        }
        try {
          const me = await client.me();
          if (!cancelled) {
            setUser(me);
          }
        } catch {
          await client.refreshAccessToken();
          const me = await client.me();
          if (!cancelled) {
            setUser(me);
          }
        }
      } catch {
        await storage.clear();
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
  }, [client, storage]);

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

  const register = useCallback(
    async (payload: RegisterRequest) => {
      setError(null);
      try {
        const response = await client.register(payload);
        setUser(response.user);
      } catch (err) {
        setError(humanizeAuthFailure(err, "Inscription impossible."));
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
