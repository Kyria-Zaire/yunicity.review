"use client";

import type { AdminStaffListState } from "@/lib/staff-url";
import {
  ADMIN_STAFF_ACTIVE_FILTER_OPTIONS,
  ADMIN_STAFF_ROLE_FILTER_OPTIONS,
} from "@yunicity/utils";

interface StaffFiltersProps {
  state: AdminStaffListState;
  isLoading: boolean;
  onRoleChange: (role: AdminStaffListState["role"]) => void;
  onActiveChange: (active: AdminStaffListState["active"]) => void;
}

export function StaffFilters({
  state,
  isLoading,
  onRoleChange,
  onActiveChange,
}: StaffFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <label className="block text-sm">
        <span className="font-medium text-stone-800">Rôle</span>
        <select
          value={state.role}
          onChange={(e) => onRoleChange(e.target.value as AdminStaffListState["role"])}
          disabled={isLoading}
          className="mt-1 block min-w-[200px] rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          {ADMIN_STAFF_ROLE_FILTER_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-stone-800">Statut compte</span>
        <select
          value={state.active}
          onChange={(e) => onActiveChange(e.target.value as AdminStaffListState["active"])}
          disabled={isLoading}
          className="mt-1 block min-w-[200px] rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          {ADMIN_STAFF_ACTIVE_FILTER_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
