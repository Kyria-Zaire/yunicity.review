"use client";

import { buildModerationListPath } from "@yunicity/utils";
import Link from "next/link";
import { use } from "react";

export default function ModerationReportDetailPlaceholderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-8">
      <Link
        href={buildModerationListPath({ status: "pending" })}
        className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
      >
        ← Retour aux signalements
      </Link>
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-lg font-medium text-stone-900">Fiche signalement — ADMIN-07C</p>
        <p className="mt-2 text-sm text-stone-500">
          La vue 360° du signalement <span className="font-mono text-xs">{id}</span> sera livrée au
          ticket suivant.
        </p>
      </div>
    </div>
  );
}
