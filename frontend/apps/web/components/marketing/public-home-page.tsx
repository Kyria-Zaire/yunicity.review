"use client";

import { YunicityBrandLoader } from "@/components/brand";
import { PublicHomeLanding } from "@/components/marketing/public-home-landing";
import { useAuth } from "@/lib/auth/auth-provider";
import { DEFAULT_AUTH_REDIRECT } from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SESSION_LOADER_MESSAGE = "Chargement de la session…";

export function PublicHomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(DEFAULT_AUTH_REDIRECT);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <YunicityBrandLoader message={SESSION_LOADER_MESSAGE} />;
  }

  return <PublicHomeLanding />;
}
