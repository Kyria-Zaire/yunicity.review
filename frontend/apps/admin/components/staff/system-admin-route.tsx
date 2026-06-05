"use client";

import { isSystemAdminUser } from "@/lib/auth/staff-permissions";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function SystemAdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const allowed = isSystemAdminUser(user);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !allowed) {
      router.replace("/unauthorized");
    }
  }, [allowed, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <p className="p-6 text-sm text-stone-500">Chargement de la session…</p>;
  }

  if (!isAuthenticated || !allowed) {
    return null;
  }

  return <>{children}</>;
}
