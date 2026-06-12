"use client";

import { LoginScreen } from "@/components/login/login-screen";
import { YunicityBrandLoader } from "@/components/brand";
import { useAuth } from "@/lib/auth/auth-provider";
import { resolveAuthReturnPath } from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<YunicityBrandLoader />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(resolveAuthReturnPath(searchParams.get("next")));
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  if (isLoading) {
    return <YunicityBrandLoader />;
  }

  if (isAuthenticated) {
    return null;
  }

  return <LoginScreen />;
}
