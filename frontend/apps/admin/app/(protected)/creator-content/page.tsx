"use client";

import { CreatorContentStatusBadge } from "@/components/creator-content-status-badge";
import { useAdminCreatorContentList } from "@/lib/hooks/use-admin-creator-content";
import { formatDate } from "@/lib/format";
import type { PartnerCreatorContentStatus } from "@yunicity/types";
import {
  ADMIN_CREATOR_CONTENT_STATUS_FILTER_OPTIONS,
  adminCreatorContentAuthorLabel,
  adminCreatorContentExcerpt,
  type AdminCreatorContentSort,
  type AdminCreatorContentStatusFilter,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function CreatorContentModerationPage() {
  const [statusFilter, setStatusFilter] =
    useState<AdminCreatorContentStatusFilter>("pending_review");
  const [sort, setSort] = useState<AdminCreatorContentSort>("newest");
  const [search, setSearch] = useState("");

  const listParams = useMemo(
    () => ({
      status: statusFilter || undefined,
      sort,
      page: 1,
      page_size: 100,
    }),
    [statusFilter, sort],
  );

  const { items, total, isLoading, error, reload } = useAdminCreatorContentList(listParams);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.organization.name.toLowerCase().includes(q) ||
        adminCreatorContentAuthorLabel(item.author).toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contenus créateurs partenaires</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            File de modération — {total} contenu{total > 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            placeholder="Rechercher titre, organisation ou auteur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm lg:col-span-2"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AdminCreatorContentStatusFilter)
            }
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {ADMIN_CREATOR_CONTENT_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as AdminCreatorContentSort)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="newest">Plus récent</option>
            <option value="oldest">Plus ancien</option>
          </select>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted sm:col-span-2 lg:col-span-1"
          >
            Actualiser
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aucun contenu pour ce filtre.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Titre</th>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Auteur</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créé le</th>
                <th className="px-4 py-3 font-medium">Soumis le</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/creator-content/${item.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {adminCreatorContentExcerpt(item.body, 80)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.organization.name}
                    <span className="block text-xs">{item.organization.city}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {adminCreatorContentAuthorLabel(item.author)}
                  </td>
                  <td className="px-4 py-3">
                    <CreatorContentStatusBadge status={item.status as PartnerCreatorContentStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {item.submitted_at ? formatDate(item.submitted_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
