"use client";

export function NeighborhoodV2Skeleton() {
  return (
    <div className="mx-auto w-full max-w-[1100px] animate-pulse space-y-6 px-3 pb-12 sm:px-4 lg:px-6">
      <div className="h-4 w-48 rounded bg-neutral-200" />
      <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
        <div className="aspect-[16/9] min-h-[240px] bg-neutral-200" />
        <div className="space-y-4 px-6 py-6">
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-8 w-2/3 rounded bg-neutral-200" />
          <div className="h-4 w-1/2 rounded bg-neutral-200" />
          <div className="h-11 w-full rounded-full bg-neutral-200" />
        </div>
      </div>
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6">
        <div className="h-5 w-40 rounded bg-neutral-200" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-neutral-200" />
          <div className="h-3 w-full rounded bg-neutral-200" />
          <div className="h-3 w-4/5 rounded bg-neutral-200" />
        </div>
      </div>
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6">
        <div className="h-5 w-36 rounded bg-neutral-200" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="h-24 rounded-2xl bg-neutral-200" />
          <div className="h-24 rounded-2xl bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
