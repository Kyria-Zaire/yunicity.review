"use client";

import { CreatorContentRejectDialog } from "@/components/creator-content/creator-content-reject-dialog";
import { CreatorContentStatusBadge } from "@/components/creator-content-status-badge";
import { formatDateTime } from "@/lib/format";
import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import {
  ADMIN_CREATOR_CONTENT_TYPE_LABEL,
  adminCreatorContentExcerpt,
  buildCreatorContentDetailPathWithListContext,
  canAdminApproveCreatorContent,
  canAdminRejectCreatorContent,
  formatCreatorContentPublishedAt,
} from "@yunicity/utils";
import { Check, Eye, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface CreatorContentListProps {
  items: PartnerCreatorContentAdmin[];
  listSearchQuery: URLSearchParams;
  isLoading: boolean;
  error: string | null;
  actionError: string | null;
  moderatingContentId: string | null;
  hasActiveFilters: boolean;
  editorialIsEmpty: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
  onApprove: (contentId: string) => void;
  onReject: (contentId: string, reason: string) => void;
}

function decisionLabel(item: PartnerCreatorContentAdmin): string {
  if (item.status === "published") {
    return formatCreatorContentPublishedAt(item);
  }
  if (item.status === "rejected" && item.rejection_reason) {
    return item.rejection_reason;
  }
  return "—";
}

export function CreatorContentList({
  items,
  listSearchQuery,
  isLoading,
  error,
  actionError,
  moderatingContentId,
  hasActiveFilters,
  editorialIsEmpty,
  onRetry,
  onResetFilters,
  onApprove,
  onReject,
}: CreatorContentListProps) {
  const [rejectTarget, setRejectTarget] = useState<PartnerCreatorContentAdmin | null>(null);

  if (isLoading) {
    return <p className="text-sm text-stone-500">Chargement des contenus créateurs…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {error}
        <button type="button" onClick={() => void onRetry()} className="ml-3 font-medium underline">
          Réessayer
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    if (!hasActiveFilters && editorialIsEmpty) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-stone-900">
            La file éditoriale est prête à accueillir ses premiers contenus.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Les articles, récits et contenus partenaires apparaîtront ici dès leur soumission.
          </p>
          <Link
            href="/partners"
            className="mt-6 inline-flex rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            Voir les partenaires
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-medium text-stone-900">
          Aucun contenu ne correspond à ces critères.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Modifiez les filtres ou revenez à l&apos;ensemble de la file éditoriale.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 inline-flex rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }

  return (
    <>
      {actionError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Contenu</th>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Soumission</th>
                <th className="px-4 py-3 font-medium">Décision</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item) => {
                const isModerating = moderatingContentId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">{item.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-stone-500">
                        {adminCreatorContentExcerpt(item.body, 80)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-stone-700">
                      {item.organization.name}
                      <span className="block text-xs text-stone-500">{item.organization.city}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">
                      {ADMIN_CREATOR_CONTENT_TYPE_LABEL}
                    </td>
                    <td className="px-4 py-3">
                      <CreatorContentStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {formatDateTime(item.submitted_at ?? item.created_at)}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-xs text-stone-500">
                      {decisionLabel(item)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={buildCreatorContentDetailPathWithListContext(
                            item.id,
                            listSearchQuery,
                          )}
                          className="inline-flex items-center gap-1 text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Ouvrir
                        </Link>
                        {canAdminApproveCreatorContent(item.status) ? (
                          <button
                            type="button"
                            disabled={isModerating}
                            onClick={() => onApprove(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden />
                            Approuver
                          </button>
                        ) : null}
                        {canAdminRejectCreatorContent(item.status) ? (
                          <button
                            type="button"
                            disabled={isModerating}
                            onClick={() => setRejectTarget(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                            Rejeter
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreatorContentRejectDialog
        contentTitle={rejectTarget?.title ?? ""}
        isOpen={rejectTarget !== null}
        isSubmitting={moderatingContentId === rejectTarget?.id}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) {
            onReject(rejectTarget.id, reason);
            setRejectTarget(null);
          }
        }}
      />
    </>
  );
}
