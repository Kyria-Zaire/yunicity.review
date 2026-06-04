"use client";

import { CreatorContentWorkspace } from "@/components/creator-content/creator-content-workspace";
import { Suspense } from "react";

export default function CreatorContentPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-stone-500">Chargement du workspace contenus créateurs…</p>
      }
    >
      <CreatorContentWorkspace />
    </Suspense>
  );
}
