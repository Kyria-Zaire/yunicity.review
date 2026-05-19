export function FeedLoadingState() {
  return (
    <div className="space-y-6 py-8" role="status" aria-live="polite">
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="animate-pulse rounded-2xl border border-yunicity-border bg-white p-6"
        >
          <div className="mb-4 h-10 w-10 rounded-full bg-neutral-100" />
          <div className="mb-2 h-4 w-1/3 rounded bg-neutral-100" />
          <div className="mb-2 h-3 w-full rounded bg-neutral-100" />
          <div className="h-3 w-4/5 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
