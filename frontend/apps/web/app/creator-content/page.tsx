import { CreatorHubScreen } from "@/components/creators/creator-hub-screen";
import { CreatorHubSkeleton } from "@/components/creators/creator-hub-skeleton";
import { Suspense } from "react";

export default function CreatorContentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#F4F5F7]">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <CreatorHubSkeleton />
          </div>
        </div>
      }
    >
      <CreatorHubScreen />
    </Suspense>
  );
}
