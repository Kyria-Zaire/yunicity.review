"use client";

import type { ProfileEditCompletionItem } from "@yunicity/utils";
import { PROFILE_EDIT_COMPLETION_TITLE } from "@yunicity/utils";
import { Check, Circle } from "lucide-react";

type ProfileEditMobileCompletionProps = {
  percent: number;
  items: ProfileEditCompletionItem[];
};

/** Progression complétion profil mobile (MOBILE-PROFILE-01). */
export function ProfileEditMobileCompletion({ percent, items }: ProfileEditMobileCompletionProps) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_COMPLETION_TITLE}</h2>
        <span className="text-xs font-semibold text-yunicity-primary">{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-yunicity-primary transition-all"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <Check className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            )}
            <span className={item.done ? "text-neutral-700" : "text-neutral-500"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
