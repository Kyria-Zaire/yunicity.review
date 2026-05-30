"use client";

import { YunicityBrandLoader } from "@/components/brand";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <YunicityBrandLoader message="Chargement de la session…" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
