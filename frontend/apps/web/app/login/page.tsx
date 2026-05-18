"use client";

import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { login, error, clearError, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/profile/me");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <AuthForm
        mode="login"
        error={error}
        isSubmitting={isSubmitting}
        alternateHref="/register"
        alternateLabel="Créer un compte"
        onSubmit={async (values) => {
          clearError();
          setIsSubmitting(true);
          try {
            await login({ email: values.email, password: values.password });
            router.replace("/profile/me");
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </main>
  );
}
