"use client";

import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const { register, error, clearError, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/feed");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <AuthForm
        mode="register"
        error={error}
        isSubmitting={isSubmitting}
        alternateHref="/login"
        alternateLabel="Déjà un compte ? Se connecter"
        onSubmit={async (values) => {
          clearError();
          setIsSubmitting(true);
          try {
            const ok = await register({
              email: values.email,
              password: values.password,
              full_name: values.full_name ?? "",
              city: values.city ?? null,
            });
            if (ok) {
              router.replace("/feed");
            }
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </main>
  );
}
