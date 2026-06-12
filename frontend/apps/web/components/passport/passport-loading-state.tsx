"use client";

export function PassportLoadingState() {
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6" role="status" aria-live="polite">
      <div className="h-48 animate-pulse rounded-3xl bg-neutral-200/80" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-neutral-200/70" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-neutral-200/70" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl bg-neutral-200/70" />
        <div className="h-56 animate-pulse rounded-2xl bg-neutral-200/70" />
      </div>
    </div>
  );
}
