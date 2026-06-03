"use client";

import { PassportOpsWorkspace } from "@/components/passport-ops/passport-ops-workspace";
import { Suspense } from "react";

export default function PassportOpsPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-stone-500">Chargement du workspace Passport Ops…</p>}
    >
      <PassportOpsWorkspace />
    </Suspense>
  );
}
