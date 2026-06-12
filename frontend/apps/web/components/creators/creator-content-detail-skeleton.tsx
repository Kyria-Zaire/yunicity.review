export function CreatorContentDetailSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Chargement de l'histoire">
      <div className="flex flex-wrap gap-2">
        <div className="h-5 w-16 rounded-full bg-neutral-200/80" />
        <div className="h-5 w-20 rounded bg-neutral-200/70" />
        <div className="h-5 w-28 rounded bg-neutral-200/70" />
        <div className="h-5 w-24 rounded bg-neutral-200/70" />
      </div>
      <div className="mt-6 h-10 w-full max-w-2xl rounded bg-neutral-200/80 sm:h-12" />
      <div className="mt-3 h-5 w-48 rounded bg-neutral-200/70" />
      <div className="mt-8 aspect-[16/9] w-full max-w-4xl rounded-2xl bg-neutral-200/80" />
      <div className="mx-auto mt-10 max-w-prose space-y-4">
        <div className="h-4 w-full rounded bg-neutral-200/70" />
        <div className="h-4 w-full rounded bg-neutral-200/70" />
        <div className="h-4 w-11/12 rounded bg-neutral-200/70" />
        <div className="h-4 w-full rounded bg-neutral-200/70" />
        <div className="h-4 w-10/12 rounded bg-neutral-200/70" />
      </div>
    </div>
  );
}
