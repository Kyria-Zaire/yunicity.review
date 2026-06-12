import { CreatorHubScreen } from "@/components/creators/creator-hub-screen";
import { CREATOR_HUB_LOADING } from "@yunicity/utils";
import { Suspense } from "react";

export default function CreatorContentPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-8 text-sm text-neutral-500" role="status">
          {CREATOR_HUB_LOADING}
        </p>
      }
    >
      <CreatorHubScreen />
    </Suspense>
  );
}
