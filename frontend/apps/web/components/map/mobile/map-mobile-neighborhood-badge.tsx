"use client";

/** Badge quartier actif sur la carte mobile (MOBILE-MAP-01). */
export function MapMobileNeighborhoodBadge({ label }: { label: string | null }) {
  if (!label) return null;

  return (
    <div className="pointer-events-none absolute left-3 top-[8.5rem] z-10">
      <span className="inline-flex rounded-full border border-neutral-200/90 bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-md backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
