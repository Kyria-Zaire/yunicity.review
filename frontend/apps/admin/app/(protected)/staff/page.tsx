"use client";

import { StaffWorkspace } from "@/components/staff/staff-workspace";
import { Suspense } from "react";

export default function StaffPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-6xl py-8 text-sm text-stone-500">
          Chargement du staff…
        </p>
      }
    >
      <StaffWorkspace />
    </Suspense>
  );
}
