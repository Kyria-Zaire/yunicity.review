"use client";

import { CreatorContentStatusBadge } from "@/components/creator-content-status-badge";
import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import { adminCreatorContentAuthorLabel } from "@yunicity/utils";
import Link from "next/link";

interface CreatorContentDetailHeaderProps {
  content: PartnerCreatorContentAdmin;
  backHref: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function CreatorContentDetailHeader({
  content,
  backHref,
  isRefreshing,
  onRefresh,
}: CreatorContentDetailHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
      <div className="space-y-3">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
        >
          ← Retour aux contenus créateurs
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{content.title}</h1>
          <p className="mt-1 text-sm text-stone-600">
            {content.organization.name} · {content.organization.city}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Auteur : {adminCreatorContentAuthorLabel(content.author)}
          </p>
        </div>
        <CreatorContentStatusBadge status={content.status} />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRefreshing ? "Actualisation…" : "Actualiser"}
      </button>
    </header>
  );
}
