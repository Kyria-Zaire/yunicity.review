"use client";

import { isStaffUser } from "@/lib/auth/staff-permissions";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function StaffRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const allowed = isStaffUser(user);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !allowed) {
      router.replace("/unauthorized");
    }
  }, [allowed, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Chargement de la session…</p>;
  }

  if (!isAuthenticated || !allowed) {
    return null;
  }

  return <>{children}</>;
}
