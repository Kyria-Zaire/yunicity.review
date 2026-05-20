"use client";

import type { Tribe } from "@yunicity/types";
import { TRIBE_MEMBERS_EMPTY, TRIBE_MEMBERS_TITLE, TRIBE_ROLE_LABELS } from "@yunicity/utils";

import {
  canManageTribe,
  canModerateTribe,
  useTribeMembers,
} from "@/hooks/use-tribe-members";
import { useAuth } from "@/lib/auth/auth-provider";

function memberLabel(userId: string, currentUserId: string | undefined): string {
  if (currentUserId && userId === currentUserId) {
    return "Vous";
  }
  return `Participant · ${userId.slice(0, 8)}`;
}

export function TribeMembersSection({ tribe, city }: { tribe: Tribe; city: string }) {
  const { user } = useAuth();
  const enabled = tribe.viewer_is_member && !tribe.is_archived;
  const { items, loading, error, removeMember, setModerator } = useTribeMembers(
    tribe.slug,
    city,
    enabled,
  );
  const canModerate = canModerateTribe(tribe.viewer_role);
  const isOwner = canManageTribe(tribe.viewer_role);

  if (!enabled) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-neutral-900">{TRIBE_MEMBERS_TITLE}</h2>
      {loading ? <p className="mt-2 text-sm text-neutral-500">Chargement…</p> : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      {!loading && items.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">{TRIBE_MEMBERS_EMPTY}</p>
      ) : null}
      <ul className="mt-4 space-y-2">
        {items.map((member) => (
          <li
            key={member.user_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-yunicity-surface text-sm font-medium text-yunicity-primary"
                aria-hidden
              >
                {(TRIBE_ROLE_LABELS[member.role] ?? "M")[0]}
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {memberLabel(member.user_id, user?.id)}
                </p>
                <p className="text-xs text-neutral-500">
                  {TRIBE_ROLE_LABELS[member.role] ?? member.role}
                </p>
              </div>
            </div>
            {canModerate && member.role !== "owner" && member.user_id !== user?.id ? (
              <div className="flex flex-wrap gap-2">
                {isOwner && member.role === "member" ? (
                  <button
                    type="button"
                    onClick={() => void setModerator(member.user_id, "moderator")}
                    className="text-xs text-yunicity-primary hover:underline"
                  >
                    Nommer modérateur
                  </button>
                ) : null}
                {isOwner && member.role === "moderator" ? (
                  <button
                    type="button"
                    onClick={() => void setModerator(member.user_id, "member")}
                    className="text-xs text-neutral-600 hover:underline"
                  >
                    Retirer modération
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void removeMember(member.user_id)}
                  className="text-xs text-neutral-500 hover:text-red-700"
                >
                  Exclure
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
