"use client";

import { OfferDetailView } from "@/components/passport-offers/detail/offer-detail-view";
import { Suspense } from "react";
import { useParams } from "next/navigation";

function OfferDetailPageContent() {
  const params = useParams<{ id: string }>();
  return <OfferDetailView offerId={params.id} />;
}

export default function PassportOfferDetailPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-stone-500">Chargement de la fiche offre…</p>}
    >
      <OfferDetailPageContent />
    </Suspense>
  );
}
