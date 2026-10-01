"use client";

import type { ProfileEditDraft } from "@yunicity/utils";
import {
  INTEREST_LABELS,
  PROFILE_DESKTOP_INTEREST_TONE,
  PROFILE_EDIT_DESKTOP_INTERESTS_SELECTED,
  PROFILE_EDIT_DESKTOP_INTERESTS_SUGGESTIONS,
  PROFILE_EDIT_INTERESTS_BODY,
  PROFILE_EDIT_INTERESTS_TITLE,
  PROFILE_INTERESTS,
} from "@yunicity/utils";
import { Plus, X } from "lucide-react";

const TONE_CLASS = {
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  sky: "border-cyan-200 bg-cyan-50 text-cyan-700",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
} as const;

type ProfileEditDesktopInterestsProps = {
  draft: ProfileEditDraft;
  onDraftChange: (patch: Partial<ProfileEditDraft>) => void;
  compact?: boolean;
};

/** Centres d'intérêt — sélectionnés + suggestions (maquette desktop). */
export function ProfileEditDesktopInterests({
  draft,
  onDraftChange,
  compact = false,
}: ProfileEditDesktopInterestsProps) {
  const selected = draft.interests;
  const suggestions = PROFILE_INTERESTS.filter((tag) => !selected.includes(tag));

  function remove(tag: string) {
    onDraftChange({ interests: selected.filter((item) => item !== tag) });
  }

  function add(tag: string) {
    onDraftChange({ interests: [...selected, tag] });
  }

  return (
    <section
      id="profile-edit-interests"
      className={`scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white shadow-sm ${compact ? "p-4" : "p-6"}`}
    >
      <h2 className="text-base font-bold text-neutral-900">{PROFILE_EDIT_INTERESTS_TITLE}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{PROFILE_EDIT_INTERESTS_BODY}</p>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {PROFILE_EDIT_DESKTOP_INTERESTS_SELECTED}
        </p>
        {selected.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-400">Aucun centre d&apos;intérêt sélectionné.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {selected.map((tag) => {
              const tone = PROFILE_DESKTOP_INTEREST_TONE[tag] ?? "neutral";
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${TONE_CLASS[tone]}`}
                >
                  {INTEREST_LABELS[tag] ?? tag}
                  <button
                    type="button"
                    onClick={() => remove(tag)}
                    className="rounded-full p-0.5 transition hover:bg-black/5"
                    aria-label={`Retirer ${INTEREST_LABELS[tag] ?? tag}`}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {suggestions.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {PROFILE_EDIT_DESKTOP_INTERESTS_SUGGESTIONS}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => add(tag)}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-yunicity-primary/40 hover:text-yunicity-primary"
              >
                {INTEREST_LABELS[tag] ?? tag}
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
