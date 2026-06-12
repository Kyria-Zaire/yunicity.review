export function CreatorDirectorySkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200/90 bg-white"
        >
          <div className="flex items-start gap-4 p-5">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-neutral-200/80" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 rounded bg-neutral-200/80" />
              <div className="h-4 w-1/2 rounded bg-neutral-200/60" />
              <div className="h-4 w-full rounded bg-neutral-200/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
