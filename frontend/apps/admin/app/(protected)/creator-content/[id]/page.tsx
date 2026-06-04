"use client";

import { CreatorContentDetailView } from "@/components/creator-content/detail/creator-content-detail-view";
import { Suspense } from "react";
import { useParams } from "next/navigation";

function CreatorContentDetailPageContent() {
  const params = useParams<{ id: string }>();
  return <CreatorContentDetailView contentId={params.id} />;
}

export default function CreatorContentDetailPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-stone-500">Chargement de la fiche contenu…</p>}
    >
      <CreatorContentDetailPageContent />
    </Suspense>
  );
}
