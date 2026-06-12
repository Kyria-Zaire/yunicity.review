export function CreatorHubSkeleton() {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Chargement des contenus créateurs"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
        >
          <div className="aspect-[16/10] w-full animate-pulse bg-neutral-200/80" />
          <div className="flex flex-1 flex-col gap-3 px-5 py-4">
            <div className="flex gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-200/80" />
              <div className="h-5 w-20 animate-pulse rounded bg-neutral-200/70" />
            </div>
            <div className="h-6 w-4/5 animate-pulse rounded bg-neutral-200/80" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
