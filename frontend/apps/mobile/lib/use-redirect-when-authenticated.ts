import { useAuth } from "@/lib/auth-provider";
import { useRouter } from "expo-router";
import { useEffect } from "react";

const AUTHENTICATED_HOME = "/(protected)/(tabs)/profile" as const;

/** Redirect after session is known — never call router from render. */
export function useRedirectWhenAuthenticated(): { showAuthGate: boolean } {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(AUTHENTICATED_HOME);
    }
  }, [isAuthenticated, isLoading, router]);

  return { showAuthGate: isLoading || isAuthenticated };
}
