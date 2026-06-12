"use client";

import { YunicityBrandLoader } from "@/components/brand";
import { useAuth } from "@/lib/auth/auth-provider";
import { buildCurrentAppPath, buildLoginUrlWithNext } from "@yunicity/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<YunicityBrandLoader message="Chargement de la session…" />}>
      <ProtectedRouteInner>{children}</ProtectedRouteInner>
    </Suspense>
  );
}

function ProtectedRouteInner({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnPath = buildCurrentAppPath(pathname, searchParams.toString());
      router.replace(buildLoginUrlWithNext(returnPath));
    }
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  if (isLoading) {
    return <YunicityBrandLoader message="Chargement de la session…" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
