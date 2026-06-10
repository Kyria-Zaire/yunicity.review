export function AnalyticsLoadingState() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-stone-100" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-stone-100" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="h-80 animate-pulse rounded-2xl bg-stone-100" />
        <div className="h-80 animate-pulse rounded-2xl bg-stone-100" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl bg-stone-100" />
        ))}
      </div>
    </div>
  );
}
