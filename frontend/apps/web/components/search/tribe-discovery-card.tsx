"use client";

import type { Tribe } from "@yunicity/types";
import {
  TRIBE_ROLE_LABELS,
  tribeCategoryLabel,
  tribeDiscoveryMeta,
  tribeDiscoveryTheme,
  tribeVisibilityLabel,
} from "@yunicity/utils";

type TribeDiscoveryCardProps = {
  tribe: Tribe;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export function TribeDiscoveryCard({
  tribe,
  actionLabel,
  onAction,
  disabled = false,
  compact = false,
}: TribeDiscoveryCardProps) {
  const theme = tribeDiscoveryTheme(tribe.category);
  const meta = tribeDiscoveryMeta(tribe);
  const showCover = Boolean(tribe.cover_image_url);

  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md">
      <div className="relative">
        {showCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tribe.cover_image_url!}
            alt=""
            className={compact ? "h-28 w-full object-cover" : "h-36 w-full object-cover"}
          />
        ) : (
          <div className={`flex ${compact ? "h-28" : "h-36"} w-full items-end bg-gradient-to-br ${theme.gradient} p-4`}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-700">
              <FallbackIcon icon={theme.icon} />
              {theme.badge}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
            {tribeCategoryLabel(tribe.category)}
          </span>
          <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            {tribeVisibilityLabel(tribe.visibility)}
          </span>
          {tribe.viewer_role ? (
            <span className="rounded-full bg-yunicity-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yunicity-primary">
              {TRIBE_ROLE_LABELS[tribe.viewer_role]}
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-neutral-900">{tribe.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
            {tribe.description || "Communauté locale pour agir et créer ensemble."}
          </p>
        </div>

        <p className="text-xs text-neutral-500">{meta.join(" · ")}</p>

        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

function FallbackIcon({ icon }: { icon: ReturnType<typeof tribeDiscoveryTheme>["icon"] }) {
  const className = "h-3.5 w-3.5";
  if (icon === "motion") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 19 9 11l4 3 6-9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (icon === "photo") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 15-4-4-6 6-3-3-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (icon === "heart") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (icon === "students") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 9 10-5 10 5-10 5-10-5Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (icon === "culture") {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 20h12M8 20V9l4-5 4 5v11" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 12h4" strokeLinecap="round" /></svg>;
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="3" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" /></svg>;
}
