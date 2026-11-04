"use client";

import { PassportOfferDetailScreen } from "@/components/passport/offer-detail/passport-offer-detail-screen";
import { ProtectedRoute } from "@/components/protected-route";
import { use } from "react";

type PassportOfferDetailPageProps = {
  params: Promise<{ offerId: string }>;
};

export default function PassportOfferDetailPage({ params }: PassportOfferDetailPageProps) {
  const { offerId } = use(params);
  return (
    <ProtectedRoute>
      <PassportOfferDetailScreen offerId={offerId} />
    </ProtectedRoute>
  );
}
