"use client";

import { YunicityLogo } from "@/components/brand";
import {
  LOGIN_FIELD_EMAIL,
  LOGIN_FIELD_EMAIL_PLACEHOLDER,
  LOGIN_FIELD_PASSWORD,
  LOGIN_FIELD_PASSWORD_PLACEHOLDER,
  LOGIN_FORGOT_PASSWORD,
  LOGIN_NO_ACCOUNT,
  LOGIN_PAGE_SUBTITLE,
  LOGIN_PAGE_TITLE,
  LOGIN_REGISTER_LINK,
  LOGIN_SUBMIT,
  LOGIN_SUBMITTING,
} from "@yunicity/utils";
import { Eye, EyeOff, Lock, UserRound } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type LoginFormPanelProps = {
  error: string | null;
  validationMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
};

export function LoginFormPanel({
  error,
  validationMessage,
  isSubmitting,
  onSubmit,
}: LoginFormPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ email, password });
  }

  return (
    <div className="flex flex-col justify-center bg-white p-8 sm:p-10 lg:p-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex justify-center">
            <YunicityLogo size="xl" priority />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {LOGIN_PAGE_TITLE}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{LOGIN_PAGE_SUBTITLE}</p>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {validationMessage ? (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {validationMessage}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-800">
              {LOGIN_FIELD_EMAIL}
            </span>
            <span className="relative block">
              <UserRound
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={LOGIN_FIELD_EMAIL_PLACEHOLDER}
                className="w-full rounded-xl border border-neutral-300 py-2.5 pl-10 pr-3 text-neutral-900 outline-none transition focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-800">
              {LOGIN_FIELD_PASSWORD}
            </span>
            <span className="relative block">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={LOGIN_FIELD_PASSWORD_PLACEHOLDER}
                className="w-full rounded-xl border border-neutral-300 py-2.5 pl-10 pr-10 text-neutral-900 outline-none transition focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-600"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </span>
          </label>

          <div className="flex justify-end">
            <Link
              href="/login/forgot-password"
              className="text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {LOGIN_FORGOT_PASSWORD}
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-yunicity-primary py-3 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? LOGIN_SUBMITTING : LOGIN_SUBMIT}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {LOGIN_NO_ACCOUNT}{" "}
          <Link href="/register" className="font-semibold text-yunicity-primary hover:underline">
            {LOGIN_REGISTER_LINK}
          </Link>
        </p>
      </div>
    </div>
  );
}
