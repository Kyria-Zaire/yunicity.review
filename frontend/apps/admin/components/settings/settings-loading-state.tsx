export function SettingsLoadingState() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-72 animate-pulse rounded-lg bg-stone-100" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-stone-100" />
      </div>
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-2xl bg-stone-100" />
      ))}
    </div>
  );
}
