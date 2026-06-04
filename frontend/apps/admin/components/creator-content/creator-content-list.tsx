"use client";

import { CreatorContentStatusBadge } from "@/components/creator-content-status-badge";
import { formatDateTime } from "@/lib/format";
import type { AdminCreatorContentListState } from "@/lib/creator-content-url";
import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import {
  adminCreatorContentAuthorLabel,
  adminCreatorContentExcerpt,
  buildCreatorContentDetailPathWithListContext,
} from "@yunicity/utils";
import Link from "next/link";

interface CreatorContentListProps {
  items: PartnerCreatorContentAdmin[];
  listSearchQuery: URLSearchParams;
  state: AdminCreatorContentListState;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function emptyMessage(state: AdminCreatorContentListState): { title: string; body: string } {
  if (state.organizationId) {
    return {
      title: "Aucun contenu pour cette organisation",
      body: "Changez le statut ou sélectionnez une autre organisation.",
    };
  }
  if (state.status) {
    return {
      title: "Aucun contenu pour ce statut",
      body: "Ajustez le filtre statut ou consultez tous les contenus.",
    };
  }
  return {
    title: "Aucun contenu créateur",
    body: "La file est vide pour le moment.",
  };
}

export function CreatorContentList({
  items,
  listSearchQuery,
  state,
  isLoading,
  error,
  onRetry,
}: CreatorContentListProps) {
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
    const copy = emptyMessage(state);
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-stone-900">{copy.title}</p>
        <p className="mt-2 text-sm text-stone-500">{copy.body}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Titre</th>
              <th className="px-4 py-3 font-medium">Organisation</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Auteur</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              <th className="px-4 py-3 font-medium">Mis à jour</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => (
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
                <td className="px-4 py-3">
                  <CreatorContentStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {adminCreatorContentAuthorLabel(item.author)}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {formatDateTime(item.created_at)}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {formatDateTime(item.updated_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={buildCreatorContentDetailPathWithListContext(item.id, listSearchQuery)}
                    className="text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
                  >
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
