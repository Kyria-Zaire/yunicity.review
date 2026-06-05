"use client";

import { StaffDetailView } from "@/components/staff/detail/staff-detail-view";
import { Suspense, use } from "react";

export default function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-4xl py-8 text-sm text-stone-500">
          Chargement de la fiche staff…
        </p>
      }
    >
      <StaffDetailView staffId={id} />
    </Suspense>
  );
}
