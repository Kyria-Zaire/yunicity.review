"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { isStaffUser } from "@/lib/auth/staff-permissions";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const { login, error, clearError, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(isStaffUser(user) ? "/partner-leads" : "/unauthorized");
    }
  }, [isAuthenticated, isLoading, user, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold">Admin — Connexion</h1>
        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <label className="block text-sm">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-input px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Mot de passe
          <input
            required
            type="password"
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-input px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
