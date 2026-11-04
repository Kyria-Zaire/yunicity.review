"use client";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  TRIBES_DESKTOP_CARD_JOIN,
  TRIBES_DESKTOP_CARD_REQUEST,
  TRIBES_DESKTOP_CARD_VIEW,
  TRIBES_DESKTOP_SPOTLIGHT_JOIN,
} from "@yunicity/utils";
import Link from "next/link";
import { useState } from "react";

type TribesDesktopJoinButtonProps = {
  city: string;
  slug: string;
  variant?: "primary" | "outline";
  viewerIsMember: boolean;
  isPrivateInvite: boolean;
  viewerHasPendingJoinRequest: boolean;
  onSuccess?: () => void;
};

export function TribesDesktopJoinButton({
  city,
  slug,
  variant = "outline",
  viewerIsMember,
  isPrivateInvite,
  viewerHasPendingJoinRequest,
  onSuccess,
}: TribesDesktopJoinButtonProps) {
  const api = useYunicityApi();
  const { isAuthenticated } = useAuth();
  const [pending, setPending] = useState(false);
  const [requested, setRequested] = useState(viewerHasPendingJoinRequest);
  const [joined, setJoined] = useState(viewerIsMember);
  const [error, setError] = useState<string | null>(null);

  const href = `/tribes/${encodeURIComponent(slug)}?city=${encodeURIComponent(city)}`;

  if (joined || viewerIsMember) {
    return (
      <Link
        href={href}
        className={
          variant === "primary"
            ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover sm:w-auto"
            : "inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-neutral-200 px-4 text-xs font-semibold text-neutral-800 transition hover:border-neutral-300"
        }
      >
        {TRIBES_DESKTOP_CARD_VIEW}
      </Link>
    );
  }

  if (requested || viewerHasPendingJoinRequest) {
    return (
      <span className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-neutral-200 px-4 text-xs font-medium text-neutral-600 sm:w-auto">
        Demande en attente
      </span>
    );
  }

  if (isPrivateInvite) {
    return (
      <Link
        href={href}
        className={
          variant === "primary"
            ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover sm:w-auto"
            : "inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-xs font-semibold text-white transition hover:bg-yunicity-primary-hover"
        }
      >
        {variant === "primary" ? TRIBES_DESKTOP_SPOTLIGHT_JOIN : TRIBES_DESKTOP_CARD_REQUEST}
      </Link>
    );
  }

  async function handleJoin() {
    if (!isAuthenticated) return;
    setPending(true);
    setError(null);
    try {
      await api.tribes.joinTribe(slug, city, { charter_accepted: true });
      setJoined(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de rejoindre pour le moment.");
    } finally {
      setPending(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(href)}`}
        className={
          variant === "primary"
            ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover sm:w-auto"
            : "inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-xs font-semibold text-white transition hover:bg-yunicity-primary-hover"
        }
      >
        {variant === "primary" ? TRIBES_DESKTOP_SPOTLIGHT_JOIN : TRIBES_DESKTOP_CARD_JOIN}
      </Link>
    );
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        disabled={pending}
        onClick={() => void handleJoin()}
        className={
          variant === "primary"
            ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60 sm:w-auto"
            : "inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-xs font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
        }
      >
        {pending ? "…" : variant === "primary" ? TRIBES_DESKTOP_SPOTLIGHT_JOIN : TRIBES_DESKTOP_CARD_JOIN}
      </button>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
