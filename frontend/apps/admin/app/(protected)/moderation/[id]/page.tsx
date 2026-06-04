"use client";

import { ModerationReportDetailView } from "@/components/moderation/detail/moderation-report-detail-view";
import { Suspense, use } from "react";

export default function ModerationReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-4xl py-8 text-sm text-stone-500">
          Chargement du signalement…
        </p>
      }
    >
      <ModerationReportDetailView reportId={id} />
    </Suspense>
  );
}
