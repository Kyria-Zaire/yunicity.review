"use client";

import { ModerationWorkspace } from "@/components/moderation/moderation-workspace";
import { Suspense } from "react";

export default function ModerationPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-stone-500">Chargement du workspace Modération…</p>}
    >
      <ModerationWorkspace />
    </Suspense>
  );
}
