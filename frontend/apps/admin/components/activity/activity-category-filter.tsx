import type { AdminActivityFilterCategory } from "@yunicity/types";

import { ACTIVITY_CATEGORY_FILTER_OPTIONS } from "@/lib/activity-display";

interface ActivityCategoryFilterProps {
  value: AdminActivityFilterCategory;
  onChange: (value: AdminActivityFilterCategory) => void;
}

export function ActivityCategoryFilter({ value, onChange }: ActivityCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIVITY_CATEGORY_FILTER_OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value as AdminActivityFilterCategory)}
            className={
              active
                ? "rounded-full border border-yunicity-primary bg-yunicity-primary/10 px-3 py-1.5 text-xs font-medium text-yunicity-primary"
                : "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
