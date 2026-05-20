"use client";

import { WebAppShell } from "@/components/layout";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import { TRIBE_CHARTER_LABEL, TRIBE_JOIN_CTA } from "@yunicity/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { yunicityBtnPrimary } from "@/lib/brand-classes";

export function TribeInvitationScreen({ token }: { token: string }) {
  const api = useYunicityApi();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [charterAccepted, setCharterAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!charterAccepted) {
      setError("Acceptez la charte pour continuer.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.tribes.acceptTribeInvitation(token, { charter_accepted: true });
      const city = user?.city ?? "Reims";
      router.push(`/tribes?city=${encodeURIComponent(city)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invitation invalide ou expirée.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <WebAppShell contentWidth="form">
      <h1 className="text-xl font-bold text-neutral-900">Invitation tribu</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Vous avez reçu un lien personnel pour rejoindre une tribu à {user?.city ?? "Reims"}.
      </p>
      {!isAuthenticated ? (
        <p className="mt-4 text-sm">
          <Link href="/login" className="font-medium text-yunicity-primary hover:underline">
            Connectez-vous
          </Link>{" "}
          pour accepter l’invitation.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={charterAccepted}
              onChange={(event) => setCharterAccepted(event.target.checked)}
              className="mt-1"
            />
            <span>{TRIBE_CHARTER_LABEL}</span>
          </label>
          <button
            type="button"
            disabled={loading || !charterAccepted}
            onClick={() => void accept()}
            className={yunicityBtnPrimary}
          >
            {TRIBE_JOIN_CTA}
          </button>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      )}
      <Link href="/tribes" className="mt-8 inline-block text-sm text-yunicity-primary hover:underline">
        Voir les tribus ouvertes
      </Link>
    </WebAppShell>
  );
}
