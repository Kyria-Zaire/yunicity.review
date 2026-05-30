"use client";

import { PassportAppShell } from "@/components/passport/passport-app-shell";
import type { PassportStampClaimResult } from "@yunicity/types";
import {
  PASSPORT_STAMP_CLAIM_ALREADY_CLAIMED_BODY,
  PASSPORT_STAMP_CLAIM_CTA_PARTNER,
  PASSPORT_STAMP_CLAIM_CTA_PASSPORT,
  PASSPORT_STAMP_CLAIM_ERROR_BODY,
  PASSPORT_STAMP_CLAIM_EXPIRED_BODY,
  PASSPORT_STAMP_CLAIM_INVALID_BODY,
  PASSPORT_STAMP_CLAIM_LOADING,
  PASSPORT_STAMP_CLAIM_PARTNER_INACTIVE_BODY,
  PASSPORT_STAMP_CLAIM_SUCCESS_BODY,
  PASSPORT_STAMP_CLAIM_SUCCESS_TITLE,
  partnerPublicHref,
} from "@yunicity/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

type ClaimState =
  | { kind: "loading" }
  | { kind: "success"; result: PassportStampClaimResult }
  | { kind: "already_claimed"; result: PassportStampClaimResult }
  | { kind: "expired" }
  | { kind: "invalid" }
  | { kind: "partner_inactive" }
  | { kind: "error"; message: string };

function resolveClaimState(error: unknown): ClaimState {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("STAMP_TOKEN_EXPIRED")) return { kind: "expired" };
    if (msg.includes("STAMP_TOKEN_INVALID")) return { kind: "invalid" };
    if (msg.includes("PARTNER_NOT_ACTIVE")) return { kind: "partner_inactive" };
    return { kind: "error", message: msg };
  }
  return { kind: "error", message: "Erreur inattendue." };
}

function PassportStampClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const api = useYunicityApi();
  const [claimState, setClaimState] = useState<ClaimState>({ kind: "loading" });

  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const redirect = encodeURIComponent(`/passport/stamp/claim?token=${token}`);
      router.push(`/login?redirect=${redirect}`);
      return;
    }
    if (!token) {
      setClaimState({ kind: "invalid" });
      return;
    }

    let cancelled = false;
    void api.claimPassportStamp(token).then((result) => {
      if (cancelled) return;
      if (result.already_claimed) {
        setClaimState({ kind: "already_claimed", result });
      } else {
        setClaimState({ kind: "success", result });
      }
    }).catch((err: unknown) => {
      if (cancelled) return;
      setClaimState(resolveClaimState(err));
    });
    return () => { cancelled = true; };
  }, [authLoading, user, token, api, router]);

  return (
    <div className="mx-auto max-w-md space-y-8 px-4 py-12">
      {claimState.kind === "loading" ? (
        <div className="rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
          <p className="text-center text-sm text-neutral-500" role="status">
            {PASSPORT_STAMP_CLAIM_LOADING}
          </p>
        </div>
      ) : claimState.kind === "success" ? (
        <div className="rounded-3xl border border-yunicity-primary/20 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">Passport</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">{PASSPORT_STAMP_CLAIM_SUCCESS_TITLE}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {PASSPORT_STAMP_CLAIM_SUCCESS_BODY.replace("{partner}", claimState.result.stamp.organization.name)}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/passport"
              className="flex items-center justify-center rounded-2xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              {PASSPORT_STAMP_CLAIM_CTA_PASSPORT}
            </Link>
            <Link
              href={partnerPublicHref({ slug: claimState.result.stamp.organization.slug, city: claimState.result.stamp.organization.city })}
              className="flex items-center justify-center rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:border-yunicity-primary/30"
            >
              {PASSPORT_STAMP_CLAIM_CTA_PARTNER}
            </Link>
          </div>
        </div>
      ) : claimState.kind === "already_claimed" ? (
        <div className="rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Passport</p>
          <h1 className="mt-2 text-xl font-bold text-neutral-900">{PASSPORT_STAMP_CLAIM_ALREADY_CLAIMED_BODY}</h1>
          <div className="mt-6">
            <Link
              href="/passport"
              className="flex items-center justify-center rounded-2xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              {PASSPORT_STAMP_CLAIM_CTA_PASSPORT}
            </Link>
          </div>
        </div>
      ) : claimState.kind === "expired" ? (
        <MessageCard title={PASSPORT_STAMP_CLAIM_EXPIRED_BODY} />
      ) : claimState.kind === "invalid" ? (
        <MessageCard title={PASSPORT_STAMP_CLAIM_INVALID_BODY} />
      ) : claimState.kind === "partner_inactive" ? (
        <MessageCard title={PASSPORT_STAMP_CLAIM_PARTNER_INACTIVE_BODY} />
      ) : (
        <MessageCard title={PASSPORT_STAMP_CLAIM_ERROR_BODY} />
      )}
    </div>
  );
}

export default function PassportStampClaimPage() {
  return (
    <PassportAppShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-md px-4 py-12">
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
              <p className="text-center text-sm text-neutral-500" role="status">
                {PASSPORT_STAMP_CLAIM_LOADING}
              </p>
            </div>
          </div>
        }
      >
        <PassportStampClaimContent />
      </Suspense>
    </PassportAppShell>
  );
}

function MessageCard({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
      <p className="text-center text-sm font-medium text-neutral-700">{title}</p>
      <div className="mt-6">
        <Link
          href="/passport"
          className="flex items-center justify-center rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700"
        >
          Mon Passport
        </Link>
      </div>
    </div>
  );
}
