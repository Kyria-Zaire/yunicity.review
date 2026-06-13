"use client";

import { ProfileMemoryCard } from "@/components/profile/profile-memory-card";
import { useProfileMemories } from "@/hooks/use-profile-memories";
import {
  PROFILE_MEMORIES_EMPTY_BODY,
  PROFILE_MEMORIES_EMPTY_CTA,
  PROFILE_MEMORIES_EMPTY_HREF,
  PROFILE_MEMORIES_EMPTY_TITLE,
  PROFILE_MEMORIES_ERROR,
  PROFILE_MEMORIES_LOADING,
  PROFILE_MEMORIES_RETRY,
  PROFILE_MEMORIES_SECTION_SUBTITLE,
  PROFILE_MEMORIES_SECTION_TITLE,
  groupProfileMemoriesByStatus,
} from "@yunicity/utils";
import Link from "next/link";

type ProfileMemoriesSectionProps = {
  city: string;
};

export function ProfileMemoriesSection({ city }: ProfileMemoriesSectionProps) {
  const state = useProfileMemories();
  const groups = groupProfileMemoriesByStatus(state.items);

  return (
    <section
      id="profile-memories"
      className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
    >
      <header className="border-b border-neutral-100 px-5 py-4">
        <h2 className="text-lg font-bold text-neutral-900">{PROFILE_MEMORIES_SECTION_TITLE}</h2>
        <p className="mt-1 text-sm text-neutral-600">{PROFILE_MEMORIES_SECTION_SUBTITLE}</p>
      </header>

      <div className="px-5 py-5">
        {state.loading ? (
          <p className="text-sm text-neutral-500" role="status">
            {PROFILE_MEMORIES_LOADING}
          </p>
        ) : state.error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-center">
            <p className="text-sm text-red-800">{PROFILE_MEMORIES_ERROR}</p>
            <button
              type="button"
              onClick={() => void state.reload()}
              className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PROFILE_MEMORIES_RETRY}
            </button>
          </div>
        ) : state.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 px-4 py-6 text-center">
            <p className="text-sm font-medium text-neutral-800">{PROFILE_MEMORIES_EMPTY_TITLE}</p>
            <p className="mt-2 text-sm text-neutral-600">{PROFILE_MEMORIES_EMPTY_BODY}</p>
            <Link
              href={PROFILE_MEMORIES_EMPTY_HREF}
              className="mt-5 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-yunicity-primary/90"
            >
              {PROFILE_MEMORIES_EMPTY_CTA}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.status}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                  {group.label}
                </h3>
                <ul className="mt-3 space-y-3">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <ProfileMemoryCard item={item} city={city} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
