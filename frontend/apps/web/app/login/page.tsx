"use client";

import { LoginScreen } from "@/components/login/login-screen";
import { YunicityBrandLoader } from "@/components/brand";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/feed");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <YunicityBrandLoader />;
  }

  if (isAuthenticated) {
    return null;
  }

  return <LoginScreen />;
}
