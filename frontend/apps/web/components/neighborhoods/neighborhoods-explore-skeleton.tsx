"use client";

const SKELETON_CARD_COUNT = 12;

export function NeighborhoodsExploreSkeleton() {
  return (
    <div
      className="animate-pulse space-y-4"
      data-neighborhoods-explore-skeleton=""
      role="status"
      aria-label="Chargement du catalogue des quartiers"
    >
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <li key={index}>
            <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
              <div className="aspect-[3/2] bg-neutral-200" />
              <div className="space-y-3 p-3.5">
                <div className="h-5 w-2/3 rounded bg-neutral-200" />
                <div className="flex gap-1.5">
                  <div className="h-5 w-16 rounded-full bg-neutral-200" />
                  <div className="h-5 w-20 rounded-full bg-neutral-200" />
                </div>
                <div className="h-8 w-full rounded bg-neutral-200" />
                <div className="flex gap-2">
                  <div className="h-10 flex-1 rounded-xl bg-neutral-200" />
                  <div className="h-10 w-10 rounded-xl bg-neutral-200" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
