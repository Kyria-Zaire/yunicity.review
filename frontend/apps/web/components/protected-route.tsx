"use client";

import { YunicityBrandLoader } from "@/components/brand";
import { useAuth } from "@/lib/auth/auth-provider";
import { buildCurrentAppPath, buildLoginUrlWithNext } from "@yunicity/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const SESSION_LOADER_MESSAGE = "Chargement de la session…";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <ProtectedRouteInner>{children}</ProtectedRouteInner>;
}

function ProtectedRouteInner({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isLoading || isAuthenticated) {
      return;
    }
    const search = window.location.search.startsWith("?")
      ? window.location.search.slice(1)
      : window.location.search;
    const returnPath = buildCurrentAppPath(pathname, search);
    router.replace(buildLoginUrlWithNext(returnPath));
  }, [isAuthenticated, isLoading, isClient, pathname, router]);

  if (!isClient || isLoading) {
    return <YunicityBrandLoader message={SESSION_LOADER_MESSAGE} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
