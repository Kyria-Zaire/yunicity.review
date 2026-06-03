"use client";

import {
  PARTNERS_WORKSPACE_TAB_LABELS,
  type PartnersWorkspaceTabId,
} from "@/lib/partners-workspace";
import { cn } from "@/lib/utils";

export function PartnersWorkspaceTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: PartnersWorkspaceTabId;
  onTabChange: (tab: PartnersWorkspaceTabId) => void;
}) {
  const tabs = Object.entries(PARTNERS_WORKSPACE_TAB_LABELS) as [
    PartnersWorkspaceTabId,
    string,
  ][];

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-stone-200 pb-px"
      aria-label="Onglets partenaires"
    >
      {tabs.map(([id, label]) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium transition",
              active
                ? "border border-b-0 border-stone-200 bg-white text-stone-900"
                : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
            )}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
