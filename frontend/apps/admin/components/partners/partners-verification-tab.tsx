"use client";

import { OrganizationReviewRejectDialog } from "@/components/partners/organization-review-reject-dialog";
import { VerificationBadge } from "@/components/verification-badge";
import { useAdminOrganizationsList } from "@/lib/hooks/use-admin-organizations-list";
import type { AdminOrganizationListItem, VerificationStatus } from "@yunicity/types";
import {
  ADMIN_ORGANIZATION_STATUS_FILTER_OPTIONS,
  ORGANIZATION_REVIEW_ACTION_LABELS,
  ORGANIZATION_TYPE_OPTIONS,
  ORGANIZATION_VISIBILITY_LABELS,
  adminPartnerDetailPath,
  allowedOrganizationReviewActions,
  isAuthError,
  partnerStatusLabel,
  type OrganizationReviewAction,
} from "@yunicity/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CITY = "Reims";
const PAGE_SIZE = 20;

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function organizationTypeLabel(type: AdminOrganizationListItem["type"]): string {
  return ORGANIZATION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function actionButtonClass(action: OrganizationReviewAction): string {
  const base =
    "rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset disabled:cursor-not-allowed disabled:opacity-50";
  switch (action) {
    case "verified":
      return `${base} bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100`;
    case "rejected":
      return `${base} bg-rose-50 text-rose-800 ring-rose-200 hover:bg-rose-100`;
    case "suspended":
      return `${base} bg-stone-100 text-stone-700 ring-stone-200 hover:bg-stone-200`;
    default:
      return `${base} bg-white text-stone-800 ring-stone-200 hover:bg-stone-50`;
  }
}

export function PartnersVerificationTab() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("organization_id");
  const { organizationApi } = useAuth();

  const [statusFilter, setStatusFilter] = useState<"" | VerificationStatus>(() =>
    highlightId ? "" : "pending",
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminOrganizationListItem | null>(null);
  const [page, setPage] = useState(1);

  const listParams = useMemo(
    () => ({
      city: DEFAULT_CITY,
      verification_status: statusFilter || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    [statusFilter, page],
  );

  const { items, total, isLoading, error, reload, pageSize } =
    useAdminOrganizationsList(listParams);

  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!highlightId || isLoading) {
      return;
    }
    const row = highlightRef.current;
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, isLoading, items]);

  useEffect(() => {
    if (!actionSuccess) {
      return;
    }
    const timer = window.setTimeout(() => setActionSuccess(null), 4000);
    return () => window.clearTimeout(timer);
  }, [actionSuccess]);

  const runReview = useCallback(
    async (
      org: AdminOrganizationListItem,
      decision: OrganizationReviewAction,
      reason?: string,
    ) => {
      setSubmittingId(org.id);
      setActionError(null);
      setActionSuccess(null);
      try {
        await organizationApi.reviewOrganization(org.id, {
          decision,
          method: "manual",
          reason: reason ?? null,
        });
        setActionSuccess(`${org.name} — ${ORGANIZATION_REVIEW_ACTION_LABELS[decision]}`);
        setRejectTarget(null);
        await reload();
      } catch (err) {
        setActionError(
          isAuthError(err)
            ? err.message
            : "Action de vérification impossible pour le moment.",
        );
      } finally {
        setSubmittingId(null);
      }
    },
    [organizationApi, reload],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
        <p className="font-medium text-stone-900">File de vérification organisations</p>
        <p className="mt-1">
          Données : <code className="text-xs">GET /api/v1/admin/organizations</code> — actions :{" "}
          <code className="text-xs">POST /api/v1/organizations/&#123;id&#125;/review</code>
        </p>
        <p className="mt-1 text-xs text-stone-500">
          La vérification ne rend pas l&apos;organisation publique automatiquement.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="font-medium text-stone-700">Statut</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "" | VerificationStatus);
              setPage(1);
            }}
            className="mt-1 block rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
          >
            {ADMIN_ORGANIZATION_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-stone-600">
          {total} organisation{total > 1 ? "s" : ""} — {DEFAULT_CITY}
        </p>
      </div>

      {actionSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionSuccess}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-stone-500">Chargement des organisations…</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button
            type="button"
            onClick={() => void reload()}
            className="ml-3 font-medium underline"
          >
            Réessayer
          </button>
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-stone-900">Aucune organisation dans ce filtre.</p>
          <p className="mt-2 text-sm text-stone-500">
            Essayez « En attente » ou « En revue » pour la file active.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Organisation</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Ville</th>
                  <th className="px-4 py-3 font-medium">Visibilité</th>
                  <th className="px-4 py-3 font-medium">Vérification</th>
                  <th className="px-4 py-3 font-medium">Partenaire</th>
                  <th className="px-4 py-3 font-medium">MAJ</th>
                  <th className="px-4 py-3 font-medium">Fiche</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((org) => {
                  const isHighlighted = highlightId === org.id;
                  const actions = allowedOrganizationReviewActions(org.verification_status);
                  const busy = submittingId === org.id;
                  return (
                    <tr
                      key={org.id}
                      ref={isHighlighted ? highlightRef : undefined}
                      className={
                        isHighlighted
                          ? "bg-violet-50/80 ring-2 ring-inset ring-violet-300"
                          : "hover:bg-stone-50/80"
                      }
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-900">{org.name}</p>
                        <p className="font-mono text-xs text-stone-500">{org.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {organizationTypeLabel(org.type)}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{org.city}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {ORGANIZATION_VISIBILITY_LABELS[org.visibility] ?? org.visibility}
                      </td>
                      <td className="px-4 py-3">
                        <VerificationBadge status={org.verification_status} />
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {org.partner_status ? partnerStatusLabel(org.partner_status) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {formatDateTime(org.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={adminPartnerDetailPath(org.id)}
                          className="text-sm font-medium text-violet-900 underline-offset-2 hover:underline"
                        >
                          Ouvrir fiche partenaire
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {actions.map((action) => (
                            <button
                              key={action}
                              type="button"
                              disabled={busy}
                              className={actionButtonClass(action)}
                              onClick={() => {
                                if (action === "rejected") {
                                  setRejectTarget(org);
                                  return;
                                }
                                void runReview(org, action);
                              }}
                            >
                              {ORGANIZATION_REVIEW_ACTION_LABELS[action]}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-stone-600">
          <span>
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      ) : null}

      <OrganizationReviewRejectDialog
        organizationName={rejectTarget?.name ?? ""}
        isOpen={rejectTarget !== null}
        isSubmitting={submittingId !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) {
            void runReview(rejectTarget, "rejected", reason);
          }
        }}
      />
    </div>
  );
}
