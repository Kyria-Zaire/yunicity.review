"use client";

import { INTEREST_LABELS, PROFILE_INTERESTS } from "@yunicity/utils";

export function InterestPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(interest: string) {
    if (value.includes(interest)) {
      onChange(value.filter((item) => item !== interest));
      return;
    }
    onChange([...value, interest]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PROFILE_INTERESTS.map((interest) => {
        const selected = value.includes(interest);
        return (
          <button
            key={interest}
            type="button"
            onClick={() => toggle(interest)}
            className={`rounded-full px-3 py-1.5 text-sm transition-all ${
              selected
                ? "bg-yunicity-primary text-white shadow-sm"
                : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:ring-neutral-400"
            }`}
          >
            {INTEREST_LABELS[interest] ?? interest}
          </button>
        );
      })}
    </div>
  );
}
