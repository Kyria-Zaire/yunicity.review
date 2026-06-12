export function CreatorProfileSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="aspect-[21/9] w-full rounded-2xl bg-neutral-200/80" />
      <div className="mt-6 flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 rounded-2xl bg-neutral-200/80" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-2/3 rounded-lg bg-neutral-200/80" />
          <div className="h-4 w-1/3 rounded bg-neutral-200/60" />
          <div className="h-4 w-full max-w-md rounded bg-neutral-200/60" />
        </div>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-64 rounded-2xl bg-neutral-200/70" />
        ))}
      </div>
    </div>
  );
}
