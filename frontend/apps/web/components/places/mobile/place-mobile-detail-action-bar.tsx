"use client";

import {
  PLACE_DETAIL_MOBILE_BOOKMARK,
  PLACE_DETAIL_MOBILE_POST_CTA,
  TERRITORY_MOBILE_COMPOSER_LOGIN_REQUIRED,
} from "@yunicity/utils";
import { Bookmark, ImagePlus } from "lucide-react";

type PlaceMobileDetailActionBarProps = {
  isMember: boolean;
  isAuthenticated: boolean;
  onToggleMembership: () => void;
  onPublishClick: () => void;
};

/** Barre d'action fixe bas détail lieu mobile (MOBILE-LIEUX-02). */
export function PlaceMobileDetailActionBar({
  isMember,
  isAuthenticated,
  onToggleMembership,
  onPublishClick,
}: PlaceMobileDetailActionBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[var(--z-chrome)] border-t border-neutral-200/90 bg-white/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/90"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <button
          type="button"
          onClick={onToggleMembership}
          aria-pressed={isMember}
          className={`inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${
            isMember
              ? "border-yunicity-primary bg-violet-50 text-yunicity-primary"
              : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
          }`}
        >
          <Bookmark
            className={`h-4 w-4 ${isMember ? "fill-current" : ""}`}
            strokeWidth={1.75}
            aria-hidden
          />
          {PLACE_DETAIL_MOBILE_BOOKMARK}
        </button>

        <button
          type="button"
          disabled={!isMember}
          title={
            !isAuthenticated
              ? TERRITORY_MOBILE_COMPOSER_LOGIN_REQUIRED
              : !isMember
                ? "Enregistrez ce lieu pour publier"
                : PLACE_DETAIL_MOBILE_POST_CTA
          }
          onClick={onPublishClick}
          className={`inline-flex min-w-0 flex-[1.35] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition ${
            isMember
              ? "bg-yunicity-primary hover:bg-yunicity-primary-hover"
              : "cursor-not-allowed bg-yunicity-primary/40"
          }`}
        >
          <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {PLACE_DETAIL_MOBILE_POST_CTA}
        </button>
      </div>
    </div>
  );
}
