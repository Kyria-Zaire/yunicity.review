"use client";

import type { Tribe } from "@yunicity/types";
import Link from "next/link";

import { WebContextPanel } from "@/components/layout/web-context-panel";
import { tribeInitials } from "@/lib/feed/feed-right-rail-modules";

/**
 * D1.2 — « Vos tribus », derive de `portal.tribes` (aucune requete).
 *
 * Le contrat `Tribe` n'expose aucune activite recente : aucune n'est affichee.
 * Le compte de membres provient de `active_member_count`, jamais substitue.
 */
export function FeedMemberTribes({ tribes }: { tribes: Tribe[] }) {
  if (tribes.length === 0) return null;

  return (
    <WebContextPanel
      title="Vos tribus"
      action={
        <Link
          href="/tribes"
          className="rounded text-xs font-semibold text-yunicity-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          Tout voir
        </Link>
      }
    >
      <ul data-feed-right-rail-module="tribes" className="space-y-3">
        {tribes.map((tribe) => (
          <li key={tribe.id}>
            <Link
              href={`/tribes/${tribe.slug}`}
              className="flex items-center gap-3 rounded-xl p-1 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
            >
              {tribe.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- source distante non whitelistee
                <img
                  src={tribe.cover_image_url}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-xs font-semibold text-yunicity-primary"
                >
                  {tribeInitials(tribe.name)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900">
                  {tribe.name}
                </span>
                <span className="block text-xs text-neutral-500">
                  {tribe.active_member_count} membre{tribe.active_member_count > 1 ? "s" : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </WebContextPanel>
  );
}
