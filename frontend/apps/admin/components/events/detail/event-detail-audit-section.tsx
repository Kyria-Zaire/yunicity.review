"use client";

import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import type { AdminLocalEventActionItem } from "@yunicity/types";
import {
  eventAdminActionLabel,
  formatEventAdminActionStatusTransition,
  formatEventDate,
} from "@yunicity/utils";

interface EventDetailAuditSectionProps {
  items: AdminLocalEventActionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

function actorLabel(item: AdminLocalEventActionItem): string {
  const actor = item.actor_user;
  if (actor.display_name?.trim()) {
    return actor.display_name;
  }
  return actor.email;
}

export function EventDetailAuditSection({
  items,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  error,
  onRetry,
  onPageChange,
}: EventDetailAuditSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Historique staff
      </h2>

      {isLoading ? (
        <p className="text-sm text-stone-500">Chargement de l&apos;historique staff…</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button type="button" onClick={() => void onRetry()} className="ml-3 font-medium underline">
            Réessayer
          </button>
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-stone-900">Aucune action staff enregistrée.</p>
          <p className="mt-2 text-sm text-stone-500">
            Les approbations et refus apparaîtront ici après modération.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Transition</th>
                    <th className="px-4 py-3 font-medium">Motif</th>
                    <th className="px-4 py-3 font-medium">Acteur</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-medium text-stone-900">
                        {eventAdminActionLabel(item.action)}
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {formatEventAdminActionStatusTransition(
                          item.previous_status,
                          item.new_status,
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-700">{item.reason ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-700">
                        <div className="flex flex-col gap-0.5">
                          <span>{actorLabel(item)}</span>
                          {item.actor_user.display_name?.trim() ? (
                            <span className="text-xs text-stone-500">{item.actor_user.email}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {formatEventDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PassportOpsPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={onPageChange}
          />
        </>
      ) : null}
    </section>
  );
}
