"use client";

import { PartnersWorkspace } from "@/components/partners/partners-workspace";
import { Suspense } from "react";

export default function PartnersWorkspacePage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-stone-500">Chargement du workspace partenaires…</p>}
    >
      <PartnersWorkspace />
    </Suspense>
  );
}
