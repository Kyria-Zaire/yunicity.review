import { CreatorContentDetailScreen } from "@/components/creators/creator-content-detail-screen";
import { CreatorContentDetailSkeleton } from "@/components/creators/creator-content-detail-skeleton";
import { Suspense } from "react";

export default async function CreatorContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#F4F5F7]">
          <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
            <CreatorContentDetailSkeleton />
          </div>
        </div>
      }
    >
      <CreatorContentDetailScreen contentId={id} />
    </Suspense>
  );
}
