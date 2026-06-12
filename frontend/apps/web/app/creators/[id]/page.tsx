import { CreatorProfileScreen } from "@/components/creators/creator-profile-screen";
import { CreatorProfileSkeleton } from "@/components/creators/creator-profile-skeleton";
import { Suspense } from "react";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#F4F5F7]">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <CreatorProfileSkeleton />
          </div>
        </div>
      }
    >
      <CreatorProfileScreen creatorId={id} />
    </Suspense>
  );
}
