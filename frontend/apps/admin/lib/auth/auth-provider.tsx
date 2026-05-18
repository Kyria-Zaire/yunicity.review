"use client";

import type { AuthUser, LoginRequest } from "@yunicity/types";
import {
  MemoryTokenStorage,
  createAuthClient,
  getWebApiBaseUrl,
  isAuthError,
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

  const client = useMemo(
    () =>
      createAuthClient({
        apiBaseUrl: getWebApiBaseUrl(),
        platform: "admin",
        storage,
        onSessionCleared: () => setUser(null),
      }),
    [storage],
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
