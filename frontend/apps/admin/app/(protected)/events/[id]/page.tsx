"use client";

import { EventDetailView } from "@/components/events/detail/event-detail-view";
import { Suspense } from "react";
import { useParams } from "next/navigation";

function EventDetailPageContent() {
  const params = useParams<{ id: string }>();
  return <EventDetailView eventId={params.id} />;
}

export default function EventDetailPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-stone-500">Chargement de la fiche événement…</p>}
    >
      <EventDetailPageContent />
    </Suspense>
  );
}
