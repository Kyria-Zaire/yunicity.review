import { useAuth } from "@/lib/auth-provider";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/** Onglet Fil — surface principale post-auth (Sprint 4.5). */
const AUTHENTICATED_HOME = "/(protected)/(tabs)/feed" as Href;

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
