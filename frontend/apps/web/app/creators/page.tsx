import { CreatorDirectoryScreen } from "@/components/creators/creator-directory-screen";
import { CreatorDirectorySkeleton } from "@/components/creators/creator-directory-skeleton";
import { Suspense } from "react";

export default function CreatorsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#F4F5F7]">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <CreatorDirectorySkeleton />
          </div>
        </div>
      }
    >
      <CreatorDirectoryScreen />
    </Suspense>
  );
}
