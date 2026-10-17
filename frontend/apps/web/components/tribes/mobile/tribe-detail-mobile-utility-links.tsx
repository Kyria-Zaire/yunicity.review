"use client";

import {
  TRIBE_DETAIL_MOBILE_ABOUT_TITLE,
  TRIBE_DETAIL_MOBILE_MODERATION_TITLE,
  TRIBE_DETAIL_MOBILE_PROJECTS_TITLE,
  TRIBE_DETAIL_MOBILE_RULES_TITLE,
} from "@yunicity/utils";
import { ChevronRight, FolderOpen, Hexagon, Info, Shield } from "lucide-react";

type TribeDetailMobileUtilityLinksProps = {
  onScrollProjects: () => void;
  onScrollAbout: () => void;
  onScrollRules: () => void;
  onScrollModeration: () => void;
};

export function TribeDetailMobileUtilityLinks({
  onScrollProjects,
  onScrollAbout,
  onScrollRules,
  onScrollModeration,
}: TribeDetailMobileUtilityLinksProps) {
  const rows = [
    { id: "projects", label: TRIBE_DETAIL_MOBILE_PROJECTS_TITLE, icon: FolderOpen, onClick: onScrollProjects },
    { id: "about", label: TRIBE_DETAIL_MOBILE_ABOUT_TITLE, icon: Info, onClick: onScrollAbout },
    { id: "rules", label: TRIBE_DETAIL_MOBILE_RULES_TITLE, icon: Shield, onClick: onScrollRules },
    { id: "moderation", label: TRIBE_DETAIL_MOBILE_MODERATION_TITLE, icon: Hexagon, onClick: onScrollModeration },
  ] as const;

  return (
    <nav
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      aria-label="Raccourcis tribu"
      data-tribe-detail-mobile-utility-links=""
    >
      {rows.map((row, index) => {
        const Icon = row.icon;
        return (
          <button
            key={row.id}
            type="button"
            onClick={row.onClick}
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-neutral-50 ${
              index > 0 ? "border-t border-neutral-100" : ""
            }`}
          >
            <Icon className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">{row.label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          </button>
        );
      })}
    </nav>
  );
}
