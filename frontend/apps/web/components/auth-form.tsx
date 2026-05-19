"use client";

import type { FormEvent } from "react";
import { useState } from "react";

interface AuthFormProps {
  mode: "login" | "register";
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (values: {
    email: string;
    password: string;
    full_name?: string;
    city?: string;
  }) => Promise<void>;
  alternateHref: string;
  alternateLabel: string;
}

export function AuthForm({
  mode,
  error,
  isSubmitting,
  onSubmit,
  alternateHref,
  alternateLabel,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({
      email,
      password,
      full_name: mode === "register" ? fullName : undefined,
      city: mode === "register" ? city || undefined : undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <header>
        <h1 className="text-2xl font-semibold">
          {mode === "login" ? "Connexion" : "Inscription"}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">Yunicity — accès citoyen</p>
      </header>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {mode === "register" ? (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Nom complet
            <input
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Ville (optionnel)
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2"
            />
          </label>
        </>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Mot de passe
        <input
          required
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "En cours…" : mode === "login" ? "Se connecter" : "Créer un compte"}
      </button>

      <a href={alternateHref} className="text-center text-sm text-yunicity-primary hover:underline">
        {alternateLabel}
      </a>
    </form>
  );
}
