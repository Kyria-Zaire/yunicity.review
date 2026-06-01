"use client";

import { WebAppShell } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { usePartnerPortalContextOptional } from "@/hooks/use-partner-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { OrganizationMeItem, StampQrGenerateResponse } from "@yunicity/types";
import { buildPassportStampClaimUrl, isAuthError } from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** QR tampon Passport — contenu réutilisable dans le portail partenaire (08C) ou en page autonome. */
export function PartnerPassportQrPanel() {
  const portal = usePartnerPortalContextOptional();
  const api = useYunicityApi();
  const [standaloneOrgs, setStandaloneOrgs] = useState<OrganizationMeItem[]>([]);
  const [standaloneSlug, setStandaloneSlug] = useState("");
  const [qrResult, setQrResult] = useState<StampQrGenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(!portal?.organization);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const manageableOrgs = portal?.manageableOrganizations ?? standaloneOrgs;
  const selectedOrg = portal?.organization ??
    manageableOrgs.find((org) => org.slug === standaloneSlug) ??
    manageableOrgs[0];

  useEffect(() => {
    if (portal?.organization) {
      setIsLoadingOrgs(false);
      return;
    }
    if (portal?.isLoading) {
      setIsLoadingOrgs(true);
      return;
    }
    let cancelled = false;
    async function load() {
      setIsLoadingOrgs(true);
      setError(null);
      try {
        const data = await api.listMyOrganizations();
        if (!cancelled) {
          const managers = data.items.filter(
            (org) =>
              (org.member_role === "owner" || org.member_role === "admin") &&
              org.member_status === "active" &&
              org.verification_status === "verified",
          );
          setStandaloneOrgs(managers);
          if (managers[0]) {
            setStandaloneSlug(managers[0].slug);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(isAuthError(err) ? err.message : "Impossible de charger vos lieux.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOrgs(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [api, portal]);

  const generateQr = useCallback(async () => {
    if (!selectedOrg) return;
    setIsGenerating(true);
    setError(null);
    setQrResult(null);
    setCopyHint(null);
    try {
      const result = await api.partnerPassport.generateStampQr(selectedOrg.slug, selectedOrg.city, {
        expires_in_minutes: 1440,
      });
      setQrResult(result);
    } catch (err) {
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de générer le QR. Vérifiez vos droits sur ce lieu.",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [api.partnerPassport, selectedOrg]);

  const claimPath = qrResult?.qr_url ?? "";
  const claimUrl =
    typeof window !== "undefined" && claimPath
      ? `${window.location.origin}${claimPath.startsWith("/") ? claimPath : `/${claimPath}`}`
      : claimPath;

  const qrImageSrc =
    claimUrl.length > 0
      ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(claimUrl)}`
      : null;

  const copyClaimLink = useCallback(async () => {
    if (!claimUrl) return;
    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopyHint("Lien copié dans le presse-papiers.");
    } catch {
      setCopyHint("Copie impossible — sélectionnez le lien manuellement.");
    }
  }, [claimUrl]);

  const body = (
    <>
      {isLoadingOrgs ? (
        <p className="text-sm text-neutral-500">Chargement…</p>
      ) : manageableOrgs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
          Aucun lieu partenaire actif avec droits administrateur. Connectez-vous avec un compte pilote
          partenaire ou demandez l’accès à votre organisation.
        </p>
      ) : (
        <div className="space-y-6 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
          {manageableOrgs.length > 1 && !portal ? (
            <label className="block text-sm">
              <span className="font-semibold text-neutral-900">Lieu</span>
              <select
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                value={selectedOrg?.slug ?? ""}
                onChange={(event) => {
                  setStandaloneSlug(event.target.value);
                  setQrResult(null);
                }}
              >
                {manageableOrgs.map((org) => (
                  <option key={org.id} value={org.slug}>
                    {org.name} · {org.city}
                  </option>
                ))}
              </select>
            </label>
          ) : selectedOrg ? (
            <p className="text-sm text-neutral-700">
              <span className="font-semibold text-neutral-900">{selectedOrg.name}</span>
              <span className="text-neutral-500"> · {selectedOrg.city}</span>
            </p>
          ) : null}

          <p className="text-sm leading-relaxed text-neutral-600">
            Ce QR sert à délivrer un <strong>tampon de visite</strong> sur le Passport citoyen. Ce n’est
            pas un scanner de validation d’offre.
          </p>

          <button
            type="button"
            onClick={() => void generateQr()}
            disabled={!selectedOrg || isGenerating}
            className="w-full rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isGenerating ? "Génération…" : "Générer un QR tampon"}
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {qrResult ? (
            <div className="space-y-4 rounded-xl border border-neutral-100 bg-neutral-50/80 p-4">
              <p className="text-xs text-neutral-500">
                Expire le {formatExpiry(qrResult.expires_at)} (24 h)
              </p>
              {qrImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- QR externe recette, pas d’asset local
                <img
                  src={qrImageSrc}
                  alt="QR code tampon Passport"
                  width={220}
                  height={220}
                  className="mx-auto rounded-lg border border-white bg-white p-2"
                />
              ) : null}
              <p className="break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-neutral-700">
                {claimUrl}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyClaimLink()}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 hover:border-yunicity-primary/30"
                >
                  Copier le lien
                </button>
                <Link
                  href={(() => {
                    const match = /[?&]token=([^&]+)/.exec(claimPath);
                    const token = match?.[1] ? decodeURIComponent(match[1]) : "";
                    return buildPassportStampClaimUrl(token);
                  })()}
                  className="rounded-full bg-yunicity-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  Tester le claim
                </Link>
              </div>
              {copyHint ? <p className="text-xs text-emerald-700">{copyHint}</p> : null}
            </div>
          ) : null}
        </div>
      )}
    </>
  );

  return body;
}

function PartnerPassportQrStandalone() {
  return (
    <WebAppShell
      header={{
        title: "QR tampon Passport",
        subtitle: "Générez un QR à présenter aux citoyens pour collecter un tampon (validité 24 h).",
      }}
      contentWidth="form"
    >
      <div className="mb-6">
        <Link href="/organizations/me" className="text-sm font-semibold text-yunicity-primary hover:underline">
          ← Mes lieux
        </Link>
      </div>
      <PartnerPassportQrPanel />
    </WebAppShell>
  );
}

export function PartnerPassportQrScreen() {
  return (
    <ProtectedRoute>
      <PartnerPassportQrStandalone />
    </ProtectedRoute>
  );
}
