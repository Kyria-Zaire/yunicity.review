"use client";

import type { AdminStaffListItem, AdminStaffPlatformRole } from "@yunicity/types";
import {
  buildStaffDetailPath,
  buildStaffListPath,
  formatStaffDate,
  staffRoleFilteredEmptyMessage,
  staffRoleLabel,
  staffStatusLabel,
} from "@yunicity/utils";
import { ArrowUpRight, Users } from "lucide-react";
import Link from "next/link";

interface StaffRosterListProps {
  items: AdminStaffListItem[];
  listSearchQuery: URLSearchParams;
  roleFilter: string;
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  rosterIsEmpty: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
}

const ROLE_BADGE_TONE: Record<AdminStaffPlatformRole, string> = {
  SUPER_ADMIN: "bg-rose-50 text-rose-900 ring-rose-200",
  CITY_ADMIN: "bg-yunicity-primary-soft text-yunicity-primary ring-yunicity-primary/20",
  MODERATOR: "bg-amber-50 text-amber-900 ring-amber-200",
};

function staffInitials(fullName: string, email: string): string {
  const source = fullName.trim() || email.trim();
  if (!source) {
    return "?";
  }
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  const tone =
    role in ROLE_BADGE_TONE
      ? ROLE_BADGE_TONE[role as AdminStaffPlatformRole]
      : "bg-stone-100 text-stone-700 ring-stone-200";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tone}`}
    >
      {staffRoleLabel(role)}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const tone = isActive
    ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
    : "bg-stone-100 text-stone-700 ring-stone-200";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {staffStatusLabel(isActive)}
    </span>
  );
}

export function StaffRosterList({
  items,
  listSearchQuery,
  roleFilter,
  isLoading,
  error,
  hasActiveFilters,
  rosterIsEmpty,
  onRetry,
  onResetFilters,
}: StaffRosterListProps) {
  if (isLoading) {
    return <p className="text-sm text-stone-500">Chargement du roster staff…</p>;
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
    if (!hasActiveFilters && rosterIsEmpty) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yunicity-primary-soft text-yunicity-primary">
            <Users className="h-6 w-6" aria-hidden />
          </span>
          <p className="mt-4 text-lg font-medium text-stone-900">
            Aucun membre staff référencé pour le moment.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Les comptes avec un rôle plateforme apparaîtront ici dès leur première attribution.
          </p>
        </div>
      );
    }

    const emptyMessage = staffRoleFilteredEmptyMessage(roleFilter);

    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-medium text-stone-900">{emptyMessage.title}</p>
        <p className="mt-2 text-sm text-stone-500">{emptyMessage.description}</p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-3" aria-label="Roster staff">
      <div>
        <h2 className="text-sm font-semibold text-stone-900">Roster opérationnel</h2>
        <p className="text-xs text-stone-500">
          {items.length} membre{items.length > 1 ? "s" : ""} sur cette page — ouvrez la fiche pour
          agir.
        </p>
      </div>

      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <article className="group rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50/40">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary"
                    aria-hidden
                  >
                    {staffInitials(item.full_name, item.email)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-stone-950">
                        {item.full_name}
                      </h3>
                      <StatusBadge isActive={item.is_active} />
                    </div>
                    <p className="truncate text-xs text-stone-500">{item.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.roles.length > 0 ? (
                        item.roles.map((role) => <RoleBadge key={role} role={role} />)
                      ) : (
                        <span className="text-xs text-stone-400">Aucun rôle plateforme</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-4 sm:justify-end">
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      Permissions
                    </p>
                    <p className="text-lg font-bold tabular-nums text-stone-900">
                      {item.permissions.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      Depuis
                    </p>
                    <p className="text-xs font-medium text-stone-700">
                      {formatStaffDate(item.created_at)}
                    </p>
                  </div>
                  <Link
                    href={buildStaffDetailPath(item.id, listSearchQuery)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm transition-colors group-hover:border-yunicity-primary/30 group-hover:text-yunicity-primary"
                  >
                    Ouvrir
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-stone-400">
        Besoin du roster complet ?{" "}
        <Link
          href={buildStaffListPath()}
          className="font-medium text-yunicity-primary underline-offset-2 hover:underline"
        >
          Réinitialiser les filtres
        </Link>
      </p>
    </section>
  );
}
