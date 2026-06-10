"use client";

import { EventsWorkspace } from "@/components/events/events-workspace";
import { Suspense } from "react";

export default function EventsPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-stone-500">Chargement de l&apos;agenda…</p>}
    >
      <EventsWorkspace />
    </Suspense>
  );
}
