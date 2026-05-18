"use client";

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
    return (
      <p className="px-6 py-16 text-center text-sm text-neutral-600" role="status">
        Chargement de la session…
      </p>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
