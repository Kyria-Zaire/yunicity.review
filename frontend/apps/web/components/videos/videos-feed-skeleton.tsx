export function VideosFeedSkeleton() {
  return (
    <div className="space-y-4 p-4" role="status" aria-label="Chargement des vidéos">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[70dvh] animate-pulse rounded-2xl bg-neutral-200 md:h-[calc(100dvh-8rem)]"
        />
      ))}
    </div>
  );
}
